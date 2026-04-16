

import { z } from "zod";


const emailField = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address")
  .toLowerCase()
  .trim();

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password must be at most 64 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const phoneField = z
  .string()
  .min(10, "Phone number must be at least 10 digits")
  .max(15, "Phone number must be at most 15 digits")
  .regex(/^[+]?[\d\s-]+$/, "Please enter a valid phone number");

const pincodeField = z
  .string()
  .length(6, "Pincode must be exactly 6 digits")
  .regex(/^\d{6}$/, "Pincode must contain only digits");

const nameField = z
  .string()
  .min(2, "Name must be at least 2 characters")
  .max(100, "Name must be at most 100 characters")
  .trim();

const slugField = z
  .string()
  .min(1, "Slug is required")
  .max(200, "Slug must be at most 200 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase, alphanumeric, and may contain hyphens",
  );


export const registerSchema = z
  .object({
    name: nameField,
    email: emailField,
    phone: phoneField,
    password: passwordField,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Reset token is required"),
    password: passwordField,
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;


export const updateProfileSchema = z.object({
  name: nameField.optional(),
  phone: phoneField.optional().or(z.literal("")),
  avatar: z.string().url("Avatar must be a valid URL").optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: passwordField,
    confirmNewPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "Passwords do not match",
    path: ["confirmNewPassword"],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: "New password must be different from current password",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;


export const addressSchema = z.object({
  fullName: nameField,
  phone: phoneField,
  addressLine1: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(200, "Address must be at most 200 characters")
    .trim(),
  addressLine2: z.string().max(200).trim().optional().or(z.literal("")),
  city: z
    .string()
    .min(2, "City must be at least 2 characters")
    .max(100)
    .trim(),
  state: z
    .string()
    .min(2, "State must be at least 2 characters")
    .max(100)
    .trim(),
  pincode: pincodeField,
  isDefault: z.boolean().default(false),
  label: z.enum(["home", "work", "other"]).default("home"),
});

export type AddressInput = z.infer<typeof addressSchema>;


const variantOptionSchema = z.object({
  name: z.string().min(1, "Option name is required").max(100),
  value: z.string().min(1, "Option value is required").max(100),
  priceAdjustment: z.number().default(0),
  stock: z.number().int().min(0, "Stock cannot be negative").default(0),
});

const productVariantSchema = z.object({
  name: z.string().min(1, "Variant name is required").max(100),
  options: z
    .array(variantOptionSchema)
    .min(1, "At least one option is required"),
});


export const productSchema = z.object({
  name: z
    .string()
    .min(2, "Product name must be at least 2 characters")
    .max(200, "Product name must be at most 200 characters")
    .trim(),
  slug: slugField,
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description must be at most 5000 characters"),
  shortDescription: z.string().max(300).optional().or(z.literal("")),
  images: z
    .array(z.string().url("Each image must be a valid URL"))
    .min(1, "At least one image is required")
    .max(8, "Maximum 8 images allowed"),
  category: z.string().min(1, "Category is required"),
  subcategory: z.string().optional().or(z.literal("")),
  price: z
    .number()
    .positive("Price must be greater than 0")
    .max(999999, "Price cannot exceed 9,99,999"),
  compareAtPrice: z
    .number()
    .positive("Compare-at price must be greater than 0")
    .max(999999)
    .optional()
    .nullable(),
  costPrice: z
    .number()
    .positive("Cost price must be greater than 0")
    .max(999999)
    .optional()
    .nullable(),
  sku: z
    .string()
    .min(1, "SKU is required")
    .max(50, "SKU must be at most 50 characters")
    .trim(),
  barcode: z.string().max(50).optional().or(z.literal("")),
  weight: z.number().positive().optional().nullable(),
  unit: z.enum(["kg", "g", "pieces", "pack"]).default("g"),
  stock: z.number().int().min(0, "Stock cannot be negative"),
  lowStockThreshold: z.number().int().min(0).default(5),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  tags: z.array(z.string().trim()).default([]),
  variants: z.array(productVariantSchema).default([]),
});

export type ProductInput = z.infer<typeof productSchema>;


export const categorySchema = z.object({
  name: nameField,
  slug: slugField,
  description: z.string().max(500).optional().or(z.literal("")),
  image: z.string().url("Image must be a valid URL").optional().or(z.literal("")),
  parent: z.string().optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
});

export type CategoryInput = z.infer<typeof categorySchema>;


const orderItemSchema = z.object({
  product: z.string().min(1, "Product ID is required"),
  name: z.string().min(1),
  image: z.string().url(),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(10),
  price: z.number().positive("Price must be greater than 0"),
  variant: z.string().optional(),
});

export const orderSchema = z.object({
  items: z
    .array(orderItemSchema)
    .min(1, "Order must contain at least one item"),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
  paymentMethod: z.enum(["cod", "razorpay"]),
  notes: z.string().max(500, "Notes must be at most 500 characters").optional().or(z.literal("")),
  couponCode: z.string().max(50).optional().or(z.literal("")),
});

export type OrderInput = z.infer<typeof orderSchema>;


export const bannerSchema = z.object({
  title: z.string().min(1, "Title is required").max(200).trim(),
  subtitle: z.string().max(300).optional().or(z.literal("")),
  image: z.string().url("Image must be a valid URL"),
  link: z.string().url("Link must be a valid URL").optional().or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  position: z.enum(["hero", "sidebar", "category"]).default("hero"),
});

export type BannerInput = z.infer<typeof bannerSchema>;


export const reviewSchema = z.object({
  product: z.string().min(1, "Product ID is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  title: z.string().max(200).optional().or(z.literal("")),
  comment: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(2000, "Review must be at most 2000 characters")
    .trim(),
  images: z.array(z.string().url()).max(5, "Maximum 5 images allowed").default([]),
});

export type ReviewInput = z.infer<typeof reviewSchema>;


export const couponSchema = z
  .object({
    code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .max(20, "Code must be at most 20 characters")
      .toUpperCase()
      .trim(),
    description: z.string().max(300).optional().or(z.literal("")),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().positive("Discount value must be greater than 0"),
    minOrderValue: z.number().positive().optional().nullable(),
    maxDiscountAmount: z.number().positive().optional().nullable(),
    usageLimit: z.number().int().positive().optional().nullable(),
    validFrom: z.coerce.date(),
    validUntil: z.coerce.date(),
    isActive: z.boolean().default(true),
    applicableCategories: z.array(z.string()).default([]),
    applicableProducts: z.array(z.string()).default([]),
  })
  .refine((data) => data.validUntil > data.validFrom, {
    message: "Expiry date must be after start date",
    path: ["validUntil"],
  })
  .refine(
    (data) => {
      if (data.discountType === "percentage" && data.discountValue > 100) {
        return false;
      }
      return true;
    },
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    },
  );

export type CouponInput = z.infer<typeof couponSchema>;


export const filterParamsSchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sortBy: z
    .enum(["relevance", "price_asc", "price_desc", "newest", "rating", "popularity"])
    .optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  isFeatured: z.coerce.boolean().optional(),
  isActive: z.coerce.boolean().optional(),
  tags: z
    .string()
    .optional()
    .transform((val) => (val ? val.split(",").map((t) => t.trim()) : undefined)),
});

export type FilterParamsInput = z.infer<typeof filterParamsSchema>;


export const contactFormSchema = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField.optional().or(z.literal("")),
  subject: z
    .string()
    .min(3, "Subject must be at least 3 characters")
    .max(200)
    .trim(),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000)
    .trim(),
});

export type ContactFormInput = z.infer<typeof contactFormSchema>;
