

import { SITE_NAME, SITE_TAGLINE, SITE_DOMAIN, SUPPORT_EMAIL, SUPPORT_PHONE } from "./constants";

export interface SiteConfig {
  name: string;
  tagline: string;
  description: string;
  url: string;
  ogImage: string;
  keywords: string[];
  authors: { name: string; url: string }[];
  creator: string;
  email: string;
  links: {
    instagram: string;
    facebook: string;
    twitter: string;
    youtube: string;
  };
  locale: string;
  themeColor: string;
  manifest: string;
}

export const siteConfig: SiteConfig = {
  name: SITE_NAME,
  tagline: SITE_TAGLINE,
  description:
    "Shop premium quality spices, dry fruits, and curated gift hampers at LotusMart. Farm-fresh whole spices, organic masalas, almonds, cashews, pistachios, and beautifully packed gifting options for every occasion. Free delivery across India on orders above \u20B9499.",
  url: SITE_DOMAIN,
  ogImage: `${SITE_DOMAIN}/og-image.jpg`,
  keywords: [
    "spices online",
    "buy dry fruits online",
    "premium spices India",
    "organic spices",
    "whole spices",
    "ground spices",
    "almonds",
    "cashews",
    "pistachios",
    "walnuts",
    "raisins",
    "dry fruit gift box",
    "corporate gifting",
    "festival hampers",
    "Diwali gifts",
    "wedding favours",
    "spice blends",
    "masala online",
    "healthy snacks",
    "LotusMart",
  ],
  authors: [{ name: SITE_NAME, url: SITE_DOMAIN }],
  creator: SITE_NAME,
  email: SUPPORT_EMAIL,
  links: {
    instagram: "https://instagram.com/lotusmart.in",
    facebook: "https://facebook.com/lotusmart.in",
    twitter: "https://twitter.com/lotusmart_in",
    youtube: "https://youtube.com/@lotusmart",
  },
  locale: "en_IN",
  themeColor: "#E8567F",
  manifest: "/site.webmanifest",
};


export const defaultMetadata = {
  title: {
    default: `${SITE_NAME} - ${SITE_TAGLINE}`,
    template: `%s | ${SITE_NAME}`,
  },
  description: siteConfig.description,
  keywords: siteConfig.keywords,
  authors: siteConfig.authors,
  creator: siteConfig.creator,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: "website" as const,
    locale: siteConfig.locale,
    url: siteConfig.url,
    title: `${SITE_NAME} - ${SITE_TAGLINE}`,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - ${SITE_TAGLINE}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image" as const,
    title: `${SITE_NAME} - ${SITE_TAGLINE}`,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: "@lotusmart_in",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large" as const,
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon-32x32.png",
    shortcut: "/favicon-32x32.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: siteConfig.manifest,
};


export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    url: siteConfig.url,
    logo: {
      "@type": "ImageObject",
      url: `${siteConfig.url}/logo.png`,
      width: 512,
      height: 512,
    },
    description: siteConfig.description,
    email: siteConfig.email,
    telephone: SUPPORT_PHONE,
    sameAs: [
      siteConfig.links.instagram,
      siteConfig.links.facebook,
      siteConfig.links.twitter,
      siteConfig.links.youtube,
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: SUPPORT_PHONE,
      contactType: "customer service",
      email: siteConfig.email,
      availableLanguage: ["English", "Hindi"],
      areaServed: "IN",
    },
  };
}

export function getWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: { "@id": `${siteConfig.url}/#organization` },
    inLanguage: "en-IN",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteConfig.url}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function getLocalBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Store",
    "@id": `${siteConfig.url}/#store`,
    name: siteConfig.name,
    url: siteConfig.url,
    image: `${siteConfig.url}/og-image.jpg`,
    description: siteConfig.description,
    telephone: SUPPORT_PHONE,
    email: siteConfig.email,
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "UPI, Credit Card, Debit Card, Net Banking",
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "LotusMart Products",
      itemListElement: [
        { "@type": "OfferCatalog", name: "Spices" },
        { "@type": "OfferCatalog", name: "Dry Fruits" },
        { "@type": "OfferCatalog", name: "Gift Boxes & Hampers" },
        { "@type": "OfferCatalog", name: "Herbs & Teas" },
        { "@type": "OfferCatalog", name: "Honey & Superfoods" },
      ],
    },
    sameAs: [
      siteConfig.links.instagram,
      siteConfig.links.facebook,
      siteConfig.links.twitter,
      siteConfig.links.youtube,
    ],
  };
}

export function getCollectionPageJsonLd(category: {
  name: string;
  description?: string;
  url: string;
  products: { name: string; url: string; image?: string; price: number }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: category.name,
    description: category.description ?? `Shop ${category.name} at LotusMart`,
    url: category.url,
    isPartOf: { "@id": `${siteConfig.url}/#website` },
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: category.products.length,
      itemListElement: category.products.slice(0, 12).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: p.url,
        name: p.name,
        ...(p.image && { image: p.image }),
      })),
    },
  };
}

export function getFAQPageJsonLd(
  faqs: { question: string; answer: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}


export function getProductJsonLd(product: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  sku: string;
  availability: "InStock" | "OutOfStock" | "PreOrder";
  ratingValue?: number;
  reviewCount?: number;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    url: product.url,
    brand: {
      "@type": "Brand",
      name: siteConfig.name,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency ?? "INR",
      price: product.price,
      availability: `https://schema.org/${product.availability}`,
      seller: {
        "@type": "Organization",
        name: siteConfig.name,
      },
    },
    ...(product.ratingValue &&
      product.reviewCount && {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.ratingValue,
          reviewCount: product.reviewCount,
        },
      }),
  };
}


export function getBreadcrumbJsonLd(
  items: { name: string; url: string }[],
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
