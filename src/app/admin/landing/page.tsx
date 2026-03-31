"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiSearchLine,
  RiImageLine,
  RiGridLine,
  RiStarLine,
  RiPlayLine,
  RiFlagLine,
  RiShieldCheckLine,
  RiCodeSSlashLine,
  RiCloseLine,
  RiEyeLine,
  RiEyeOffLine,
  RiLayoutLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import axios from "axios";
import toast from "react-hot-toast";


type SectionType =
  | "hero_banners"
  | "category_grid"
  | "featured_products"
  | "product_carousel"
  | "banner_strip"
  | "why_choose_us"
  | "custom_html";

interface PopulatedProduct {
  _id: string;
  name: string;
  slug: string;
  images?: string[];
  price: number;
  compareAtPrice?: number;
}

interface PopulatedCategory {
  _id: string;
  name: string;
  slug: string;
  image?: string;
}

interface LandingSection {
  _id: string;
  title: string;
  subtitle?: string;
  type: SectionType;
  isActive: boolean;
  sortOrder: number;
  products?: PopulatedProduct[];
  categories?: PopulatedCategory[];
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface HeroBannerSlide {
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
}

interface WhyChooseUsItem {
  icon: string;
  title: string;
  description: string;
}

interface SectionForm {
  type: SectionType;
  title: string;
  subtitle: string;
  isActive: boolean;
  selectedProducts: PopulatedProduct[];
  selectedCategories: PopulatedCategory[];
  bannerSlides: HeroBannerSlide[];
  htmlContent: string;
  bannerImage: string;
  bannerTitle: string;
  bannerSubtitle: string;
  bannerLink: string;
  whyItems: WhyChooseUsItem[];
}


const SECTION_TYPE_META: Record<
  SectionType,
  { label: string; icon: React.ReactNode; color: string; bgColor: string }
> = {
  hero_banners: {
    label: "Hero Banners",
    icon: <RiImageLine size={18} />,
    color: "#E84672",
    bgColor: "#FFF1F3",
  },
  category_grid: {
    label: "Category Grid",
    icon: <RiGridLine size={18} />,
    color: "#5C6B3C",
    bgColor: "#F0F4E8",
  },
  featured_products: {
    label: "Featured Products",
    icon: <RiStarLine size={18} />,
    color: "#B59F6B",
    bgColor: "#FBF7EE",
  },
  product_carousel: {
    label: "Product Carousel",
    icon: <RiPlayLine size={18} />,
    color: "#2A2518",
    bgColor: "#F7F6F0",
  },
  banner_strip: {
    label: "Banner Strip",
    icon: <RiFlagLine size={18} />,
    color: "#D97706",
    bgColor: "#FFFBEB",
  },
  why_choose_us: {
    label: "Why Choose Us",
    icon: <RiShieldCheckLine size={18} />,
    color: "#0891B2",
    bgColor: "#ECFEFF",
  },
  custom_html: {
    label: "Custom HTML",
    icon: <RiCodeSSlashLine size={18} />,
    color: "#7C3AED",
    bgColor: "#F5F3FF",
  },
};

const EMPTY_SLIDE: HeroBannerSlide = {
  image: "",
  title: "",
  subtitle: "",
  ctaText: "",
  ctaLink: "",
};

const EMPTY_WHY_ITEM: WhyChooseUsItem = {
  icon: "",
  title: "",
  description: "",
};

const EMPTY_FORM: SectionForm = {
  type: "hero_banners",
  title: "",
  subtitle: "",
  isActive: true,
  selectedProducts: [],
  selectedCategories: [],
  bannerSlides: [{ ...EMPTY_SLIDE }],
  htmlContent: "",
  bannerImage: "",
  bannerTitle: "",
  bannerSubtitle: "",
  bannerLink: "",
  whyItems: [{ ...EMPTY_WHY_ITEM }],
};


export default function AdminLandingPage() {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [loading, setLoading] = useState(true);

  
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<LandingSection | null>(null);
  const [form, setForm] = useState<SectionForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  
  const [deleteTarget, setDeleteTarget] = useState<LandingSection | null>(null);
  const [deleting, setDeleting] = useState(false);

  
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<PopulatedProduct[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);
  const productSearchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  
  const [allCategories, setAllCategories] = useState<PopulatedCategory[]>([]);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);

  
  const fetchSections = useCallback(() => {
    setLoading(true);
    axios
      .get<{ data: LandingSection[] }>("/api/admin/landing-sections")
      .then((r) => setSections(r.data.data))
      .catch(() => toast.error("Failed to load sections"))
      .finally(() => setLoading(false));
  }, []);

