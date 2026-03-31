"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiSaveLine,
  RiAddLine,
  RiDeleteBinLine,
  RiEditLine,
  RiQuestionLine,
  RiContactsLine,
  RiFileTextLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiCloseLine,
  RiCheckLine,
  RiPhoneLine,
  RiMailLine,
  RiWhatsappLine,
  RiMapPinLine,
  RiTimeLine,
  RiInstagramLine,
  RiFacebookLine,
  RiTwitterXLine,
  RiYoutubeLine,
  RiGlobalLine,
  RiShieldLine,
  RiRefundLine,
  RiTruckLine,
  RiInformationLine,
  RiAlertLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import dynamic from "next/dynamic";
import axios from "axios";
import toast from "react-hot-toast";

const RichTextEditor = dynamic(() => import("@/components/ui/RichTextEditor").then(m => m.default), { ssr: false, loading: () => <div className="h-64 rounded-xl border border-neutral-200 bg-neutral-50 animate-pulse" /> });

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: "Products" | "Shipping" | "Returns" | "General";
  sortOrder: number;
}

interface ContactConfig {
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  businessHours: string;
  mapEmbedUrl: string;
  social: {
    instagram: string;
    facebook: string;
    twitter: string;
    youtube: string;
    whatsapp: string;
  };
}

interface PageContent {
  title: string;
  content: string;
  lastUpdated: string;
}

interface SiteConfigRecord {
  _id?: string;
  key: string;
  value: unknown;
}

type TabId = "faq" | "contact" | "terms" | "privacy" | "refund" | "shipping" | "about";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "faq", label: "FAQ Manager", icon: RiQuestionLine },
  { id: "contact", label: "Contact Info", icon: RiContactsLine },
  { id: "terms", label: "Terms & Conditions", icon: RiFileTextLine },
  { id: "privacy", label: "Privacy Policy", icon: RiShieldLine },
  { id: "refund", label: "Refund Policy", icon: RiRefundLine },
  { id: "shipping", label: "Shipping Policy", icon: RiTruckLine },
  { id: "about", label: "About Us", icon: RiInformationLine },
];

const FAQ_CATEGORIES: FAQItem["category"][] = [
  "Products",
  "Shipping",
  "Returns",
  "General",
];

const PAGE_TAB_IDS = ["terms", "privacy", "refund", "shipping", "about"] as const;
type PageKey = (typeof PAGE_TAB_IDS)[number];

const PAGE_LABELS: Record<PageKey, string> = {
  terms: "Terms & Conditions",
  privacy: "Privacy Policy",
  refund: "Refund Policy",
  shipping: "Shipping Policy",
  about: "About Us",
};

const EMPTY_FAQ: Omit<FAQItem, "id" | "sortOrder"> = {
  question: "",
  answer: "",
  category: "General",
};

const EMPTY_CONTACT: ContactConfig = {
  email: "",
  phone: "",
  whatsapp: "",
  address: "",
  businessHours: "",
  mapEmbedUrl: "",
  social: {
    instagram: "",
    facebook: "",
    twitter: "",
    youtube: "",
    whatsapp: "",
  },
};

const EMPTY_PAGE: PageContent = { title: "", content: "", lastUpdated: "" };

