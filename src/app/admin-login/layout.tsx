export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "linear-gradient(160deg, #0f0f12 0%, #16141c 25%, #1a1520 50%, #141118 75%, #0f0f12 100%)",
      }}
    >
      {children}
    </div>
  );
}
