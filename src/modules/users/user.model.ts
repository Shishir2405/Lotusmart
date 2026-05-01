import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";
import type { IUser, IAddress, UserRole, AddressLabel, AuthProvider, IGeoLocation } from "@/types";


export interface IUserDocument extends Omit<IUser, "_id">, Document {
  comparePassword(candidatePassword: string): Promise<boolean>;
}


const GeoLocationSchema = new Schema<IGeoLocation>(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false },
);


const AddressSchema = new Schema<IAddress>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
    label: {
      type: String,
      enum: ["home", "work", "other"] satisfies AddressLabel[],
      default: "home",
    },
    coordinates: { type: GeoLocationSchema, default: undefined },
    formattedAddress: { type: String, trim: true },
  },
  { _id: true },
);


const UserSchema = new Schema<IUserDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 255,
    },
    password: { type: String, minlength: 6, select: false },
    role: {
      type: String,
      enum: ["admin", "customer"] satisfies UserRole[],
      default: "customer",
    },
    adminRole: { type: Schema.Types.ObjectId, ref: "AdminRole" },
    phone: { type: String, trim: true },
    avatar: { type: String },
    addresses: { type: [AddressSchema], default: [] },
    isVerified: { type: Boolean, default: false },
    authProvider: {
      type: String,
      enum: ["local", "google"] satisfies AuthProvider[],
      default: "local",
    },
    googleId: { type: String, index: true, sparse: true },
    profileComplete: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
    deletedAt: { type: Date, default: null },
    deletedReason: { type: String, trim: true, maxlength: 500 },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, unknown>) {
        delete ret.password;
        delete ret.verificationToken;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: true },
  },
);


UserSchema.index({ role: 1 });
UserSchema.index({ deletedAt: 1 });


UserSchema.pre("save", async function () {
  if (!this.isModified("password") || !this.password) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});


UserSchema.methods.comparePassword = async function (
  candidatePassword: string,
): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};


const User: Model<IUserDocument> =
  mongoose.models.User || mongoose.model<IUserDocument>("User", UserSchema);

export default User;
