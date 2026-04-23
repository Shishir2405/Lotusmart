

import { Types } from "mongoose";


export type ObjectId = Types.ObjectId;
export type Ref<T> = T | ObjectId | string;
export type Timestamps = { createdAt: Date; updatedAt: Date };
export type WithId<T> = T & { _id: ObjectId };
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;


export type UserRole = "admin" | "customer";
export type AddressLabel = "home" | "work" | "other";
export type ProductUnit = "kg" | "g" | "pieces" | "pack" | "ml" | "L" | "box";
export type PaymentMethod = "razorpay" | "cod";
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
export type BannerColorScheme = "amber" | "olive" | "rose" | "emerald" | "sky";
export type BlogStatus = "draft" | "published" | "archived";


export interface IGeoLocation {
  lat: number;
  lng: number;
}

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
  coordinates?: IGeoLocation;
  formattedAddress?: string;
}

export type AuthProvider = "local" | "google";


export interface IUser extends Timestamps {
  _id: ObjectId;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  adminRole?: Ref<IAdminRole>;
  phone?: string;
  avatar?: string;
  addresses: IAddress[];
  isVerified: boolean;
  authProvider: AuthProvider;
  googleId?: string;
  profileComplete: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}


export type SafeUser = Omit<
  IUser,
  "password" | "verificationToken" | "resetPasswordToken" | "resetPasswordExpires"
>;


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


export type ProductType = "spice" | "dry_fruit" | "gifting" | "herb" | "honey" | "superfood";

export interface IBulkPricing {
  minQty: number;
  maxQty: number;
  price: number;
  unit: ProductUnit;
}

export interface INutritionInfo {
  servingSize?: string;
  calories?: number;
  totalFat?: number;
  saturatedFat?: number;
  transFat?: number;
  cholesterol?: number;
  sodium?: number;
  totalCarbs?: number;
  dietaryFiber?: number;
  sugars?: number;
  protein?: number;
  vitamins?: Record<string, string>;
  minerals?: Record<string, string>;
}

export interface IProductDimensions {
  length?: number;
  width?: number;
  height?: number;
  unit: "cm" | "in";
}


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

  
  brand?: string;
  manufacturer?: string;
  countryOfOrigin?: string;
  hsn?: string; 
  gstRate?: number; 
  pricePerKg?: number;
  pricePerGram?: number;
  pricePerUnit?: number; 
  bulkPricing?: IBulkPricing[];
  shelfLife?: string; 
  bestBefore?: Date;
  nutritionInfo?: INutritionInfo;
  ingredients?: string;
  allergens?: string[];
  certifications?: string[]; 
  fssaiLicense?: string;
  isOrganic?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  productType?: ProductType; 
  dimensions?: IProductDimensions;
  shippingWeight?: number; 
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  returnPolicy?: string;
  warranty?: string;
  videoUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  lastPriceUpdate?: Date;
}


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


export interface ICartItem {
  product: Ref<IProduct>;
  quantity: number;
  variant?: string;
  price: number;
}

export interface ICart extends Timestamps {
  _id: ObjectId;
  user?: Ref<IUser>;
  deviceId?: string;
  items: ICartItem[];
  couponCode?: string;
  discount: number;
}


export interface IWishlistItem {
  product: Ref<IProduct>;
  addedAt: Date;
}

export interface IWishlist extends Timestamps {
  _id: ObjectId;
  user?: Ref<IUser>;
  deviceId?: string;
  items: IWishlistItem[];
}


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
  shipmozoOrderId?: string;
  shipmozoReferenceId?: string;
  awbNumber?: string;
  courierCompany?: string;
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
}


export interface IBanner extends Timestamps {
  _id: ObjectId;
  title: string;
  subtitle?: string;
  image: string;
  link?: string;
  isActive: boolean;
  sortOrder: number;
  position: BannerPosition;
  colorScheme?: BannerColorScheme;
}


export interface IBlog extends Timestamps {
  _id: ObjectId;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  author: string;
  tags: string[];
  status: BlogStatus;
  viewCount: number;
  isActive: boolean;
  metaTitle?: string;
  metaDescription?: string;
  publishedAt?: Date;
}


export interface IApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]> | string[];
  statusCode: number;
}


export interface IPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface IPaginatedResponse<T = unknown> extends IApiResponse<T> {
  pagination: IPagination;
}


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
  permissions?: AdminPermission[];
}


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


export interface INotification extends Timestamps {
  _id: ObjectId;
  user: Ref<IUser>;
  title: string;
  message: string;
  type: "order" | "promo" | "system";
  isRead: boolean;
  link?: string;
}


export type AdminPermission =
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
  | "roles"
  | "blog";

export interface IAdminRole extends Timestamps {
  _id: ObjectId;
  name: string;
  description?: string;
  permissions: AdminPermission[];
  isDefault?: boolean;
  isSystem?: boolean;
  createdBy?: Ref<IUser>;
}
