"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { RiGlobalLine, RiArrowDownSLine } from "react-icons/ri";


const LANGUAGES = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "తెలుగు", flag: "🇮🇳" },
  { code: "bn", name: "বাংলা", flag: "🇮🇳" },
  { code: "mr", name: "मराठी", flag: "🇮🇳" },
  { code: "gu", name: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", name: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "മലയാളം", flag: "🇮🇳" },
  { code: "pa", name: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "ur", name: "اردو", flag: "🇵🇰" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
];

const COOKIE_NAME = "googtrans";

function readGoogTransCookie(): string {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)googtrans=([^;]+)/);
  if (!match) return "en";
  const parts = decodeURIComponent(match[1]).split("/");
  return parts[2] || "en";
}

function writeGoogTransCookie(lang: string) {
  if (typeof document === "undefined") return;
  const value = lang === "en" ? "" : `/en/${lang}`;
  const host = window.location.hostname;
  const isIp = /^\d+\.\d+\.\d+\.\d+$/.test(host);
  const isLocalhost = host === "localhost";
  const rootDomain = host.split(".").slice(-2).join(".");
  const maxAge = lang === "en" ? 0 : 60 * 60 * 24 * 365;
  const expires =
    lang === "en"
      ? "Thu, 01 Jan 1970 00:00:00 GMT"
      : new Date(Date.now() + maxAge * 1000).toUTCString();

  const write = (domain?: string) => {
    const parts = [
      `${COOKIE_NAME}=${encodeURIComponent(value)}`,
      `path=/`,
      `expires=${expires}`,
      `SameSite=Lax`,
    ];
    if (domain) parts.push(`domain=${domain}`);
    document.cookie = parts.join("; ");
  };

  write();
  if (!isIp && !isLocalhost) {
    write(host);
    if (rootDomain && rootDomain !== host) write(`.${rootDomain}`);
  }
}

export function LanguageToggler() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const applyLanguageToWidget = useCallback((langCode: string) => {
    const attempt = (tries: number) => {
      const select = document.querySelector(".goog-te-combo") as HTMLSelectElement | null;
      if (select) {
        select.value = langCode;
        select.dispatchEvent(new Event("change"));
        return;
      }
      if (tries > 0) {
        setTimeout(() => attempt(tries - 1), 200);
      }
    };
    attempt(15);
  }, []);

  useEffect(() => {
    setCurrentLang(readGoogTransCookie());

    let div = document.getElementById("google_translate_element");
    if (!div) {
      div = document.createElement("div");
      div.id = "google_translate_element";
      div.style.display = "none";
      document.body.appendChild(div);
    }

    (window as any).googleTranslateElementInit = () => {
      new (window as any).google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: LANGUAGES.map((l) => l.code).join(","),
          layout: (window as any).google.translate.TranslateElement.InlineLayout.NONE,
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else {
      const cookieLang = readGoogTransCookie();
      if (cookieLang !== "en") applyLanguageToWidget(cookieLang);
    }
  }, [applyLanguageToWidget]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const changeLanguage = (langCode: string) => {
    writeGoogTransCookie(langCode);
    setCurrentLang(langCode);
    setIsOpen(false);
    if (langCode === "en") {
      window.location.reload();
      return;
    }
    applyLanguageToWidget(langCode);
  };

  const current = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium bg-white/80 hover:bg-white border border-neutral-200 hover:border-neutral-300 transition-all shadow-sm"
        aria-label="Change language"
      >
        <RiGlobalLine size={14} className="text-[#5C6B3C]" />
        <span className="hidden sm:inline text-neutral-700 notranslate" translate="no">{current.name}</span>
        <RiArrowDownSLine size={13} className={`text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-neutral-100 py-1.5 z-[9999] max-h-72 overflow-y-auto notranslate" translate="no">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#FFF8F0] transition-colors ${
                currentLang === lang.code ? "bg-[#FFF8F0] text-[#E84672] font-medium" : "text-neutral-700"
              }`}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.name}</span>
              {currentLang === lang.code && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E84672]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
