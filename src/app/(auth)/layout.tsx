export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #FAFAF9 0%, #FFF8F0 30%, #FEF3E2 50%, #FFF8F0 70%, #FAFAF9 100%)",
      }}
    >
      
      <div
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full opacity-[0.045] blur-3xl"
        style={{ background: "radial-gradient(circle, #F4A623 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full opacity-[0.04] blur-3xl"
        style={{ background: "radial-gradient(circle, #D4A31E 0%, transparent 70%)" }}
      />
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.03] blur-3xl"
        style={{ background: "radial-gradient(circle, #E8891C 0%, transparent 70%)" }}
      />

      
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, #8B4513 1.2px, transparent 1.2px), radial-gradient(circle at 80% 30%, #D4A31E 0.8px, transparent 0.8px)",
          backgroundSize: "52px 52px, 36px 36px",
        }}
      />

      <div className="relative z-10">{children}</div>
    </div>
  );
}
