import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lotusmart.in";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/admin-login",
          "/api/",
          "/cart",
          "/checkout",
          "/account/",
          "/orders/",
          "/wishlist",
          "/login",
          "/register",
          "/forgot-password",
          "/verify-email",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin/",
          "/admin-login",
          "/api/",
          "/cart",
          "/checkout",
          "/account/",
          "/orders/",
          "/wishlist",
          "/login",
          "/register",
          "/forgot-password",
          "/verify-email",
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
    host: APP_URL,
  };
}
