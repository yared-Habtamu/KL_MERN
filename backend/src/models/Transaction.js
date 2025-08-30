import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
      type: {
        type: String,
        enum: ["deposit", "withdraw", "purchase"],
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
      
    }, { timestamps: true });

const Transaction = mongoose.model("Transaction", transactionSchema, "Transaction");
export default Transaction;