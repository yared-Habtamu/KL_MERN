import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
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

// Add method for comparing password
userSchema.methods.matchPassword = async function (password) {
  return await bcrypt.compare(password, this.passwordHash);
};

// Keep collection name as "Staff" to avoid data migration
const User = mongoose.model("User", userSchema, "User");
export default User;
