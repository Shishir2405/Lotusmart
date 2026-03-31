

export const SITE_NAME = "LotusMart" as const;
export const SITE_TAGLINE = "Premium Spices, Dry Fruits & Gifting" as const;
export const SITE_DOMAIN = "https://lotusmart.in" as const;
export const SUPPORT_EMAIL = "support@lotusmart.in" as const;
export const SUPPORT_PHONE = "+91-9876543210" as const;


export const COLORS = {
  cream: "#FFF8F0",
  rose: "#E8567F",
  roseDark: "#C93D63",
  roseLight: "#FDEEF2",
  olive: "#5C6B3C",
  oliveDark: "#3E4A28",
  oliveLight: "#E8EDDD",
  gold: "#B59F6B",
  goldDark: "#8C7A4F",
  goldLight: "#F5F0E1",
  textPrimary: "#1F2937",
  textSecondary: "#6B7280",
} as const;

export const FONT_FAMILY = {
  heading: "'Playfair Display', Georgia, serif",
  body: "'DM Sans', system-ui, sans-serif",
} as const;


export const CATEGORIES = [
  {
    name: "Spices",
    slug: "spices",
    subcategories: [
      { name: "Whole Spices", slug: "whole-spices" },
      { name: "Ground Spices", slug: "ground-spices" },
      { name: "Spice Blends", slug: "spice-blends" },
      { name: "Exotic Spices", slug: "exotic-spices" },
      { name: "Organic Spices", slug: "organic-spices" },
    ],
  },
  {
    name: "Dry Fruits",
    slug: "dry-fruits",
    subcategories: [
      { name: "Almonds", slug: "almonds" },
      { name: "Cashews", slug: "cashews" },
      { name: "Pistachios", slug: "pistachios" },
      { name: "Walnuts", slug: "walnuts" },
      { name: "Raisins", slug: "raisins" },
      { name: "Dates", slug: "dates" },
      { name: "Mixed Dry Fruits", slug: "mixed-dry-fruits" },
      { name: "Seeds", slug: "seeds" },
    ],
  },
  {
    name: "Gifting",
    slug: "gifting",
    subcategories: [
      { name: "Gift Boxes", slug: "gift-boxes" },
      { name: "Festival Hampers", slug: "festival-hampers" },
      { name: "Corporate Gifts", slug: "corporate-gifts" },
      { name: "Wedding Favours", slug: "wedding-favours" },
      { name: "Custom Hampers", slug: "custom-hampers" },
    ],
  },
  {
    name: "Herbs & Teas",
    slug: "herbs-teas",
    subcategories: [
      { name: "Herbal Teas", slug: "herbal-teas" },
      { name: "Green Teas", slug: "green-teas" },
      { name: "Dried Herbs", slug: "dried-herbs" },
    ],
  },
  {
    name: "Honey & Superfoods",
    slug: "honey-superfoods",
    subcategories: [
      { name: "Raw Honey", slug: "raw-honey" },
      { name: "Infused Honey", slug: "infused-honey" },
      { name: "Superfoods", slug: "superfoods" },
    ],
  },
] as const;


export const ORDER_STATUSES = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: "Order Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  placed: "bg-blue-100 text-blue-800",
  confirmed: "bg-indigo-100 text-indigo-800",
  processing: "bg-yellow-100 text-yellow-800",
  shipped: "bg-purple-100 text-purple-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  returned: "bg-gray-100 text-gray-800",
};


export const PAYMENT_METHODS = ["cod", "razorpay"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: "Cash on Delivery",
  razorpay: "Razorpay (UPI / Cards / Net Banking)",
};

export const PAYMENT_STATUSES = [
  "pending",
  "paid",
  "failed",
  "refunded",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];


export const USER_ROLES = ["admin", "customer"] as const;
export type UserRole = (typeof USER_ROLES)[number];


export const ADDRESS_LABELS = ["home", "work", "other"] as const;
export type AddressLabel = (typeof ADDRESS_LABELS)[number];


export const PRODUCT_UNITS = ["kg", "g", "pieces", "pack", "ml", "L", "box"] as const;
export type ProductUnit = (typeof PRODUCT_UNITS)[number];


export const PRODUCT_TYPES = ["spice", "dry_fruit", "gifting", "herb", "honey", "superfood"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  spice: "Spice",
  dry_fruit: "Dry Fruit",
  gifting: "Gifting",
  herb: "Herb & Tea",
  honey: "Honey",
  superfood: "Superfood",
};


export const GST_RATES = [0, 5, 12, 18, 28] as const;

export const CERTIFICATIONS = [
  "FSSAI",
  "Organic India",
  "ISO 22000",
  "HACCP",
  "GMP",
  "Halal",
  "Kosher",
  "USDA Organic",
  "India Organic",
  "Fair Trade",
] as const;


export const BANNER_POSITIONS = ["hero", "sidebar", "category"] as const;
export type BannerPosition = (typeof BANNER_POSITIONS)[number];


export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 12,
  MAX_LIMIT: 100,
  ADMIN_DEFAULT_LIMIT: 20,
} as const;


export const SORT_OPTIONS = [
  { label: "Relevance", value: "relevance" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
  { label: "Newest First", value: "newest" },
  { label: "Rating", value: "rating" },
  { label: "Popularity", value: "popularity" },
] as const;


export const SHIPPING = {
  FREE_SHIPPING_THRESHOLD: 499, 
  DEFAULT_SHIPPING_COST: 49, 
  EXPRESS_SHIPPING_COST: 99, 
  ESTIMATED_DELIVERY_DAYS: { standard: 5, express: 2 },
} as const;


export const MAX_CART_QUANTITY = 10;
export const LOW_STOCK_THRESHOLD = 5;
export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;
export const IMAGE_MAX_SIZE_MB = 5;
export const MAX_IMAGES_PER_PRODUCT = 8;
export const OTP_EXPIRY_MINUTES = 10;
export const RESET_TOKEN_EXPIRY_HOURS = 1;

export const CURRENCY = {
  code: "INR",
  symbol: "\u20B9",
  locale: "en-IN",
} as const;
