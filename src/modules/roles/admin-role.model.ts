import mongoose, { Schema, Document, Model } from "mongoose";

export const ADMIN_PERMISSIONS = [
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
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export interface IAdminRole {
  name: string;
  description?: string;
  permissions: AdminPermission[];
  isDefault?: boolean; // if true, new admin users get this role automatically
  isSystem?: boolean; // system roles can't be deleted (like "Super Admin")
  createdBy?: mongoose.Types.ObjectId;
}

export interface IAdminRoleDocument extends IAdminRole, Document {}

const AdminRoleSchema = new Schema<IAdminRoleDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 50 },
    description: { type: String, trim: true, maxlength: 200 },
    permissions: [{ type: String, enum: ADMIN_PERMISSIONS }],
    isDefault: { type: Boolean, default: false },
    isSystem: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

AdminRoleSchema.index({ name: 1 });

const AdminRole: Model<IAdminRoleDocument> =
  mongoose.models.AdminRole ||
  mongoose.model<IAdminRoleDocument>("AdminRole", AdminRoleSchema);

export default AdminRole;
