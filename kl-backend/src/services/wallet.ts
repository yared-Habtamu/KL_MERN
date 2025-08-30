import mongoose from "mongoose";
import User from "../models/user";
import Transaction from "../models/transaction";

type TxType = "deposit" | "withdraw" | "purchase" | "refund";

export async function applyTransaction(options: {
  userId: string;
  type: TxType;
  amount: number;
  meta?: any;
  existingTxId?: string;
  // optional callback executed inside the same session (for tickets, lottery updates)
  inTransaction?: (
    session: mongoose.ClientSession,
    user: any,
    tx: any
  ) => Promise<any>;
}) {
  const { userId, type, amount, meta, existingTxId, inTransaction } = options;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error("User not found");

    const curr = user.balance || 0;
    let next = curr;
    // debit for withdraw/purchase, credit for deposit/refund
    if (type === "withdraw" || type === "purchase") {
      if (curr < amount) throw new Error("Insufficient funds");
      next = curr - amount;
    } else {
      next = curr + amount;
    }

    user.balance = next;
    await user.save({ session });

    let tx: any = null;
    if (existingTxId) {
      tx = await Transaction.findById(existingTxId).session(session);
      if (!tx) throw new Error("Transaction not found");
      tx.balanceAfter = next;
      tx.status = "completed";
      await tx.save({ session });
    } else {
      const created = await Transaction.create(
        [
          {
            userId,
            type,
            amount,
            balanceAfter: next,
            status: "completed",
            meta,
          },
        ],
        { session }
      );
      tx = created[0];
    }

    let result: any = undefined;
    if (typeof inTransaction === "function") {
      result = await inTransaction(session, user, tx);
    }

    await session.commitTransaction();
    session.endSession();
    return { transaction: tx, balance: next, result };
  } catch (err: any) {
    try {
      await session.abortTransaction();
    } catch (_) {}
    try {
      session.endSession();
    } catch (_) {}
    throw err;
  }
}

export default { applyTransaction };
let tx: any = null;
