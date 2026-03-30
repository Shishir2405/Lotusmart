// Auth business logic for LotusMart

import crypto from "crypto";

import { ApiError } from "@/lib/api-error";
import connectDB from "@/lib/db";
import { signToken } from "@/lib/jwt";
import User, { IUserDocument } from "@/modules/users/user.model";
import type { ITokenPayload, SafeUser } from "@/types";
import type { RegisterInput, UpdateProfileInput } from "@/utils/validators";

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/** Strip sensitive fields and return a client-safe user object. */
function toSafeUser(user: IUserDocument): SafeUser {
  const obj = user.toJSON();
  return obj as unknown as SafeUser;
}

/** Build a JWT payload from a user document. */
function buildTokenPayload(user: IUserDocument): ITokenPayload {
  return {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };
}

/**
 * Ensure a default admin account exists for local/dev environments.
 * The account is sourced from ADMIN_EMAIL and ADMIN_PASSWORD env vars.
 */
async function ensureDefaultAdminAccount() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();

    if (!adminEmail || !adminPassword) return;

    await connectDB();

    const existingAdmin = await User.findOne({ email: adminEmail }).select("+password");

    if (!existingAdmin) {
      await User.create({
        name: "LotusMart Admin",
        email: adminEmail,
        password: adminPassword,
        role: "admin",
        isVerified: true,
      });
      console.log("[Auth] Default admin account created");
      return;
    }

    let shouldSave = false;

    if (existingAdmin.role !== "admin") {
      existingAdmin.role = "admin";
      shouldSave = true;
    }

    if (!existingAdmin.isVerified) {
      existingAdmin.isVerified = true;
      existingAdmin.verificationToken = undefined;
      shouldSave = true;
    }

    const matchesEnvPassword = await existingAdmin.comparePassword(adminPassword);
    if (!matchesEnvPassword) {
      existingAdmin.password = adminPassword;
      shouldSave = true;
    }

    if (shouldSave) {
      await existingAdmin.save();
      console.log("[Auth] Default admin account updated");
    }
  } catch (err) {
    console.error("[Auth] Failed to ensure default admin account:", err);
  }
}

// ──────────────────────────────────────────────
// Auth Service
// ──────────────────────────────────────────────

/**
 * Register a new user.
 * - Checks for duplicate email
 * - Hashes password (handled by pre-save hook)
 * - Generates email verification token
 * - Returns safe user object + JWT
 */
export async function register(data: RegisterInput) {
  await connectDB();

  // Check for existing user
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw ApiError.conflict("A user with this email already exists");
  }

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString("hex");

  // Create user (password is hashed by the pre-save hook)
  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    verificationToken,
  });

  // Generate JWT
  const token = await signToken(buildTokenPayload(user));

  return { user: toSafeUser(user), token };
}

/**
 * Log in with email + password.
 * - Validates credentials
 * - Checks email verification status
 * - Returns safe user + JWT
 */
export async function login(email: string, password: string) {
  await connectDB();

  await ensureDefaultAdminAccount();

  // Normalize email to match how Mongoose stores it (lowercase + trimmed)
  const normalizedEmail = email.trim().toLowerCase();

  // Find user with password field explicitly selected
  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  // Verify password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  // Check verification
  if (!user.isVerified) {
    throw ApiError.forbidden("Please verify your email address before logging in");
  }

  // Generate JWT
  const token = await signToken(buildTokenPayload(user));

  return { user: toSafeUser(user), token };
}

/**
 * Verify a user's email address via the token sent during registration.
 */
export async function verifyEmail(token: string) {
  await connectDB();

  const user = await User.findOne({ verificationToken: token }).select("+verificationToken");
  if (!user) {
    throw ApiError.badRequest("Invalid or expired verification token");
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  return toSafeUser(user);
}

/**
 * Initiate the forgot-password flow.
 * - Generates a reset token with a 1-hour expiry
 * - Saves the token to the user record
 * - (Email sending is handled separately)
 */
export async function forgotPassword(email: string) {
  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    // Do not reveal whether the email exists — return silently
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // Return the plain token (to be sent via email)
  return resetToken;
}

/**
 * Reset a user's password using a valid reset token.
 */
export async function resetPassword(token: string, newPassword: string) {
  await connectDB();

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: tokenHash,
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) {
    throw ApiError.badRequest("Invalid or expired reset token");
  }

  user.password = newPassword; // Hashed by pre-save hook
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return toSafeUser(user);
}

/**
 * Get user profile by ID (password excluded by default).
 */
export async function getProfile(userId: string) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return toSafeUser(user);
}

/**
 * Update profile fields (name, phone, avatar).
 */
export async function updateProfile(userId: string, data: UpdateProfileInput) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  if (data.name !== undefined) user.name = data.name;
  if (data.phone !== undefined) user.phone = data.phone || undefined;
  if (data.avatar !== undefined) user.avatar = data.avatar || undefined;

  await user.save();

  return toSafeUser(user);
}

/**
 * Change the authenticated user's password.
 */
export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  await connectDB();

  const user = await User.findById(userId).select("+password");
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw ApiError.unauthorized("Current password is incorrect");
  }

  user.password = newPassword; // Hashed by pre-save hook
  await user.save();

  return toSafeUser(user);
}