function generateId(): string {
  return `faq_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminSiteSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("faq");
  const [loading, setLoading] = useState(true);

  // FAQ state
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [editingFaq, setEditingFaq] = useState<FAQItem | null>(null);
  const [faqForm, setFaqForm] = useState<Omit<FAQItem, "id" | "sortOrder">>(EMPTY_FAQ);
  const [showFaqForm, setShowFaqForm] = useState(false);
  const [savingFaq, setSavingFaq] = useState(false);
  const [faqDirty, setFaqDirty] = useState(false);

  // Contact state
  const [contact, setContact] = useState<ContactConfig>(EMPTY_CONTACT);
  const [contactSnapshot, setContactSnapshot] = useState<string>("");
  const [savingContact, setSavingContact] = useState(false);

  // Pages state
  const [pages, setPages] = useState<Record<PageKey, PageContent>>({
    terms: { ...EMPTY_PAGE },
    privacy: { ...EMPTY_PAGE },
    refund: { ...EMPTY_PAGE },
    shipping: { ...EMPTY_PAGE },
    about: { ...EMPTY_PAGE },
  });
  const [pageSnapshots, setPageSnapshots] = useState<Record<PageKey, string>>({
    terms: "",
    privacy: "",
    refund: "",
    shipping: "",
    about: "",
  });
  const [savingPage, setSavingPage] = useState<PageKey | null>(null);

  // Tab scroll container ref
  const tabsRef = useRef<HTMLDivElement>(null);

  // ---------------------------------------------------------------------------
  // Unsaved changes helpers
  // ---------------------------------------------------------------------------

  const isContactDirty = JSON.stringify(contact) !== contactSnapshot;

  const isPageDirty = (key: PageKey) => JSON.stringify(pages[key]) !== pageSnapshots[key];

  const activeTabDirty =
    (activeTab === "faq" && faqDirty) ||
    (activeTab === "contact" && isContactDirty) ||
    (PAGE_TAB_IDS.includes(activeTab as PageKey) && isPageDirty(activeTab as PageKey));

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get<{ data: SiteConfigRecord[] }>("/api/admin/site-config");
      const configs = res.data.data;

      configs.forEach((cfg) => {
        if (cfg.key === "faq") {
          const val = cfg.value as { items?: FAQItem[] };
          if (val?.items) setFaqItems(val.items);
        } else if (cfg.key === "contact") {
          const val = cfg.value as Partial<ContactConfig>;
          setContact((prev) => {
            const merged = {
              ...prev,
              ...val,
              social: { ...prev.social, ...(val.social ?? {}) },
            };
            setContactSnapshot(JSON.stringify(merged));
            return merged;
          });
        } else if (PAGE_TAB_IDS.includes(cfg.key as PageKey)) {
          const val = cfg.value as Partial<PageContent>;
          setPages((prev) => {
            const updated = { ...prev, [cfg.key]: { ...EMPTY_PAGE, ...val } };
            setPageSnapshots((s) => ({
              ...s,
              [cfg.key]: JSON.stringify(updated[cfg.key as PageKey]),
            }));
            return updated;
          });
        }
      });
    } catch {
      toast.error("Failed to load site configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ---------------------------------------------------------------------------
  // FAQ handlers
  // ---------------------------------------------------------------------------

  const openFaqCreate = () => {
    setEditingFaq(null);
    setFaqForm({ ...EMPTY_FAQ });
    setShowFaqForm(true);
  };

  const openFaqEdit = (item: FAQItem) => {
    setEditingFaq(item);
    setFaqForm({
      question: item.question,
      answer: item.answer,
      category: item.category,
    });
    setShowFaqForm(true);
  };

  const closeFaqForm = () => {
    setShowFaqForm(false);
    setEditingFaq(null);
    setFaqForm({ ...EMPTY_FAQ });
  };

  const saveFaqItems = async (items: FAQItem[]) => {
    setSavingFaq(true);
    try {
      await axios.post("/api/admin/site-config", {
        key: "faq",
        value: { items },
      });
      setFaqItems(items);
      setFaqDirty(false);
      toast.success("FAQ saved");
    } catch {
      toast.error("Failed to save FAQ");
    } finally {
      setSavingFaq(false);
    }
  };

  const handleFaqSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqForm.question.trim() || !faqForm.answer.trim()) {
      toast.error("Question and answer are required");
      return;
    }

    let updated: FAQItem[];

    if (editingFaq) {
      updated = faqItems.map((f) =>
        f.id === editingFaq.id
          ? { ...f, question: faqForm.question, answer: faqForm.answer, category: faqForm.category }
          : f,
      );
    } else {
      const newItem: FAQItem = {
        id: generateId(),
        question: faqForm.question,
        answer: faqForm.answer,
        category: faqForm.category,
        sortOrder: faqItems.length > 0 ? Math.max(...faqItems.map((f) => f.sortOrder)) + 1 : 0,
      };
      updated = [...faqItems, newItem];
    }

    await saveFaqItems(updated);
    closeFaqForm();
  };

  // FAQ delete state
  const [deleteFaqTarget, setDeleteFaqTarget] = useState<string | null>(null);

  const deleteFaqItem = async (id: string) => {
    const updated = faqItems
      .filter((f) => f.id !== id)
      .map((f, i) => ({ ...f, sortOrder: i }));
    await saveFaqItems(updated);
    setDeleteFaqTarget(null);
  };

  const moveFaqItem = async (id: string, direction: "up" | "down") => {
    const idx = faqItems.findIndex((f) => f.id === id);
    if (idx < 0) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= faqItems.length) return;

    const items = [...faqItems];
    const temp = items[idx];
    items[idx] = items[targetIdx];
    items[targetIdx] = temp;
    const reordered = items.map((f, i) => ({ ...f, sortOrder: i }));
    await saveFaqItems(reordered);
  };

  // ---------------------------------------------------------------------------
  // Contact handlers
  // ---------------------------------------------------------------------------

  const handleSaveContact = async () => {
    setSavingContact(true);
    try {
      await axios.post("/api/admin/site-config", {
        key: "contact",
        value: contact,
      });
      setContactSnapshot(JSON.stringify(contact));
      toast.success("Contact details saved");
    } catch {
      toast.error("Failed to save contact details");
    } finally {
      setSavingContact(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Page handlers
  // ---------------------------------------------------------------------------

  const handleSavePage = async (key: PageKey) => {
    const page = pages[key];
    if (!page.content.trim()) {
      toast.error("Page content cannot be empty");
      return;
    }
    setSavingPage(key);
    try {
      const payload: PageContent = {
        ...page,
        title: page.title || PAGE_LABELS[key],
        lastUpdated: new Date().toISOString(),
      };
      await axios.post("/api/admin/site-config", {
        key,
        value: payload,
      });
      setPages((prev) => ({ ...prev, [key]: payload }));
      setPageSnapshots((prev) => ({ ...prev, [key]: JSON.stringify(payload) }));
      toast.success(`${PAGE_LABELS[key]} saved`);
    } catch {
      toast.error(`Failed to save ${PAGE_LABELS[key]}`);
    } finally {
      setSavingPage(null);
    }
  };

  // ---------------------------------------------------------------------------
  // Loading skeleton
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="p-8">
        <div className="mb-8">
          <Skeleton className="h-7 w-48" rounded="lg" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-36 shrink-0" rounded="lg" />
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-neutral-100 p-6 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" rounded="lg" />
          ))}
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-neutral-900">Site Settings</h1>
        <p className="text-sm text-neutral-400 mt-0.5">
          Manage FAQ, contact information, and static pages
        </p>
      </div>

      {/* Tabs */}
      <div
        ref={tabsRef}
        className="flex gap-1 mb-6 border-b border-neutral-200 overflow-x-auto scrollbar-hide"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = activeTab === id;
          // Determine if this tab has unsaved changes
          let dirty = false;
          if (id === "faq") dirty = faqDirty;
          else if (id === "contact") dirty = isContactDirty;
          else if (PAGE_TAB_IDS.includes(id as PageKey)) dirty = isPageDirty(id as PageKey);

          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? "text-[#E84672]"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              <Icon size={16} />
              {label}
              {dirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" title="Unsaved changes" />
              )}
              {isActive && (
                <motion.div
                  layoutId="settings-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#E84672] rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Unsaved changes banner */}
      <AnimatePresence>
        {activeTabDirty && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4"
          >
            <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
              <RiAlertLine size={16} className="shrink-0" />
              You have unsaved changes in this section.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "faq" && (
            <FAQTab
              items={faqItems}
              showForm={showFaqForm}
              editingFaq={editingFaq}
              faqForm={faqForm}
              setFaqForm={setFaqForm}
              saving={savingFaq}
              onOpenCreate={openFaqCreate}
              onOpenEdit={openFaqEdit}
              onCloseForm={closeFaqForm}
              onSubmit={handleFaqSubmit}
              onDelete={deleteFaqItem}
              onMove={moveFaqItem}
              deleteFaqTarget={deleteFaqTarget}
              setDeleteFaqTarget={setDeleteFaqTarget}
            />
          )}
          {activeTab === "contact" && (
            <ContactTab
              contact={contact}
              setContact={setContact}
              saving={savingContact}
              onSave={handleSaveContact}
            />
          )}
          {PAGE_TAB_IDS.includes(activeTab as PageKey) && (
            <PageEditorTab
              pageKey={activeTab as PageKey}
              page={pages[activeTab as PageKey]}
              setPages={setPages}
              saving={savingPage === (activeTab as PageKey)}
              onSave={() => handleSavePage(activeTab as PageKey)}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ===========================================================================
// FAQ Tab
// ===========================================================================

function FAQTab({
  items,
  showForm,
  editingFaq,
  faqForm,
  setFaqForm,
  saving,
  onOpenCreate,
  onOpenEdit,
  onCloseForm,
  onSubmit,
  onDelete,
  onMove,
  deleteFaqTarget,
  setDeleteFaqTarget,
}: {
  items: FAQItem[];
  showForm: boolean;
  editingFaq: FAQItem | null;
  faqForm: Omit<FAQItem, "id" | "sortOrder">;
  setFaqForm: React.Dispatch<React.SetStateAction<Omit<FAQItem, "id" | "sortOrder">>>;
  saving: boolean;
  onOpenCreate: () => void;
  onOpenEdit: (item: FAQItem) => void;
  onCloseForm: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, direction: "up" | "down") => void;
  deleteFaqTarget: string | null;
  setDeleteFaqTarget: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const categoryColor: Record<FAQItem["category"], string> = {
    Products: "bg-blue-50 text-blue-700",
    Shipping: "bg-amber-50 text-amber-700",
    Returns: "bg-rose-50 text-rose-700",
    General: "bg-neutral-100 text-neutral-600",
  };

  const deleteItem = items.find((f) => f.id === deleteFaqTarget);

  return (
    <div>
      {/* Header + Add button */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-neutral-500">{items.length} FAQ items</p>
        <Button leftIcon={<RiAddLine />} size="sm" onClick={onOpenCreate}>
          Add New FAQ
        </Button>
      </div>

      {/* FAQ list */}
      {items.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-neutral-100">
          <RiQuestionLine size={40} className="mx-auto text-neutral-300 mb-3" />
          <p className="text-neutral-500 text-sm mb-4">No FAQ items yet. Add one to get started.</p>
          <Button leftIcon={<RiAddLine />} size="sm" onClick={onOpenCreate}>
            Add New FAQ
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {items.map((item, idx) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-2xl border border-neutral-100 p-5"
              >
                <div className="flex items-start gap-4">
                  {/* Reorder buttons */}
                  <div className="flex flex-col gap-0.5 pt-0.5">
                    <button
                      onClick={() => onMove(item.id, "up")}
                      disabled={idx === 0 || saving}
                      className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <RiArrowUpLine size={14} />
                    </button>
                    <button
                      onClick={() => onMove(item.id, "down")}
                      disabled={idx === items.length - 1 || saving}
                      className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <RiArrowDownLine size={14} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${categoryColor[item.category]}`}
                      >
                        {item.category}
                      </span>
                      <span className="text-xs text-neutral-300">#{item.sortOrder}</span>
                    </div>
                    <p className="text-sm font-semibold text-neutral-800">{item.question}</p>
                    <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{item.answer}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onOpenEdit(item)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 text-neutral-400 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <RiEditLine size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteFaqTarget(item.id)}
                      disabled={saving}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-40"
                      title="Delete"
                    >
                      <RiDeleteBinLine size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Create / Edit FAQ Modal */}
      <Modal
        isOpen={showForm}
        onClose={onCloseForm}
        title={editingFaq ? "Edit FAQ Item" : "New FAQ Item"}
        size="lg"
      >
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <Input
            label="Question"
            value={faqForm.question}
            onChange={(e) => setFaqForm((f) => ({ ...f, question: e.target.value }))}
            placeholder="e.g. How do I track my order?"
            required
          />
          <Textarea
            label="Answer"
            value={faqForm.answer}
            onChange={(e) => setFaqForm((f) => ({ ...f, answer: e.target.value }))}
            placeholder="Provide a clear, helpful answer..."
            required
            className="min-h-[120px]"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Category
              </label>
              <select
                value={faqForm.category}
                onChange={(e) =>
                  setFaqForm((f) => ({
                    ...f,
                    category: e.target.value as FAQItem["category"],
                  }))
                }
                className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] focus:ring-2 focus:ring-[#E84672]/30 bg-white transition-all duration-200"
              >
                {FAQ_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-neutral-100">
            <Button type="submit" isLoading={saving} leftIcon={<RiCheckLine />}>
              {editingFaq ? "Save Changes" : "Add FAQ"}
            </Button>
            <Button type="button" variant="outline" onClick={onCloseForm}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete FAQ Confirmation Modal */}
      <Modal
        isOpen={!!deleteFaqTarget}
        onClose={() => setDeleteFaqTarget(null)}
        title="Delete FAQ Item"
        size="sm"
      >
        <div className="p-6">
          <p className="text-sm text-neutral-600 mb-2">
            Are you sure you want to delete the FAQ item{" "}
            <span className="font-semibold text-neutral-800">
              &quot;{deleteItem?.question}&quot;
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-5">
            <Button
              variant="danger"
              onClick={() => deleteFaqTarget && onDelete(deleteFaqTarget)}
              isLoading={saving}
              leftIcon={<RiDeleteBinLine />}
            >
              Delete
            </Button>
            <Button variant="outline" onClick={() => setDeleteFaqTarget(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ===========================================================================
// Contact Tab
// ===========================================================================

function ContactTab({
  contact,
  setContact,
  saving,
  onSave,
}: {
  contact: ContactConfig;
  setContact: React.Dispatch<React.SetStateAction<ContactConfig>>;
  saving: boolean;
  onSave: () => void;
}) {
  const updateField = (field: keyof Omit<ContactConfig, "social">, value: string) => {
    setContact((c) => ({ ...c, [field]: value }));
  };

  const updateSocial = (field: keyof ContactConfig["social"], value: string) => {
    setContact((c) => ({
      ...c,
      social: { ...c.social, [field]: value },
    }));
  };

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-100">
        <h2 className="font-semibold text-neutral-800 mb-5">Contact Information</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              value={contact.email}
              onChange={(e) => updateField("email", e.target.value)}
              placeholder="support@lotusmart.com"
              leftIcon={<RiMailLine />}
            />
            <Input
              label="Phone Number"
              value={contact.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              placeholder="+91 98765 43210"
              leftIcon={<RiPhoneLine />}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="WhatsApp Number"
              value={contact.whatsapp}
              onChange={(e) => updateField("whatsapp", e.target.value)}
              placeholder="+91 98765 43210"
              leftIcon={<RiWhatsappLine />}
            />
            <Input
              label="Business Hours"
              value={contact.businessHours}
              onChange={(e) => updateField("businessHours", e.target.value)}
              placeholder="Mon-Sat: 9AM - 6PM IST"
              leftIcon={<RiTimeLine />}
            />
          </div>
          <Input
            label="Address"
            value={contact.address}
            onChange={(e) => updateField("address", e.target.value)}
            placeholder="Full business address"
            leftIcon={<RiMapPinLine />}
          />
          <Input
            label="Google Maps Embed URL"
            value={contact.mapEmbedUrl}
            onChange={(e) => updateField("mapEmbedUrl", e.target.value)}
            placeholder="https://www.google.com/maps/embed?..."
            leftIcon={<RiGlobalLine />}
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white rounded-2xl p-6 border border-neutral-100">
        <h2 className="font-semibold text-neutral-800 mb-5">Social Media Links</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Instagram"
              value={contact.social.instagram}
              onChange={(e) => updateSocial("instagram", e.target.value)}
              placeholder="https://instagram.com/yourstore"
              leftIcon={<RiInstagramLine />}
            />
            <Input
              label="Facebook"
              value={contact.social.facebook}
              onChange={(e) => updateSocial("facebook", e.target.value)}
              placeholder="https://facebook.com/yourstore"
              leftIcon={<RiFacebookLine />}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Twitter / X"
              value={contact.social.twitter}
              onChange={(e) => updateSocial("twitter", e.target.value)}
              placeholder="https://x.com/yourstore"
              leftIcon={<RiTwitterXLine />}
            />
            <Input
              label="YouTube"
              value={contact.social.youtube}
              onChange={(e) => updateSocial("youtube", e.target.value)}
              placeholder="https://youtube.com/@yourstore"
              leftIcon={<RiYoutubeLine />}
            />
          </div>
          <div className="max-w-[calc(50%-0.5rem)]">
            <Input
              label="WhatsApp Link"
              value={contact.social.whatsapp}
              onChange={(e) => updateSocial("whatsapp", e.target.value)}
              placeholder="https://wa.me/919876543210"
              leftIcon={<RiWhatsappLine />}
            />
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={onSave} isLoading={saving} leftIcon={<RiSaveLine />}>
          Save Changes
        </Button>
      </div>
    </div>
  );
}

// ===========================================================================
// Page Editor Tab (Terms, Privacy, Refund, Shipping, About)
// ===========================================================================

function PageEditorTab({
  pageKey,
  page,
  setPages,
  saving,
  onSave,
}: {
  pageKey: PageKey;
  page: PageContent;
  setPages: React.Dispatch<React.SetStateAction<Record<PageKey, PageContent>>>;
  saving: boolean;
  onSave: () => void;
}) {
  const updateField = (field: keyof PageContent, value: string) => {
    setPages((prev) => ({
      ...prev,
      [pageKey]: { ...prev[pageKey], [field]: value },
    }));
  };

  return (
    <div className="bg-white rounded-2xl p-6 border border-neutral-100">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-semibold text-neutral-800">{PAGE_LABELS[pageKey]}</h2>
        {page.lastUpdated && (
          <span className="text-xs text-neutral-400">
            Last updated:{" "}
            {new Date(page.lastUpdated).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        )}
      </div>

      <div className="space-y-4">
        <Input
          label="Page Title"
          value={page.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder={`${PAGE_LABELS[pageKey]} title`}
        />

        <RichTextEditor
          label="Content"
          value={page.content}
          onChange={(val) => updateField("content", val)}
          placeholder="Write the page content here..."
        />
      </div>

      <div className="mt-6 pt-5 border-t border-neutral-100 flex justify-end">
        <Button
          onClick={onSave}
          isLoading={saving}
          leftIcon={<RiSaveLine />}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
