

import crypto from "crypto";

import { ApiError } from "@/lib/api-error";
import connectDB from "@/lib/db";
import { signToken } from "@/lib/jwt";
import User, { IUserDocument } from "@/modules/users/user.model";
import AdminRole from "@/modules/roles/admin-role.model";
import type { ITokenPayload, SafeUser } from "@/types";
import type {
  RegisterInput,
  UpdateProfileInput,
  CompleteProfileInput,
} from "@/utils/validators";
import type { GoogleIdTokenPayload } from "@/services/google-auth";


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

  const existingUser = await User.findOne({ email: data.email, deletedAt: null });
  if (existingUser) {
    throw ApiError.conflict("A user with this email already exists");
  }

  const verificationToken = crypto.randomBytes(32).toString("hex");

  const addresses = data.address
    ? [
        {
          fullName: data.name,
          phone: data.phone,
          addressLine1: data.address.addressLine1,
          addressLine2: data.address.addressLine2 || undefined,
          city: data.address.city,
          state: data.address.state,
          pincode: data.address.pincode,
          label: data.address.label ?? "home",
          isDefault: true,
          coordinates: data.address.coordinates,
          formattedAddress: data.address.formattedAddress,
        },
      ]
    : [];

  const user = await User.create({
    name: data.name,
    email: data.email,
    password: data.password,
    phone: data.phone || undefined,
    addresses,
    authProvider: "local",
    profileComplete: addresses.length > 0,
    verificationToken,
  });

  const token = await signToken(buildTokenPayload(user));

  return { user: toSafeUser(user), token, verificationToken };
}


export async function upsertGoogleUser(profile: GoogleIdTokenPayload) {
  await connectDB();

  if (!profile.email_verified) {
    throw ApiError.badRequest("Google account email is not verified");
  }

  let user = await User.findOne({
    $or: [{ googleId: profile.sub }, { email: profile.email }],
    deletedAt: null,
  });

  let isNew = false;

  if (!user) {
    isNew = true;
    user = await User.create({
      name: profile.name || profile.email.split("@")[0],
      email: profile.email,
      googleId: profile.sub,
      authProvider: "google",
      avatar: profile.picture,
      isVerified: true,
      profileComplete: false,
    });
  } else {
    let changed = false;
    if (!user.googleId) {
      user.googleId = profile.sub;
      changed = true;
    }
    if (!user.avatar && profile.picture) {
      user.avatar = profile.picture;
      changed = true;
    }
    if (!user.isVerified) {
      user.isVerified = true;
      changed = true;
    }
    if (changed) await user.save();
  }

  const token = await signToken(buildTokenPayload(user));
  return { user: toSafeUser(user), token, isNew };
}


export async function completeProfile(
  userId: string,
  data: CompleteProfileInput,
) {
  await connectDB();

  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  user.phone = data.phone;

  const existingDefault = user.addresses.find((a) => a.isDefault);
  if (existingDefault) {
    existingDefault.fullName = data.address.fullName || user.name;
    existingDefault.phone = data.phone;
    existingDefault.addressLine1 = data.address.addressLine1;
    existingDefault.addressLine2 = data.address.addressLine2 || undefined;
    existingDefault.city = data.address.city;
    existingDefault.state = data.address.state;
    existingDefault.pincode = data.address.pincode;
    existingDefault.label = data.address.label ?? "home";
    existingDefault.coordinates = data.address.coordinates;
    existingDefault.formattedAddress = data.address.formattedAddress;
  } else {
    (user.addresses as any[]).push({
      fullName: data.address.fullName || user.name,
      phone: data.phone,
      addressLine1: data.address.addressLine1,
      addressLine2: data.address.addressLine2 || undefined,
      city: data.address.city,
      state: data.address.state,
      pincode: data.address.pincode,
      label: data.address.label ?? "home",
      isDefault: true,
      coordinates: data.address.coordinates,
      formattedAddress: data.address.formattedAddress,
    });
  }

  user.profileComplete = true;
  await user.save();

  return toSafeUser(user);
}


export async function login(email: string, password: string) {
  await connectDB();

  await ensureDefaultAdminAccount();

  
  const normalizedEmail = email.trim().toLowerCase();


  const user = await User.findOne({ email: normalizedEmail, deletedAt: null }).select("+password");
  if (!user) {
    throw ApiError.unauthorized("Invalid email or password");
  }


  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized("Invalid email or password");
  }


  let permissions: string[] | undefined;
  if (user.role === "admin") {
    const populated = await User.findById(user._id).populate({ path: "adminRole", model: AdminRole });
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

  const user = await User.findOne({ email, deletedAt: null });
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

  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  return toSafeUser(user);
}


export async function deleteAccount(userId: string, reason?: string) {
  await connectDB();

  const user = await User.findOne({ _id: userId, deletedAt: null });
  if (!user) {
    throw ApiError.notFound("User not found");
  }

  const now = new Date();
  user.deletedAt = now;
  if (reason) user.deletedReason = reason.slice(0, 500);

  // Free the email + googleId for future re-signup by tagging them with a deletion suffix.
  // The original values are preserved inside `deletedReason` metadata if needed via audit logs.
  user.email = `deleted_${now.getTime()}_${user.email}`;
  if (user.googleId) {
    user.googleId = `deleted_${now.getTime()}_${user.googleId}`;
  }

  // Invalidate any active password reset tokens.
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();
  return toSafeUser(user);
}


export async function restoreAccount(userId: string) {
  await connectDB();

  const user = await User.findOne({ _id: userId, deletedAt: { $ne: null } });
  if (!user) {
    throw ApiError.notFound("Deleted user not found");
  }

  // Strip the deletion prefix from email/googleId so the user can log in again.
  user.email = user.email.replace(/^deleted_\d+_/, "");
  if (user.googleId) {
    user.googleId = user.googleId.replace(/^deleted_\d+_/, "");
  }

  // Refuse if a live user has since claimed the original email.
  const collision = await User.findOne({
    email: user.email,
    deletedAt: null,
    _id: { $ne: user._id },
  });
  if (collision) {
    throw ApiError.conflict("Another active user has since taken this email");
  }

  user.deletedAt = null;
  user.deletedReason = undefined;
  user.deletedBy = undefined;
  await user.save();
  return toSafeUser(user);
}


export async function updateProfile(userId: string, data: UpdateProfileInput) {
  await connectDB();

  const user = await User.findOne({ _id: userId, deletedAt: null });
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

  const user = await User.findOne({ _id: userId, deletedAt: null }).select("+password");
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
