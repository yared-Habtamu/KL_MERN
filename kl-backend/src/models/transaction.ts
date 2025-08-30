import mongoose, { Schema, Document } from "mongoose";

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  type: "deposit" | "withdraw" | "purchase" | "refund";
  amount: number;
  balanceAfter: number;
  status?: "pending" | "completed" | "rejected";
  meta?: any;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema<ITransaction> = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["deposit", "withdraw", "purchase", "refund"],
      required: true,
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    status: {
      type: String,
      enum: ["pending", "completed", "rejected"],
      default: "completed",
    },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

const Transaction = mongoose.model<ITransaction>(
  "Transaction",
  TransactionSchema,
  "Transaction"
);
export default Transaction;
