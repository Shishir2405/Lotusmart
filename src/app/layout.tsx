import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { defaultMetadata } from "@/config/site";
import { Providers } from "./providers";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-playfair",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-sans bg-[#FFFDF7] text-neutral-800 antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-right"
            reverseOrder={false}
            gutter={10}
            containerStyle={{ top: 20, right: 20 }}
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: "var(--font-dm-sans), sans-serif",
                fontSize: "13px",
                fontWeight: "500",
                borderRadius: "14px",
                background: "rgba(255, 253, 247, 0.92)",
                color: "#1C1917",
                border: "1px solid rgba(235, 232, 216, 0.6)",
                boxShadow:
                  "0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                padding: "12px 16px",
              },
              success: {
                iconTheme: { primary: "#16a34a", secondary: "#fff" },
                style: {
                  background: "rgba(240, 253, 244, 0.92)",
                  border: "1px solid rgba(22, 163, 74, 0.15)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                },
              },
              error: {
                iconTheme: { primary: "#dc2626", secondary: "#fff" },
                style: {
                  background: "rgba(254, 242, 242, 0.92)",
                  border: "1px solid rgba(220, 38, 38, 0.15)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                },
              },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
