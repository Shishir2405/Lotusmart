// LotusMart TypeScript Interfaces & Types

import { Types } from "mongoose";

// ──────────────────────────────────────────────
// Common type aliases
// ──────────────────────────────────────────────
export type ObjectId = Types.ObjectId;
export type Ref<T> = T | ObjectId | string;
export type Timestamps = { createdAt: Date; updatedAt: Date };
export type WithId<T> = T & { _id: ObjectId };
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ──────────────────────────────────────────────
// User roles, address labels, units, etc.
// ──────────────────────────────────────────────
export type UserRole = "admin" | "customer";
export type AddressLabel = "home" | "work" | "other";
export type ProductUnit = "kg" | "g" | "pieces" | "pack";
export type PaymentMethod = "cod" | "razorpay";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type OrderStatus =
  | "placed"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "returned";
export type BannerPosition = "hero" | "sidebar" | "category";

// ──────────────────────────────────────────────
// IAddress
// ──────────────────────────────────────────────
export interface IAddress {
  _id?: ObjectId | string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  label: AddressLabel;
}

// ──────────────────────────────────────────────
// IUser
// ──────────────────────────────────────────────
export interface IUser extends Timestamps {
  _id: ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  addresses: IAddress[];
  isVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

/** User object returned to the client (password stripped) */
export type SafeUser = Omit<
  IUser,
  "password" | "verificationToken" | "resetPasswordToken" | "resetPasswordExpires"
>;

// ──────────────────────────────────────────────
// IProductVariant
// ──────────────────────────────────────────────
export interface IProductVariantOption {
  name: string;
  value: string;
  priceAdjustment: number;
  stock: number;
}

export interface IProductVariant {
  name: string;
  options: IProductVariantOption[];
}

// ──────────────────────────────────────────────
// IProduct
// ──────────────────────────────────────────────
export interface IProduct extends Timestamps {
  _id: ObjectId;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  images: string[];
  category: Ref<ICategory>;
  subcategory?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  sku: string;
  barcode?: string;
  weight?: number;
  unit: ProductUnit;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  variants: IProductVariant[];
  ratings: {
    average: number;
    count: number;
  };
}

// ──────────────────────────────────────────────
// ICategory
// ──────────────────────────────────────────────
export interface ICategory extends Timestamps {
  _id: ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: Ref<ICategory>;
  isActive: boolean;
  sortOrder: number;
}

// ──────────────────────────────────────────────
// Cart
// ──────────────────────────────────────────────
export interface ICartItem {
  product: Ref<IProduct>;
  quantity: number;
  variant?: string;
  price: number;
}

export interface ICart extends Timestamps {
  _id: ObjectId;
  user: Ref<IUser>;
  items: ICartItem[];
  couponCode?: string;
  discount: number;
}

// ──────────────────────────────────────────────
// Wishlist
// ──────────────────────────────────────────────
export interface IWishlistItem {
  product: Ref<IProduct>;
  addedAt: Date;
}

export interface IWishlist extends Timestamps {
  _id: ObjectId;
  user: Ref<IUser>;
  items: IWishlistItem[];
}

// ──────────────────────────────────────────────
// Order
// ──────────────────────────────────────────────
export interface IOrderItem {
  product: Ref<IProduct>;
  name: string;
  image: string;
  quantity: number;
  price: number;
  variant?: string;
}

export interface IOrder extends Timestamps {
  _id: ObjectId;
  orderNumber: string;
  user: Ref<IUser>;
  items: IOrderItem[];
  shippingAddress: IAddress;
  billingAddress?: IAddress;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  discount: number;
  total: number;
  notes?: string;
  trackingNumber?: string;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
}

// ──────────────────────────────────────────────
// Banner
// ──────────────────────────────────────────────
export interface IBanner extends Timestamps {
  _id: ObjectId;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  isActive: boolean;
  sortOrder: number;
  position: BannerPosition;
}

// ──────────────────────────────────────────────
// API Response
// ──────────────────────────────────────────────
export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]> | string[];
  statusCode: number;
}

// ──────────────────────────────────────────────
// Pagination
// ──────────────────────────────────────────────
export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IPaginatedResponse<T = unknown> extends IApiResponse<T> {
  pagination: IPagination;
}

// ──────────────────────────────────────────────
// Filter / Query params
// ──────────────────────────────────────────────
export interface IFilterParams {
  category?: string;
  subcategory?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  search?: string;
  page?: number;
  limit?: number;
  isFeatured?: boolean;
  isActive?: boolean;
  tags?: string[];
}

// ──────────────────────────────────────────────
// Auth
// ──────────────────────────────────────────────
export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IRegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ITokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  name?: string;
}

// ──────────────────────────────────────────────
// Review (bonus)
// ──────────────────────────────────────────────
export interface IReview extends Timestamps {
  _id: ObjectId;
  product: Ref<IProduct>;
  user: Ref<IUser>;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
}

// ──────────────────────────────────────────────
// Coupon (bonus)
// ──────────────────────────────────────────────
export interface ICoupon extends Timestamps {
  _id: ObjectId;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableCategories?: Ref<ICategory>[];
  applicableProducts?: Ref<IProduct>[];
}

// ──────────────────────────────────────────────
// Notification (bonus)
// ──────────────────────────────────────────────
export interface INotification extends Timestamps {
  _id: ObjectId;
  user: Ref<IUser>;
  title: string;
  message: string;
  type: "order" | "promo" | "system";
  isRead: boolean;
  link?: string;
}