  const fetchCategories = useCallback(() => {
    if (categoriesLoaded) return;
    axios
      .get<{ data: PopulatedCategory[] }>("/api/categories")
      .then((r) => {
        setAllCategories(r.data.data);
        setCategoriesLoaded(true);
      })
      .catch(() => toast.error("Failed to load categories"));
  }, [categoriesLoaded]);

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  
  const searchProducts = useCallback((query: string) => {
    if (!query.trim()) {
      setProductResults([]);
      return;
    }
    setSearchingProducts(true);
    axios
      .get<{ data: { products: PopulatedProduct[] } }>(
        `/api/products?limit=50&search=${encodeURIComponent(query)}`
      )
      .then((r) => {
        
        const raw = r.data.data;
        const products = Array.isArray(raw) ? raw : raw?.products ?? [];
        setProductResults(products);
      })
      .catch(() => toast.error("Failed to search products"))
      .finally(() => setSearchingProducts(false));
  }, []);

  useEffect(() => {
    if (productSearchTimer.current) clearTimeout(productSearchTimer.current);
    productSearchTimer.current = setTimeout(() => {
      searchProducts(productSearch);
    }, 400);
    return () => {
      if (productSearchTimer.current) clearTimeout(productSearchTimer.current);
    };
  }, [productSearch, searchProducts]);

  
  const buildPayload = () => {
    const base: Record<string, unknown> = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || undefined,
      type: form.type,
      isActive: form.isActive,
    };

    switch (form.type) {
      case "hero_banners":
        base.settings = { slides: form.bannerSlides };
        break;
      case "category_grid":
        base.categories = form.selectedCategories.map((c) => c._id);
        break;
      case "featured_products":
      case "product_carousel":
        base.products = form.selectedProducts.map((p) => p._id);
        break;
      case "banner_strip":
        base.settings = {
          image: form.bannerImage,
          title: form.bannerTitle,
          subtitle: form.bannerSubtitle,
          link: form.bannerLink,
        };
        break;
      case "why_choose_us":
        base.settings = { items: form.whyItems };
        break;
      case "custom_html":
        base.settings = { html: form.htmlContent };
        break;
    }

