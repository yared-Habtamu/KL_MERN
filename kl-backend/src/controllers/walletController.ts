import { Request, Response } from "express";
import mongoose from "mongoose";
import User from "../models/user";
import Transaction from "../models/transaction";
import { applyTransaction } from "../services/wallet";

export async function getWallet(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const user = await User.findById(userId).select("balance");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ balance: user.balance || 0 });
}

export async function deposit(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { amount } = req.body;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const n = Number(amount || 0);
  if (isNaN(n) || n <= 0)
    return res.status(400).json({ error: "Invalid amount" });
  // Create a pending deposit transaction with optional payment proof (admin will approve)
  try {
    // payment proof may be sent in req.file (via multer) or in req.body.meta
    const meta = { ...(req.body || {}) };
    if ((req as any).file) {
      meta.paymentProof = {
        filename: (req as any).file.filename,
        path: (req as any).file.path,
        mimetype: (req as any).file.mimetype,
      };
    }

    const tx = await Transaction.create({
      userId,
      type: "deposit",
      amount: n,
      balanceAfter: (await User.findById(userId))?.balance || 0,
      status: "pending",
      meta,
    });

    console.log(`Deposit (pending): user=${userId} amount=${n} tx=${tx?._id}`);
    return res.status(201).json({ transaction: tx });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Deposit failed" });
  }
}

// Admin: list pending deposits
export async function listPendingDeposits(req: Request, res: Response) {
  const pending = await Transaction.find({
    type: "deposit",
    status: "pending",
  }).sort({ createdAt: -1 });
  res.json(pending);
}

// Admin: approve or reject a pending deposit
export async function reviewDeposit(req: Request, res: Response) {
  const { id } = req.params;
  const { action } = req.body; // 'approve' | 'reject'
  if (!id) return res.status(400).json({ error: "Missing transaction id" });
  if (!["approve", "reject"].includes(action))
    return res.status(400).json({ error: "Invalid action" });

  const tx = await Transaction.findById(id);
  if (!tx) return res.status(404).json({ error: "Not found" });
  if (tx.status !== "pending")
    return res.status(400).json({ error: "Transaction not reviewable" });

  if (action === "reject") {
    tx.status = "rejected";
    await tx.save();
    return res.json({ ok: true, transaction: tx });
  }

  // approve: handle both deposit and withdraw via applyTransaction
  try {
    if (tx.type === "deposit") {
      const result = await applyTransaction({
        userId: String(tx.userId),
        type: "deposit",
        amount: tx.amount || 0,
        existingTxId: String(tx._id),
      });
      return res.json({
        ok: true,
        transaction: result.transaction,
        balance: result.balance,
      });
    }

    if (tx.type === "withdraw") {
      // apply withdrawal: ensure sufficient balance then deduct
      const result = await applyTransaction({
        userId: String(tx.userId),
        type: "withdraw",
        amount: tx.amount || 0,
        existingTxId: String(tx._id),
      });
      return res.json({
        ok: true,
        transaction: result.transaction,
        balance: result.balance,
      });
    }

    return res
      .status(400)
      .json({ error: "Unsupported transaction type for review" });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Review failed" });
  }
}

export async function withdraw(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { amount } = req.body;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const n = Number(amount || 0);
  if (isNaN(n) || n <= 0)
    return res.status(400).json({ error: "Invalid amount" });
  // create a pending withdrawal transaction; admin must approve to apply
  try {
    // ensure user has sufficient balance before creating pending withdraw
    const user = await User.findById(userId).select("balance");
    if (!user) return res.status(404).json({ error: "User not found" });
    if ((user.balance || 0) < n)
      return res.status(400).json({ error: "Insufficient funds" });

    const tx = await Transaction.create({
      userId,
      type: "withdraw",
      amount: n,
      balanceAfter: user.balance, // after approval will be decreased
      status: "pending",
      meta: req.body,
    });
    console.log(`Withdraw (pending): user=${userId} amount=${n} tx=${tx?._id}`);
    return res.status(201).json({ transaction: tx });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err.message || "Withdraw failed" });
  }
}

export async function listWalletTransactions(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const txs = await Transaction.find({ userId }).sort({ createdAt: -1 });
  res.json(txs);
}
