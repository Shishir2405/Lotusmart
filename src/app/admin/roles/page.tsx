"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiCheckLine,
  RiShieldUserLine,
  RiCheckboxCircleLine,
  RiCloseCircleLine,
  RiTeamLine,
  RiSaveLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import axios from "axios";
import toast from "@/components/ui/toast";


type Permission =
  | "dashboard"
  | "analytics"
  | "products"
  | "categories"
  | "coupons"
  | "price_editor"
  | "inventory"
  | "orders"
  | "customers"
  | "landing_page"
  | "banners"
  | "site_settings"
  | "settings"
  | "roles";

interface Role {
  _id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  isDefault: boolean;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role?: string;
  roleName?: string;
}

interface RoleForm {
  name: string;
  description: string;
  permissions: Permission[];
  isDefault: boolean;
}


const ALL_PERMISSIONS: Permission[] = [
  "dashboard",
  "analytics",
  "products",
  "categories",
  "coupons",
  "price_editor",
  "inventory",
  "orders",
  "customers",
  "landing_page",
  "banners",
  "site_settings",
  "settings",
  "roles",
];

const PERMISSION_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  analytics: "Analytics",
  products: "Products",
  categories: "Categories",
  coupons: "Coupons",
  price_editor: "Price Editor",
  inventory: "Inventory",
  orders: "Orders",
  customers: "Customers",
  landing_page: "Landing Page",
  banners: "Banners",
  site_settings: "Site Settings",
  settings: "Settings",
  roles: "Roles & Permissions",
};

const PERMISSION_GROUPS = [
  { label: "Overview", permissions: ["dashboard", "analytics"] as Permission[] },
  {
    label: "Catalog",
    permissions: [
      "products",
      "categories",
      "coupons",
      "price_editor",
      "inventory",
    ] as Permission[],
  },
  { label: "Sales", permissions: ["orders", "customers"] as Permission[] },
  {
    label: "Content",
    permissions: ["landing_page", "banners", "site_settings"] as Permission[],
  },
  { label: "System", permissions: ["settings", "roles"] as Permission[] },
];

