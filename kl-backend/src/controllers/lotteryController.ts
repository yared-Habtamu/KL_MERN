import { Request, Response } from "express";
import Lottery from "../models/lottery";
import Ticket from "../models/ticket";
import User from "../models/user";
import Transaction from "../models/transaction";
import { applyTransaction } from "../services/wallet";
import mongoose from "mongoose";

export async function listLotteries(req: Request, res: Response) {
  const list = await Lottery.find().sort({ createdAt: -1 });
  const normalized = list.map((l: any) => {
    const obj = l.toObject ? l.toObject() : { ...l };
    const prizes = Array.isArray(obj.prizes)
      ? obj.prizes.map((p: any, i: number) => ({
          // ensure frontend-friendly shape: name/description/image
          name: p.title || p.name || p?.title || `Prize ${i + 1}`,
          description: p.description || "",
          image:
            p.imageUrl || (p.image && typeof p.image === "string")
              ? p.imageUrl || p.image
              : p.image && p.image.data
                ? `data:${p.image.contentType || "image/png"};base64,${Buffer.from(p.image.data).toString("base64")}`
                : undefined,
          ...p,
          id: String(p?.id || p?._id || p?.rank || i + 1),
        }))
      : [];
    // expose legacy field names expected by frontend
    return {
      ...obj,
      id: String(obj._id),
      totalTickets:
        (obj as any).ticketCount ??
        (obj as any).totalTickets ??
        (obj as any).ticketCount,
      soldTickets:
        (obj as any).ticketsSold ??
        (obj as any).soldTickets ??
        (obj as any).ticketsSold,
      prizes,
    };
  });
  res.json(normalized);
}

export async function getLottery(req: Request, res: Response) {
  try {
    const lottery = await Lottery.findById(req.params.id);
    if (!lottery) return res.status(404).json({ error: "Not found" });
    const obj = lottery.toObject ? lottery.toObject() : { ...lottery };
    const prizes = Array.isArray(obj.prizes)
      ? obj.prizes.map((p: any, i: number) => ({
          name: p.title || p.name || `Prize ${i + 1}`,
          description: p.description || "",
          image:
            p.imageUrl || (p.image && typeof p.image === "string")
              ? p.imageUrl || p.image
              : p.image && p.image.data
                ? `data:${p.image.contentType || "image/png"};base64,${Buffer.from(p.image.data).toString("base64")}`
                : undefined,
          ...p,
          id: String(p?.id || p?._id || p?.rank || i + 1),
        }))
      : [];

    res.json({
      ...obj,
      id: String(obj._id),
      totalTickets:
        (obj as any).ticketCount ??
        (obj as any).totalTickets ??
        (obj as any).ticketCount,
      soldTickets:
        (obj as any).ticketsSold ??
        (obj as any).soldTickets ??
        (obj as any).ticketsSold,
      prizes,
    });
  } catch (err: any) {
    // Handle invalid ObjectId cast errors gracefully
    if (err && err.name === "CastError")
      return res.status(404).json({ error: "Not found" });
    console.error("getLottery error", err);
    return res.status(500).json({ error: err.message || "Failed" });
  }
}

export async function createLottery(req: Request, res: Response) {
  // accept both canonical and legacy fields from frontend
  const {
    title,
    description,
    drawDate,
    ticketPrice,
    ticketCount,
    totalTickets,
    type,
    prizes,
  } = req.body;
  const agentId = (req as any).user?.id;
  // try to resolve agent name from DB if possible
  let agentName: string | undefined = undefined;
  if (agentId) {
    try {
      const u = await User.findById(agentId).select("name");
      agentName = u?.name;
    } catch (_) {}
  }

  const normalizedPrizes = Array.isArray(prizes)
    ? prizes.map((p: any, i: number) => ({
        // map legacy prize shape (name/description) to canonical (title/imageUrl)
        rank: p.rank || (p?.id ? Number(p.id) : i + 1),
        title: p.name || p.title || `Prize ${i + 1}`,
        imageUrl: p.imageUrl || undefined,
        id: String(p?.id || p?.rank || i + 1),
      }))
    : [];

  // prefer explicit ticketCount, fall back to legacy totalTickets
  const ticketCountToUse =
    typeof ticketCount === "number" ? ticketCount : totalTickets;
  // default type to 'company' when not provided (frontend may omit it)
  const typeToUse = type || "company";

  const l = await Lottery.create({
    title,
    description,
    drawDate,
    ticketPrice,
    ticketCount: ticketCountToUse,
    type: typeToUse,
    createdBy: agentId,
    prizes: normalizedPrizes,
  });
  const obj = l.toObject ? l.toObject() : { ...l };
  res
    .status(201)
    .json({ ...obj, id: String(obj._id), prizes: normalizedPrizes });
}

