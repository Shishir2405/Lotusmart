

import crypto from "crypto";

import { ApiError } from "@/lib/api-error";
import connectDB from "@/lib/db";
import { signToken } from "@/lib/jwt";
import User, { IUserDocument } from "@/modules/users/user.model";
import type { ITokenPayload, SafeUser } from "@/types";
import type { RegisterInput, UpdateProfileInput } from "@/utils/validators";


function toSafeUser(user: IUserDocument): SafeUser {
  const obj = user.toJSON();
  return obj as unknown as SafeUser;
}


function buildTokenPayload(user: IUserDocument, permissions?: string[]): ITokenPayload {
  return {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    permissions: permissions as ITokenPayload["permissions"],
  };
}


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


export async function register(data: RegisterInput) {
  await connectDB();

  
  const existingUser = await User.findOne({ email: data.email });
  if (existingUser) {
    throw ApiError.conflict("A user with this email already exists");
  }

  
  const verificationToken = crypto.randomBytes(32).toString("hex");

  
  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    phone: data.phone || undefined,
    verificationToken,
  });

  
  const token = await signToken(buildTokenPayload(user));

  return { user: toSafeUser(user), token, verificationToken };
}


export async function login(email: string, password: string) {
  await connectDB();

  await ensureDefaultAdminAccount();

  
  const normalizedEmail = email.trim().toLowerCase();

  
  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }


  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }


  let permissions: string[] | undefined;
  if (user.role === "admin") {
    const populated = await User.findById(user._id).populate("adminRole");
    if (populated?.adminRole && typeof populated.adminRole === "object" && "permissions" in populated.adminRole) {
      permissions = (populated.adminRole as any).permissions;
    }
    
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    if (user.email === adminEmail) {
      permissions = undefined; 
    }
  }

  
  const token = await signToken(buildTokenPayload(user, permissions));

  
  const safeUser = toSafeUser(user);
  return { user: { ...safeUser, permissions }, token };
}


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


export async function forgotPassword(email: string) {
  await connectDB();

  const user = await User.findOne({ email });
  if (!user) {
    
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");

  user.resetPasswordToken = resetTokenHash;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  return { resetToken, userName: user.name, userEmail: user.email };
}


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

  user.password = newPassword; 
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return toSafeUser(user);
}


export async function getProfile(userId: string) {
  await connectDB();

  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return toSafeUser(user);
}


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

  user.password = newPassword; 
  await user.save();

  return toSafeUser(user);
}