    return base;
  };

  const populateForm = (section: LandingSection) => {
    const f: SectionForm = {
      type: section.type,
      title: section.title,
      subtitle: section.subtitle ?? "",
      isActive: section.isActive,
      selectedProducts: section.products ?? [],
      selectedCategories: section.categories ?? [],
      bannerSlides:
        (section.settings?.slides as HeroBannerSlide[]) ?? [{ ...EMPTY_SLIDE }],
      htmlContent: (section.settings?.html as string) ?? "",
      bannerImage: (section.settings?.image as string) ?? "",
      bannerTitle: (section.settings?.title as string) ?? "",
      bannerSubtitle: (section.settings?.subtitle as string) ?? "",
      bannerLink: (section.settings?.link as string) ?? "",
      whyItems:
        (section.settings?.items as WhyChooseUsItem[]) ?? [{ ...EMPTY_WHY_ITEM }],
    };
    setForm(f);
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm({
      ...EMPTY_FORM,
      bannerSlides: [{ ...EMPTY_SLIDE }],
      whyItems: [{ ...EMPTY_WHY_ITEM }],
    });
    setProductSearch("");
    setProductResults([]);
    fetchCategories();
    setShowForm(true);
  };

  const openEdit = (section: LandingSection) => {
    setEditTarget(section);
    populateForm(section);
    setProductSearch("");
    setProductResults([]);
    fetchCategories();
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      const payload = buildPayload();
      if (editTarget) {
        await axios.put(
          `/api/admin/landing-sections/${editTarget._id}`,
          payload
        );
        toast.success("Section updated");
      } else {
        await axios.post("/api/admin/landing-sections", payload);
        toast.success("Section created");
      }
      closeForm();
      fetchSections();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Failed to save section";
      toast.error(msg ?? "Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (section: LandingSection) => {
    try {
      await axios.put(`/api/admin/landing-sections/${section._id}`, {
        isActive: !section.isActive,
      });
      setSections((prev) =>
        prev.map((s) =>
          s._id === section._id ? { ...s, isActive: !section.isActive } : s
        )
      );
      toast.success(section.isActive ? "Section hidden" : "Section visible");
    } catch {
      toast.error("Failed to update section");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/admin/landing-sections/${deleteTarget._id}`);
      setSections((prev) => prev.filter((s) => s._id !== deleteTarget._id));
      toast.success("Section deleted");
      setDeleteTarget(null);
    } catch {
      toast.error("Failed to delete section");
    } finally {
      setDeleting(false);
    }
  };

  
  const moveSection = async (index: number, direction: "up" | "down") => {
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= sections.length) return;

    const updated = [...sections];
    [updated[index], updated[swapIndex]] = [updated[swapIndex], updated[index]];
    const order = updated.map((s, i) => ({ id: s._id, sortOrder: i }));

    
    setSections(updated.map((s, i) => ({ ...s, sortOrder: i })));

    try {
      const res = await axios.put<{ data: LandingSection[] }>(
        "/api/admin/landing-sections/reorder",
        { order }
      );
      setSections(res.data.data);
      toast.success("Order updated");
    } catch {
      fetchSections();
      toast.error("Failed to reorder");
    }
  };

  
  const addProduct = (product: PopulatedProduct) => {
    if (form.selectedProducts.some((p) => p._id === product._id)) return;
    setForm((f) => ({
      ...f,
      selectedProducts: [...f.selectedProducts, product],
    }));
  };

  const removeProduct = (id: string) => {
    setForm((f) => ({
      ...f,
      selectedProducts: f.selectedProducts.filter((p) => p._id !== id),
    }));
  };

  const toggleCategory = (cat: PopulatedCategory) => {
    setForm((f) => {
      const exists = f.selectedCategories.some((c) => c._id === cat._id);
      return {
        ...f,
        selectedCategories: exists
          ? f.selectedCategories.filter((c) => c._id !== cat._id)
          : [...f.selectedCategories, cat],
      };
    });
  };

  
  const updateSlide = (
    idx: number,
    field: keyof HeroBannerSlide,
    value: string
  ) => {
    setForm((f) => {
      const slides = [...f.bannerSlides];
      slides[idx] = { ...slides[idx], [field]: value };
      return { ...f, bannerSlides: slides };
    });
  };

  const addSlide = () => {
    setForm((f) => ({
      ...f,
      bannerSlides: [...f.bannerSlides, { ...EMPTY_SLIDE }],
    }));
  };

  const removeSlide = (idx: number) => {
    setForm((f) => ({
      ...f,
      bannerSlides: f.bannerSlides.filter((_, i) => i !== idx),
    }));
  };

  
  const updateWhyItem = (
    idx: number,
    field: keyof WhyChooseUsItem,
    value: string
  ) => {
    setForm((f) => {
      const items = [...f.whyItems];
      items[idx] = { ...items[idx], [field]: value };
      return { ...f, whyItems: items };
    });
  };

  const addWhyItem = () => {
    setForm((f) => ({
      ...f,
      whyItems: [...f.whyItems, { ...EMPTY_WHY_ITEM }],
    }));
  };

  const removeWhyItem = (idx: number) => {
    setForm((f) => ({
      ...f,
      whyItems: f.whyItems.filter((_, i) => i !== idx),
    }));
  };

  
  const activeSections = sections.filter((s) => s.isActive);

  
  return (
    <div className="p-8">
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Landing Page Builder
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {sections.length} section{sections.length !== 1 ? "s" : ""} &middot;{" "}
            {activeSections.length} active
          </p>
        </div>
        <div className="flex gap-3">
          <Button leftIcon={<RiAddLine />} onClick={openCreate}>
            Add Section
          </Button>
        </div>
      </div>

      
      <div className="space-y-3">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-neutral-100 p-5 flex items-center gap-4"
              >
                <Skeleton className="h-10 w-10" rounded="lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20" rounded="lg" />
              </div>
            ))
          : sections.length === 0
            ? (
                <div className="bg-white rounded-2xl border border-neutral-100 px-6 py-16 text-center">
                  <RiLayoutLine
                    size={40}
                    className="mx-auto text-neutral-200 mb-3"
                  />
                  <p className="text-neutral-400 text-sm">
                    No sections yet. Add one to build your landing page.
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    leftIcon={<RiAddLine />}
                    onClick={openCreate}
                  >
                    Add Section
                  </Button>
                </div>
              )
            : (
                <AnimatePresence mode="popLayout">
                  {sections.map((section, index) => {
                    const meta =
                      SECTION_TYPE_META[section.type] ??
                      SECTION_TYPE_META.custom_html;
                    return (
                      <motion.div
                        key={section._id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{
                          type: "spring",
                          stiffness: 400,
                          damping: 30,
                        }}
                        className="bg-white rounded-2xl border border-neutral-100 p-5 flex items-center gap-4 hover:shadow-sm transition-shadow"
                      >
                        
                        <div className="flex flex-col items-center gap-0.5 min-w-[24px]">
                          <span className="text-xs font-bold text-neutral-300">
                            #{index + 1}
                          </span>
                        </div>

                        
                        <div
                          className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
                          style={{
                            backgroundColor: meta.bgColor,
                            color: meta.color,
                          }}
                        >
                          {meta.icon}
                        </div>

                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-800 truncate">
                            {section.title}
                          </p>
                          <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1.5">
                            <span
                              className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium"
                              style={{
                                backgroundColor: meta.bgColor,
                                color: meta.color,
                              }}
                            >
                              {meta.label}
                            </span>
                            {section.subtitle && (
                              <span className="truncate">
                                {section.subtitle}
                              </span>
                            )}
                          </p>
                        </div>

                        
                        <button
                          onClick={() => toggleActive(section)}
                          className={`p-2 rounded-lg transition-colors ${
                            section.isActive
                              ? "text-[#5C6B3C] hover:bg-[#F0F4E8]"
                              : "text-neutral-300 hover:bg-neutral-50"
                          }`}
                          title={
                            section.isActive
                              ? "Active - click to hide"
                              : "Hidden - click to show"
                          }
                        >
                          {section.isActive ? (
                            <RiEyeLine size={18} />
                          ) : (
                            <RiEyeOffLine size={18} />
                          )}
                        </button>

                        
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => moveSection(index, "up")}
                            disabled={index === 0}
                            className="p-1 rounded hover:bg-neutral-50 text-neutral-400 hover:text-neutral-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            title="Move up"
                          >
                            <RiArrowUpLine size={14} />
                          </button>
                          <button
                            onClick={() => moveSection(index, "down")}
                            disabled={index === sections.length - 1}
                            className="p-1 rounded hover:bg-neutral-50 text-neutral-400 hover:text-neutral-600 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                            title="Move down"
                          >
                            <RiArrowDownLine size={14} />
                          </button>
                        </div>

                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEdit(section)}
                            className="p-1.5 rounded-lg hover:bg-blue-50 text-neutral-400 hover:text-blue-600 transition-colors"
                            title="Edit section"
                          >
                            <RiEditLine size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(section)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                            title="Delete section"
                          >
                            <RiDeleteBinLine size={16} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
      </div>

      
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editTarget ? `Edit: ${editTarget.title}` : "Add New Section"}
        size="full"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {!editTarget && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Section Type{" "}
                <span className="text-[#E84672] ml-0.5">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {(Object.keys(SECTION_TYPE_META) as SectionType[]).map((t) => {
                  const meta = SECTION_TYPE_META[t];
                  const selected = form.type === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: t }))}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-left text-sm transition-all ${
                        selected
                          ? "border-[#E84672] bg-[#FFF1F3]"
                          : "border-neutral-100 hover:border-neutral-200 bg-white"
                      }`}
                    >
                      <span
                        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0"
                        style={{
                          backgroundColor: meta.bgColor,
                          color: meta.color,
                        }}
                      >
                        {meta.icon}
                      </span>
                      <span className="font-medium text-neutral-700">
                        {meta.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          
          {editTarget && (
            <div className="flex items-center gap-2">
              <span
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{
                  backgroundColor:
                    SECTION_TYPE_META[form.type]?.bgColor,
                  color: SECTION_TYPE_META[form.type]?.color,
                }}
              >
                {SECTION_TYPE_META[form.type]?.icon}
              </span>
              <span className="text-sm font-medium text-neutral-600">
                {SECTION_TYPE_META[form.type]?.label}
              </span>
            </div>
          )}

          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Title"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="Section title"
              required
            />
            <Input
              label="Subtitle"
              value={form.subtitle}
              onChange={(e) =>
                setForm((f) => ({ ...f, subtitle: e.target.value }))
              }
              placeholder="Optional subtitle"
            />
          </div>

          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((f) => ({ ...f, isActive: e.target.checked }))
              }
              className="rounded accent-[#E84672]"
            />
            <span className="text-sm text-neutral-700">
              Active (visible on landing page)
            </span>
          </label>

          
          {form.type === "hero_banners" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">
                  Banner Slides
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<RiAddLine />}
                  onClick={addSlide}
                >
                  Add Slide
                </Button>
              </div>
              {form.bannerSlides.map((slide, idx) => (
                <div
                  key={idx}
                  className="border border-neutral-100 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-neutral-400">
                      Slide {idx + 1}
                    </span>
                    {form.bannerSlides.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSlide(idx)}
                        className="p-1 rounded hover:bg-red-50 text-neutral-300 hover:text-red-500 transition-colors"
                      >
                        <RiCloseLine size={16} />
                      </button>
                    )}
                  </div>
                  <Input
                    label="Image URL"
                    value={slide.image}
                    onChange={(e) =>
                      updateSlide(idx, "image", e.target.value)
                    }
                    placeholder="https://..."
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Title"
                      value={slide.title}
                      onChange={(e) =>
                        updateSlide(idx, "title", e.target.value)
                      }
                      placeholder="Banner title"
                    />
                    <Input
                      label="Subtitle"
                      value={slide.subtitle}
                      onChange={(e) =>
                        updateSlide(idx, "subtitle", e.target.value)
                      }
                      placeholder="Banner subtitle"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="CTA Text"
                      value={slide.ctaText}
                      onChange={(e) =>
                        updateSlide(idx, "ctaText", e.target.value)
                      }
                      placeholder="Shop Now"
                    />
                    <Input
                      label="CTA Link"
                      value={slide.ctaLink}
                      onChange={(e) =>
                        updateSlide(idx, "ctaLink", e.target.value)
                      }
                      placeholder="/collections/summer"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          
          {form.type === "category_grid" && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-700">
                Select Categories
              </label>
              {allCategories.length === 0 ? (
                <p className="text-sm text-neutral-400">
                  Loading categories...
                </p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                  {allCategories.map((cat) => {
                    const selected = form.selectedCategories.some(
                      (c) => c._id === cat._id
                    );
                    return (
                      <button
                        key={cat._id}
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-left transition-all ${
                          selected
                            ? "border-[#5C6B3C] bg-[#F0F4E8] text-[#5C6B3C]"
                            : "border-neutral-100 hover:border-neutral-200 text-neutral-600"
                        }`}
                      >
                        {cat.image && (
                          <img
                            src={cat.image}
                            alt=""
                            className="w-6 h-6 rounded object-cover shrink-0"
                          />
                        )}
                        <span className="truncate">{cat.name}</span>
                        {selected && (
                          <RiCheckLine
                            size={14}
                            className="ml-auto shrink-0"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
              {form.selectedCategories.length > 0 && (
                <p className="text-xs text-neutral-400">
                  {form.selectedCategories.length} categor
                  {form.selectedCategories.length === 1 ? "y" : "ies"}{" "}
                  selected
                </p>
              )}
            </div>
          )}

          
          {(form.type === "featured_products" ||
            form.type === "product_carousel") && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-neutral-700">
                Select Products
              </label>
              
              <Input
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                leftIcon={<RiSearchLine />}
              />
              
              {productSearch.trim() && (
                <div className="border border-neutral-100 rounded-xl max-h-48 overflow-y-auto divide-y divide-neutral-50">
                  {searchingProducts ? (
                    <div className="p-3 text-sm text-neutral-400">
                      Searching...
                    </div>
                  ) : productResults.length === 0 ? (
                    <div className="p-3 text-sm text-neutral-400">
                      No products found
                    </div>
                  ) : (
                    productResults.map((p) => {
                      const alreadyAdded = form.selectedProducts.some(
                        (sp) => sp._id === p._id
                      );
                      return (
                        <button
                          key={p._id}
                          type="button"
                          disabled={alreadyAdded}
                          onClick={() => addProduct(p)}
                          className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-[#F7F6F0] transition-colors disabled:opacity-40"
                        >
                          {p.images?.[0] && (
                            <img
                              src={p.images[0]}
                              alt=""
                              className="w-8 h-8 rounded object-cover shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-neutral-700 truncate">
                              {p.name}
                            </p>
                            <p className="text-xs text-neutral-400">
                              ${p.price}
                            </p>
                          </div>
                          {alreadyAdded && (
                            <span className="text-xs text-[#5C6B3C]">
                              Added
                            </span>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
              
              {form.selectedProducts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.selectedProducts.map((p) => (
                    <span
                      key={p._id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F7F6F0] border border-neutral-100 text-sm text-neutral-700"
                    >
                      {p.images?.[0] && (
                        <img
                          src={p.images[0]}
                          alt=""
                          className="w-5 h-5 rounded object-cover"
                        />
                      )}
                      <span className="truncate max-w-[140px]">
                        {p.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeProduct(p._id)}
                        className="ml-0.5 p-0.5 rounded hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                      >
                        <RiCloseLine size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-neutral-400">
                {form.selectedProducts.length} product
                {form.selectedProducts.length !== 1 ? "s" : ""} selected
              </p>
            </div>
          )}

          
          {form.type === "banner_strip" && (
            <div className="space-y-3">
              <Input
                label="Banner Image URL"
                value={form.bannerImage}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    bannerImage: e.target.value,
                  }))
                }
                placeholder="https://..."
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Banner Title"
                  value={form.bannerTitle}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      bannerTitle: e.target.value,
                    }))
                  }
                  placeholder="Promotion title"
                />
                <Input
                  label="Banner Subtitle"
                  value={form.bannerSubtitle}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      bannerSubtitle: e.target.value,
                    }))
                  }
                  placeholder="Promotion subtitle"
                />
              </div>
              <Input
                label="Link"
                value={form.bannerLink}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    bannerLink: e.target.value,
                  }))
                }
                placeholder="/sale"
              />
            </div>
          )}

          
          {form.type === "why_choose_us" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-neutral-700">
                  Feature Items
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  leftIcon={<RiAddLine />}
                  onClick={addWhyItem}
                >
                  Add Item
                </Button>
              </div>
              {form.whyItems.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-neutral-100 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-neutral-400">
                      Item {idx + 1}
                    </span>
                    {form.whyItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWhyItem(idx)}
                        className="p-1 rounded hover:bg-red-50 text-neutral-300 hover:text-red-500 transition-colors"
                      >
                        <RiCloseLine size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Icon (emoji or class)"
                      value={item.icon}
                      onChange={(e) =>
                        updateWhyItem(idx, "icon", e.target.value)
                      }
                      placeholder="e.g. shield-check"
                    />
                    <Input
                      label="Title"
                      value={item.title}
                      onChange={(e) =>
                        updateWhyItem(idx, "title", e.target.value)
                      }
                      placeholder="Feature title"
                    />
                  </div>
                  <Textarea
                    label="Description"
                    value={item.description}
                    onChange={(e) =>
                      updateWhyItem(idx, "description", e.target.value)
                    }
                    placeholder="Short description..."
                    className="min-h-[60px]"
                  />
                </div>
              ))}
            </div>
          )}

          
          {form.type === "custom_html" && (
            <div>
              <Textarea
                label="HTML Content"
                value={form.htmlContent}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    htmlContent: e.target.value,
                  }))
                }
                placeholder="<div>Your custom HTML...</div>"
                className="min-h-[200px] font-mono text-xs"
              />
              <p className="text-xs text-neutral-400 mt-1">
                Paste raw HTML. It will be rendered as-is on the landing
                page.
              </p>
            </div>
          )}

          
          <div className="flex gap-3 pt-4 border-t border-neutral-100">
            <Button
              type="submit"
              isLoading={saving}
              leftIcon={<RiCheckLine />}
            >
              {editTarget ? "Save Changes" : "Add Section"}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Section"
        size="sm"
      >
        <div className="p-6">
          <p className="text-sm text-neutral-600 mb-2">
            Are you sure you want to delete{" "}
            <span className="font-semibold text-neutral-800">
              {deleteTarget?.title}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-5">
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleting}
              leftIcon={<RiDeleteBinLine />}
            >
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
