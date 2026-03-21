export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(155deg, #FFFDF7 0%, #FFF9E8 30%, #F7F6F0 60%, #FFFDF7 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative gradient orbs */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          right: "-10%",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,70,114,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-20%",
          left: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(181,159,107,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      {/* Dot grid overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "radial-gradient(circle, rgba(122,110,66,0.06) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative", zIndex: 10 }}>{children}</div>
    </div>
  );
}
