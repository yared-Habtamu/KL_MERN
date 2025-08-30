import mongoose, { Schema, Document } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  name: string;
  phone: string;
  role: "admin" | "manager" | "seller" | "operator" | "agent" | "client";
  passwordHash: string;
  commissionRate?: number;
  cityAddress?: string;
  kebeleAddress?: string;
  balance?: number;
  telegramUsername?: string;
  telegramChatId?: string;
  createdAt: Date;
  updatedAt: Date;
  matchPassword?: (password: string) => Promise<boolean>;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: ["admin", "manager", "seller", "operator", "agent", "client"],
      required: true,
    },
    passwordHash: { type: String, required: true },
    commissionRate: { type: Number, default: 0 },
    cityAddress: { type: String, default: "Bulehora" },
    kebeleAddress: { type: String, default: "01" },
    balance: { type: Number, default: 0 },
    telegramUsername: { type: String, default: "" },
    telegramChatId: { type: String, default: "" },
  },
  { timestamps: true }
);

// instance method to compare plain password against stored hash
UserSchema.methods.matchPassword = async function (password: string) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Use collection name "User" (was "Staff") to match requested table name
const User = mongoose.model<IUser>("User", UserSchema, "User");
export default User;