export async function updateLottery(req: Request, res: Response) {
  const updated = await Lottery.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
}

export async function deleteLottery(req: Request, res: Response) {
  await Lottery.findByIdAndDelete(req.params.id);
  res.json({ ok: true });
}

// Purchase tickets: basic flow (deduct user balance, create ticket(s), create transaction)
export async function buyTickets(req: Request, res: Response) {
  const { quantity = 1, selections } = req.body;
  const lotteryId = req.params.id;
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const lottery = await Lottery.findById(lotteryId);
  if (!lottery) return res.status(404).json({ error: "Lottery not found" });
  // Accept both 'active' (DB) and legacy 'open' as valid open states
  const openStates = ["active", "open"];
  if (!openStates.includes(String(lottery.status)))
    return res.status(400).json({ error: "Lottery not open" });

  // Prevent overselling
  const remaining = (lottery.ticketCount || 0) - (lottery.ticketsSold || 0);
  if (quantity > remaining)
    return res.status(400).json({ error: "Not enough tickets available" });

  // If explicit selections provided, validate they are within range and available
  const explicitSelections = Array.isArray(selections)
    ? selections.map((s: any) => Number(s))
    : [];
  if (explicitSelections.length > 0) {
    // validate range
    const invalid = explicitSelections.filter(
      (n: number) =>
        n < 1 || n > (lottery.ticketCount || 0) || !Number.isInteger(n)
    );
    if (invalid.length > 0)
      return res
        .status(400)
        .json({ error: "Invalid ticket selections provided" });
    // check already sold
    const alreadySold = await Ticket.find({
      lotteryId,
      ticketNumber: { $in: explicitSelections },
    }).select("ticketNumber");
    if (alreadySold && alreadySold.length > 0) {
      return res.status(400).json({
        error: "Some selected tickets are already sold",
        sold: alreadySold.map((s: any) => s.ticketNumber),
      });
    }
  }

  const total = (lottery.ticketPrice || 0) * quantity;

  try {
    const { transaction, result } = await applyTransaction({
      userId,
      type: "purchase",
      amount: total,
      meta: { lotteryId, quantity },
      inTransaction: async (session) => {
        const tickets: any[] = [];
        if (explicitSelections.length > 0) {
          for (let i = 0; i < explicitSelections.length; i++) {
            const ticketNumber = explicitSelections[i];
            const ticketDoc = await Ticket.create(
              [
                {
                  lotteryId,
                  userId,
                  selections: [ticketNumber],
                  price: lottery.ticketPrice,
                  ticketNumber,
                },
              ],
              { session }
            );
            tickets.push(ticketDoc[0]);
          }
        } else {
          const startNumber = (lottery.ticketsSold || 0) + 1;
          for (let i = 0; i < quantity; i++) {
            const ticketNumber = startNumber + i;
            const ticketDoc = await Ticket.create(
              [
                {
                  lotteryId,
                  userId,
                  selections,
                  price: lottery.ticketPrice,
                  ticketNumber,
                },
              ],
              { session }
            );
            tickets.push(ticketDoc[0]);
          }
        }

        await Lottery.findByIdAndUpdate(
          lotteryId,
          { $inc: { ticketsSold: quantity } },
          { session }
        );
        const updatedLottery = await Lottery.findById(lotteryId)
          .select("ticketsSold ticketCount status")
          .session(session as any);
        if (
          updatedLottery &&
          typeof (updatedLottery as any).ticketsSold === "number" &&
          typeof (updatedLottery as any).ticketCount === "number" &&
          (updatedLottery as any).ticketsSold >=
            (updatedLottery as any).ticketCount
        ) {
          await Lottery.findByIdAndUpdate(
            lotteryId,
            { status: "ended" },
            { session }
          );
        }

        return tickets;
      },
    });

    const createdTicketIds: any[] = Array.isArray(result)
      ? result.map((t: any) => t._id)
      : [];
    const tickets = await Ticket.find({ _id: { $in: createdTicketIds } });

    console.log(
      `BuyTickets: user=${userId} lottery=${lotteryId} qty=${quantity} tickets=${tickets
        .map((t: any) => t.ticketNumber)
        .join(",")}`
    );
    return res.status(201).json({ tickets, transaction });
  } catch (err: any) {
    // if transactions not supported, fallback to atomic updates (standalone MongoDB)
    if (
      err &&
      /Transaction numbers are only allowed/i.test(err.message || "")
    ) {
      // atomic: decrement balance only if sufficient
      const updated = await User.findOneAndUpdate(
        { _id: userId, balance: { $gte: total } },
        { $inc: { balance: -total } },
        { new: true }
      ).select("balance");

      if (!updated)
        return res
          .status(400)
          .json({ error: "Insufficient funds or user not found" });

      // create transaction
      const tx = await Transaction.create({
        userId,
        type: "purchase",
        amount: total,
        balanceAfter: updated.balance,
        meta: { lotteryId, quantity },
      });

      // create tickets; if ticket creation fails, attempt to refund
      try {
        const tickets = [] as any[];
        if (explicitSelections.length > 0) {
          for (let i = 0; i < explicitSelections.length; i++) {
            const ticketNumber = explicitSelections[i];
            const t = await Ticket.create({
              lotteryId,
              userId,
              selections: [ticketNumber],
              price: lottery.ticketPrice,
              ticketNumber,
            });
            tickets.push(t);
          }
        } else {
          const startNumber = (lottery.ticketsSold || 0) + 1;
          for (let i = 0; i < quantity; i++) {
            const ticketNumber = startNumber + i;
            const t = await Ticket.create({
              lotteryId,
              userId,
              selections,
              price: lottery.ticketPrice,
              ticketNumber,
            });
            tickets.push(t);
          }
        }
        // update lottery counts
        await Lottery.findByIdAndUpdate(lotteryId, {
          $inc: { ticketsSold: quantity },
        });
        const updatedLottery = await Lottery.findById(lotteryId).select(
          "ticketsSold ticketCount status"
        );
        if (
          updatedLottery &&
          typeof (updatedLottery as any).ticketsSold === "number" &&
          typeof (updatedLottery as any).ticketCount === "number" &&
          (updatedLottery as any).ticketsSold >=
            (updatedLottery as any).ticketCount
        ) {
          await Lottery.findByIdAndUpdate(lotteryId, { status: "ended" });
        }
        console.log(
          `BuyTickets (fallback): user=${userId} lottery=${lotteryId} qty=${quantity} tickets=${tickets
            .map((t: any) => t.ticketNumber)
            .join(",")}`
        );
        return res.status(201).json({ tickets, transaction: tx });
      } catch (ticketErr) {
        console.error(
          "Ticket creation failed after balance decrement, attempting refund",
          ticketErr
        );
        // attempt refund
        const postUser = await User.findById(userId);
        await Transaction.create({
          userId,
          type: "refund",
          amount: total,
          balanceAfter: postUser ? postUser.balance : 0,
          meta: { reason: "ticket_creation_failed" },
        });
        return res
          .status(500)
          .json({ error: "Ticket creation failed, refund issued" });
      }
    }

    console.error(err);
    return res.status(500).json({ error: err.message || "Failed" });
  }
}
