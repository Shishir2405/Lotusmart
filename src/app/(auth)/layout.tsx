import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9E8] to-[#F7F6F0] flex flex-col">
      {/* Auth header */}
      <header className="py-5 px-6">
        <Link href="/" className="text-2xl font-bold text-[#4D4529]">
          Lotus<span className="text-[#E84672]">Mart</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        {children}
      </main>

      <footer className="text-center py-4 text-xs text-neutral-400">
        © {new Date().getFullYear()} LotusMart. All rights reserved.
      </footer>
    </div>
  );
}
