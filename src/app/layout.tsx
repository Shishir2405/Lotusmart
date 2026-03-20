import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import { defaultMetadata } from "@/config/site";
import { Providers } from "./providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = defaultMetadata;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-[var(--font-poppins)] bg-[#FFFDF7] text-neutral-800 antialiased">
        <Providers>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: "var(--font-poppins)",
                fontSize: "14px",
                fontWeight: "500",
                borderRadius: "10px",
                background: "#FFFDF7",
                color: "#1C1917",
                border: "1px solid #EBE8D8",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              },
              success: { iconTheme: { primary: "#E84672", secondary: "#fff" } },
              error: { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
            }}
          />
        </Providers>
      </body>
    </html>
  );
}