const GROUP_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Overview: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
  Catalog: { bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  Sales: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
  Content: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  System: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

function getPermissionGroup(perm: string): string {
  for (const group of PERMISSION_GROUPS) {
    if (group.permissions.includes(perm as Permission)) return group.label;
  }
  return "System";
}

const EMPTY_FORM: RoleForm = {
  name: "",
  description: "",
  permissions: [],
  isDefault: false,
};


export default function AdminRolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);

  
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userRoleChanges, setUserRoleChanges] = useState<
    Record<string, string>
  >({});
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  
  const fetchRoles = useCallback(() => {
    setLoading(true);
    axios
      .get<{ data: { roles: Role[] } }>("/api/admin/roles")
      .then((r) => {
        const d = r.data.data;
        setRoles(Array.isArray(d) ? d : Array.isArray(d?.roles) ? d.roles : []);
      })
      .catch(() => toast.error("Failed to load roles"))
      .finally(() => setLoading(false));
  }, []);

  const fetchUsers = useCallback(() => {
    setUsersLoading(true);
    axios
      .get<{ data: AdminUser[] }>("/api/admin/users?role=admin")
      .then((r) => setUsers(r.data.data))
      .catch(() => toast.error("Failed to load admin users"))
      .finally(() => setUsersLoading(false));
  }, []);

  useEffect(() => {
    fetchRoles();
    fetchUsers();
  }, [fetchRoles, fetchUsers]);

  
  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (role: Role) => {
    setEditTarget(role);
    setForm({
      name: role.name,
      description: role.description ?? "",
      permissions: [...role.permissions],
      isDefault: role.isDefault,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  const togglePermission = (perm: Permission) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter((p) => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  const selectAllPermissions = () => {
    setForm((f) => ({ ...f, permissions: [...ALL_PERMISSIONS] }));
  };

  const deselectAllPermissions = () => {
    setForm((f) => ({ ...f, permissions: [] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    if (form.permissions.length === 0) {
      toast.error("Select at least one permission");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        permissions: form.permissions,
        isDefault: form.isDefault,
      };

      if (editTarget) {
        await axios.patch(`/api/admin/roles/${editTarget._id}`, payload);
        toast.success("Role updated");
      } else {
        await axios.post("/api/admin/roles", payload);
        toast.success("Role created");
      }

      closeForm();
      fetchRoles();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Failed to save role";
      toast.error(msg ?? "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/admin/roles/${deleteTarget._id}`);
      setRoles((prev) => prev.filter((r) => r._id !== deleteTarget._id));
      toast.success("Role deleted");
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Failed to delete role";
      toast.error(msg ?? "Failed to delete role");
    } finally {
      setDeleting(false);
    }
  };

  
  const handleUserRoleChange = (userId: string, roleId: string) => {
    setUserRoleChanges((prev) => ({ ...prev, [userId]: roleId }));
  };

  const saveUserRole = async (userId: string) => {
    const roleId = userRoleChanges[userId];
    if (roleId === undefined) return;

    setSavingUserId(userId);
    try {
      await axios.patch(`/api/admin/users/${userId}/role`, { roleId: roleId || null });
      toast.success("User role updated");
      setUserRoleChanges((prev) => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
      fetchUsers();
      fetchRoles();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Failed to update user role";
      toast.error(msg ?? "Failed to update user role");
    } finally {
      setSavingUserId(null);
    }
  };

  
  return (
    <div className="p-8">
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Roles &amp; Permissions
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Manage admin roles and assign granular access
          </p>
        </div>
        <Button leftIcon={<RiAddLine />} onClick={openCreate}>
          Create Role
        </Button>
      </div>

      
      <div className="space-y-4 mb-10">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 border border-neutral-100"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-8 w-20" rounded="lg" />
                </div>
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Skeleton key={j} className="h-6 w-20" rounded="full" />
                  ))}
                </div>
              </div>
            ))
          : roles.length === 0
            ? (
                <div className="bg-white rounded-2xl p-6 border border-neutral-100">
                  <div className="flex flex-col items-center py-10">
                    <RiShieldUserLine
                      size={40}
                      className="text-neutral-200 mb-3"
                    />
                    <p className="text-neutral-400 text-sm">
                      No roles yet. Create one to get started.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-4"
                      leftIcon={<RiAddLine />}
                      onClick={openCreate}
                    >
                      Create Role
                    </Button>
                  </div>
                </div>
              )
            : roles.map((role) => (
                <motion.div
                  key={role._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl p-6 border border-neutral-100 hover:shadow-sm transition-shadow"
                >
                  
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-neutral-900">
                          {role.name}
                        </h3>
                        {role.isSystem && (
                          <Badge variant="info">System</Badge>
                        )}
                        {role.isDefault && (
                          <Badge variant="primary">Default</Badge>
                        )}
                        {role.userCount !== undefined && (
                          <span className="text-xs text-neutral-400">
                            {role.userCount} user
                            {role.userCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      {role.description && (
                        <p className="text-sm text-neutral-500 mt-1">
                          {role.description}
                        </p>
                      )}
                    </div>

                    
                    <div className="flex items-center gap-1.5 ml-4 shrink-0">
                      <button
                        onClick={() => openEdit(role)}
                        disabled={role.isSystem}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-neutral-400 hover:text-blue-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-neutral-400"
                        title="Edit role"
                      >
                        <RiEditLine size={16} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(role)}
                        disabled={role.isSystem}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-neutral-400"
                        title="Delete role"
                      >
                        <RiDeleteBinLine size={16} />
                      </button>
                    </div>
                  </div>

                  
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((perm) => {
                      const groupLabel = getPermissionGroup(perm);
                      const colors = GROUP_COLORS[groupLabel];
                      return (
                        <span
                          key={perm}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border}`}
                        >
                          {PERMISSION_LABELS[perm] ?? perm}
                        </span>
                      );
                    })}
                  </div>
                </motion.div>
              ))}
      </div>

      
      <div className="bg-white rounded-2xl p-6 border border-neutral-100">
        <div className="flex items-center gap-2 mb-6">
          <RiTeamLine size={20} className="text-neutral-400" />
          <h2 className="text-lg font-semibold text-neutral-900">
            Assign Roles to Users
          </h2>
        </div>

        {usersLoading ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Current Role
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-4 w-48" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-9 w-40" rounded="lg" />
                    </td>
                    <td className="px-4 py-4">
                      <Skeleton className="h-8 w-16 ml-auto" rounded="lg" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center py-10">
            <RiTeamLine size={40} className="text-neutral-200 mb-3" />
            <p className="text-neutral-400 text-sm">No admin users found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Email
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Current Role
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {users.map((user) => {
                  const currentRoleId =
                    userRoleChanges[user._id] ?? user.role ?? "";
                  const hasChange = userRoleChanges[user._id] !== undefined;

                  return (
                    <motion.tr
                      key={user._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-[#FAFAF9] transition-colors"
                    >
                      <td className="px-4 py-4">
                        <span className="text-sm font-semibold text-neutral-800">
                          {user.name}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-sm text-neutral-500">
                          {user.email}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <select
                          value={currentRoleId}
                          onChange={(e) =>
                            handleUserRoleChange(user._id, e.target.value)
                          }
                          className="border border-neutral-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#E84672] focus:ring-2 focus:ring-[#E84672]/30 bg-white transition-all duration-200 min-w-[180px]"
                        >
                          <option value="">
                            Super Admin (No Restrictions)
                          </option>
                          {roles.map((role) => (
                            <option key={role._id} value={role._id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <AnimatePresence>
                          {hasChange && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="inline-block"
                            >
                              <Button
                                size="sm"
                                leftIcon={<RiSaveLine />}
                                isLoading={savingUserId === user._id}
                                onClick={() => saveUserRole(user._id)}
                              >
                                Save
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={
          editTarget ? `Edit Role: ${editTarget.name}` : "Create New Role"
        }
        size="full"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <Input
            label="Role Name"
            value={form.name}
            onChange={(e) =>
              setForm((f) => ({ ...f, name: e.target.value }))
            }
            placeholder="e.g. Editor, Manager, Viewer"
            required
          />

          
          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="Briefly describe what this role can do..."
          />

          
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-neutral-700">
                Permissions <span className="text-[#E84672] ml-0.5">*</span>
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={selectAllPermissions}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#5C6B3C] hover:text-[#4a5730] transition-colors"
                >
                  <RiCheckboxCircleLine size={14} />
                  Select All
                </button>
                <span className="text-neutral-300">|</span>
                <button
                  type="button"
                  onClick={deselectAllPermissions}
                  className="inline-flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  <RiCloseCircleLine size={14} />
                  Deselect All
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {PERMISSION_GROUPS.map((group) => {
                const colors = GROUP_COLORS[group.label];
                return (
                  <div key={group.label}>
                    <h4
                      className={`text-xs font-semibold uppercase tracking-wide mb-2 ${colors.text}`}
                    >
                      {group.label}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {group.permissions.map((perm) => {
                        const isSelected = form.permissions.includes(perm);
                        return (
                          <button
                            key={perm}
                            type="button"
                            onClick={() => togglePermission(perm)}
                            className={`relative flex items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                              isSelected
                                ? `${colors.bg} ${colors.border} ${colors.text}`
                                : "border-neutral-100 bg-neutral-50/50 text-neutral-400 hover:border-neutral-200 hover:bg-neutral-50"
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              readOnly
                              className="rounded accent-[#E84672] pointer-events-none"
                            />
                            <span
                              className={`text-sm font-medium ${
                                isSelected ? colors.text : "text-neutral-500"
                              }`}
                            >
                              {PERMISSION_LABELS[perm] ?? perm}
                            </span>
                            {isSelected && (
                              <RiCheckLine
                                size={14}
                                className={`absolute top-2 right-2 ${colors.text}`}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-neutral-400 mt-3">
              {form.permissions.length} of {ALL_PERMISSIONS.length} permissions
              selected
            </p>
          </div>

          
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isDefault: e.target.checked }))
                }
                className="rounded accent-[#E84672]"
              />
              <span className="text-sm text-neutral-700">Default role</span>
            </label>
            <span className="text-xs text-neutral-400">
              (new admin users will be assigned this role)
            </span>
          </div>

          
          <div className="flex gap-3 pt-2 border-t border-neutral-100">
            <Button
              type="submit"
              isLoading={saving}
              leftIcon={<RiCheckLine />}
            >
              {editTarget ? "Save Changes" : "Create Role"}
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
        title="Delete Role"
        size="sm"
      >
        <div className="p-6">
          <p className="text-sm text-neutral-600 mb-2">
            Are you sure you want to delete the role{" "}
            <span className="font-semibold text-neutral-800">
              {deleteTarget?.name}
            </span>
            ? This action cannot be undone.
          </p>
          {deleteTarget && (deleteTarget.userCount ?? 0) > 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              This role is currently assigned to {deleteTarget.userCount} user
              {deleteTarget.userCount !== 1 ? "s" : ""}. They will lose their
              permissions.
            </p>
          )}
          <div className="flex gap-3 mt-5">
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleting}
              leftIcon={<RiDeleteBinLine />}
            >
              Delete
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
