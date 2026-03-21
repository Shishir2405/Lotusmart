"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiMailLine,
  RiLockLine,
  RiEyeLine,
  RiEyeOffLine,
  RiShieldCheckLine,
  RiAdminLine,
  RiArrowRightLine,
  RiDashboardLine,
} from "react-icons/ri";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/auth.store";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function AdminLoginPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const validate = () => {
    const errs: typeof errors = {};
    if (!email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "Password must be at least 6 characters";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});
    try {
      const res = await axios.post<{
        data: { user: { _id: string; name: string; email: string; role: string; avatar?: string } };
      }>("/api/auth/login", { email, password });
      const user = res.data.data.user;
      if (user.role !== "admin") {
        setErrors({ general: "Access denied. Admin credentials required." });
        toast.error("You are not authorized to access the admin panel.");
        return;
      }
      setUser(user as Parameters<typeof setUser>[0]);
      toast.success(`Welcome back, ${user.name?.split(" ")[0]}!`);
      router.push("/admin/dashboard");
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message ?? "Authentication failed"
        : "Authentication failed";
      setErrors({ general: msg });
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease }}
        style={{ width: "100%", maxWidth: "960px" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            borderRadius: "1.75rem",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 40px 100px rgba(0,0,0,0.5)",
          }}
          className="lg:grid-cols-2"
        >
          {/* ── Left Panel — Branding ── */}
          <div
            className="hidden lg:flex"
            style={{
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "2.5rem",
              background: "linear-gradient(160deg, #2A2518 0%, #4D4529 50%, #615834 100%)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Decorative circles */}
            <div
              style={{
                position: "absolute",
                top: "-40px",
                right: "-40px",
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                border: "1px solid rgba(255,224,138,0.1)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: "-60px",
                left: "-60px",
                width: "280px",
                height: "280px",
                borderRadius: "50%",
                border: "1px solid rgba(232,70,114,0.08)",
              }}
            />

            {/* Logo */}
            <div>
              <Link href="/" style={{ textDecoration: "none" }}>
                <span
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    color: "#FFF9E8",
                    letterSpacing: "-0.02em",
                  }}
                >
                  Lotus
                  <span style={{ color: "#E84672" }}>Mart</span>
                </span>
              </Link>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                }}
              >
                <RiShieldCheckLine size={12} style={{ color: "#FFE08A" }} />
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#9C8F62",
                  }}
                >
                  Admin Console
                </span>
              </div>
            </div>

            {/* Hero Image */}
            <div style={{ position: "relative", borderRadius: "1.25rem", overflow: "hidden", margin: "2rem 0" }}>
              <div style={{ position: "relative", height: "220px" }}>
                <Image
                  src="/images/banners/spice-banner.jpg"
                  alt="LotusMart Admin"
                  fill
                  style={{ objectFit: "cover", borderRadius: "1.25rem" }}
                  sizes="400px"
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(42,37,24,0.8) 0%, transparent 60%)",
                    borderRadius: "1.25rem",
                  }}
                />
                <div style={{ position: "absolute", bottom: "1rem", left: "1rem", right: "1rem" }}>
                  <p
                    style={{
                      fontSize: "0.6rem",
                      fontWeight: 800,
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      color: "#FFE08A",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Dashboard Access
                  </p>
                  <p
                    style={{
                      fontSize: "1rem",
                      fontWeight: 700,
                      color: "#fff",
                      lineHeight: 1.3,
                    }}
                  >
                    Manage your entire store from one place
                  </p>
                </div>
              </div>
            </div>

            {/* Feature list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {[
                { icon: RiDashboardLine, text: "Real-time analytics & revenue tracking" },
                { icon: RiShieldCheckLine, text: "Role-based access control" },
                { icon: RiAdminLine, text: "Product, order & user management" },
              ].map((item) => (
                <div
                  key={item.text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    fontSize: "0.8rem",
                    color: "#B8AE86",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "0.5rem",
                      backgroundColor: "rgba(255,224,138,0.1)",
                      border: "1px solid rgba(255,224,138,0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <item.icon size={13} style={{ color: "#FFE08A" }} />
                  </div>
                  {item.text}
                </div>
              ))}
            </div>

            {/* Bottom */}
            <p style={{ fontSize: "0.65rem", color: "#615834", marginTop: "1.5rem" }}>
              Secure 256-bit encrypted connection
            </p>
          </div>

          {/* ── Right Panel — Login Form ── */}
          <div
            style={{
              padding: "2.5rem",
              backgroundColor: "#1C1914",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {/* Mobile logo */}
            <div className="lg:hidden" style={{ marginBottom: "2rem", textAlign: "center" }}>
              <Link href="/" style={{ textDecoration: "none" }}>
                <span style={{ fontSize: "1.5rem", fontWeight: 800, color: "#FFF9E8" }}>
                  Lotus<span style={{ color: "#E84672" }}>Mart</span>
                </span>
              </Link>
            </div>

            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease }}
              style={{ marginBottom: "2rem" }}
            >
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.375rem 0.875rem",
                  borderRadius: "9999px",
                  backgroundColor: "rgba(232,70,114,0.1)",
                  border: "1px solid rgba(232,70,114,0.2)",
                  marginBottom: "1rem",
                }}
              >
                <RiAdminLine size={11} style={{ color: "#E84672" }} />
                <span
                  style={{
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    color: "#E84672",
                  }}
                >
                  Admin Access
                </span>
              </div>
              <h1
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  color: "#FFF9E8",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  marginBottom: "0.375rem",
                }}
              >
                Welcome back
              </h1>
              <p style={{ fontSize: "0.85rem", color: "#9C8F62" }}>
                Sign in with your admin credentials to continue
              </p>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {errors.general && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  style={{
                    padding: "0.75rem 1rem",
                    borderRadius: "0.75rem",
                    backgroundColor: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.2)",
                    marginBottom: "1.25rem",
                  }}
                >
                  <p style={{ fontSize: "0.8rem", color: "#FCA5A5" }}>{errors.general}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <motion.form
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5, ease }}
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
              noValidate
            >
              {/* Email */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label
                  htmlFor="admin-email"
                  style={{ fontSize: "0.78rem", fontWeight: 600, color: "#D4CFB3" }}
                >
                  Email address
                </label>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "0.875rem",
                    backgroundColor: "#2A2518",
                    border: `1.5px solid ${focusedField === "email" ? "#E84672" : errors.email ? "#EF4444" : "#4D4529"}`,
                    transition: "border-color 0.2s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: "0.875rem",
                      color: focusedField === "email" ? "#E84672" : "#9C8F62",
                      transition: "color 0.2s",
                      pointerEvents: "none",
                    }}
                  >
                    <RiMailLine size={16} />
                  </span>
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="admin@lotusmart.com"
                    autoComplete="email"
                    style={{
                      width: "100%",
                      paddingLeft: "2.75rem",
                      paddingRight: "1rem",
                      paddingTop: "0.75rem",
                      paddingBottom: "0.75rem",
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      fontSize: "0.875rem",
                      color: "#FFF9E8",
                    }}
                  />
                </div>
                {errors.email && (
                  <p style={{ fontSize: "0.72rem", color: "#FCA5A5" }}>{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.375rem" }}>
                <label
                  htmlFor="admin-password"
                  style={{ fontSize: "0.78rem", fontWeight: 600, color: "#D4CFB3" }}
                >
                  Password
                </label>
                <div
                  style={{
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    borderRadius: "0.875rem",
                    backgroundColor: "#2A2518",
                    border: `1.5px solid ${focusedField === "password" ? "#E84672" : errors.password ? "#EF4444" : "#4D4529"}`,
                    transition: "border-color 0.2s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      left: "0.875rem",
                      color: focusedField === "password" ? "#E84672" : "#9C8F62",
                      transition: "color 0.2s",
                      pointerEvents: "none",
                    }}
                  >
                    <RiLockLine size={16} />
                  </span>
                  <input
                    id="admin-password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    style={{
                      width: "100%",
                      paddingLeft: "2.75rem",
                      paddingRight: "3rem",
                      paddingTop: "0.75rem",
                      paddingBottom: "0.75rem",
                      backgroundColor: "transparent",
                      border: "none",
                      outline: "none",
                      fontSize: "0.875rem",
                      color: "#FFF9E8",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    style={{
                      position: "absolute",
                      right: "0.875rem",
                      color: "#9C8F62",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    tabIndex={-1}
                  >
                    {showPassword ? <RiEyeOffLine size={16} /> : <RiEyeLine size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p style={{ fontSize: "0.72rem", color: "#FCA5A5" }}>{errors.password}</p>
                )}
              </div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ y: -2, boxShadow: "0 12px 32px rgba(232,70,114,0.3)" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: "100%",
                  padding: "0.875rem",
                  borderRadius: "0.875rem",
                  border: "none",
                  backgroundColor: "#E84672",
                  color: "#fff",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  opacity: isLoading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  marginTop: "0.5rem",
                  transition: "opacity 0.2s",
                }}
              >
                {isLoading ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      style={{
                        width: "16px",
                        height: "16px",
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "#fff",
                        borderRadius: "50%",
                        display: "inline-block",
                      }}
                    />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Access Dashboard
                    <RiArrowRightLine size={16} />
                  </>
                )}
              </motion.button>
            </motion.form>

            {/* Bottom */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              style={{
                marginTop: "2rem",
                paddingTop: "1.25rem",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "0.75rem", color: "#615834" }}>
                Not an admin?{" "}
                <Link
                  href="/login"
                  style={{ color: "#E84672", fontWeight: 600, textDecoration: "none" }}
                >
                  Customer login
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
