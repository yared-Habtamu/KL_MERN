// import { Request, Response } from "express";
// import Lottery from "../models/lottery";
// import Ticket from "../models/ticket";
// import User from "../models/user";
// import Transaction from "../models/transaction";
// import { applyTransaction } from "../services/wallet";
// import mongoose from "mongoose";

// function resolveAgentId(src: any): string | null {
//   if (!src) return null;
//   if (typeof src === "string") return src;
//   if (typeof src === "object")
//     return src.id || src._id ? String(src.id || src._id) : null;
//   return String(src);
// }

// export async function listLotteries(req: Request, res: Response) {
//   const list = await Lottery.find().sort({ createdAt: -1 });
//   const normalized = list.map((l: any) => {
//     const obj = l.toObject ? l.toObject() : { ...l };
//     const prizes = Array.isArray(obj.prizes)
//       ? obj.prizes.map((p: any, i: number) => ({
//           // ensure frontend-friendly shape: name/description/image
//           name: p.title || p.name || p?.title || `Prize ${i + 1}`,
//           description: p.description || "",
//           image:
//             p.imageUrl || (p.image && typeof p.image === "string")
//               ? p.imageUrl || p.image
//               : p.image && p.image.data
//                 ? `data:${p.image.contentType || "image/png"};base64,${Buffer.from(p.image.data).toString("base64")}`
//                 : undefined,
//           ...p,
//           id: String(p?.id || p?._id || p?.rank || i + 1),
//         }))
//       : [];
//     // expose legacy field names expected by frontend and add agentId
//     const totalTicketsVal =
//       (obj as any).ticketCount ?? (obj as any).totalTickets ?? 0;
//     const soldTicketsVal =
//       (obj as any).ticketsSold ?? (obj as any).soldTickets ?? 0;
//     // normalize status for frontend (map ended -> completed, open -> active)
//     let status = String(obj.status || "");
//     if (status === "ended") status = "completed";
//     if (status === "open") status = "active";
//     const resolveAgentId = (src: any) => {
//       if (!src) return null;
//       if (typeof src === "string") return src;
//       if (typeof src === "object") return src.id || src._id || null;
//       return String(src);
//     };
//     const agentIdVal =
//       resolveAgentId(obj.createdBy) || resolveAgentId(obj.agentId) || null;
//     return {
//       ...obj,
//       id: String(obj._id),
//       agentId: agentIdVal ? String(agentIdVal) : undefined,
//       totalTickets: totalTicketsVal,
//       soldTickets: soldTicketsVal,
//       status,
//       prizes,
//     };
//   });
//   res.json(normalized);
// }

// export async function getLottery(req: Request, res: Response) {
//   try {
//     const lottery = await Lottery.findById(req.params.id);
//     if (!lottery) return res.status(404).json({ error: "Not found" });
//     const obj = lottery.toObject ? lottery.toObject() : { ...lottery };
//     const prizes = Array.isArray(obj.prizes)
//       ? obj.prizes.map((p: any, i: number) => ({
//           name: p.title || p.name || `Prize ${i + 1}`,
//           description: p.description || "",
//           image:
//             p.imageUrl || (p.image && typeof p.image === "string")
//               ? p.imageUrl || p.image
//               : p.image && p.image.data
//                 ? `data:${p.image.contentType || "image/png"};base64,${Buffer.from(p.image.data).toString("base64")}`
//                 : undefined,
//           ...p,
//           id: String(p?.id || p?._id || p?.rank || i + 1),
//         }))
//       : [];

//     res.json({
//       ...obj,
//       id: String(obj._id),
//       agentId:
//         resolveAgentId((obj as any).createdBy) ||
//         resolveAgentId((obj as any).agentId) ||
//         undefined,
//       totalTickets: (obj as any).ticketCount ?? (obj as any).totalTickets ?? 0,
//       soldTickets: (obj as any).ticketsSold ?? (obj as any).soldTickets ?? 0,
//       prizes,
//     });
//   } catch (err: any) {
//     // Handle invalid ObjectId cast errors gracefully
//     if (err && err.name === "CastError")
//       return res.status(404).json({ error: "Not found" });
//     console.error("getLottery error", err);
//     return res.status(500).json({ error: err.message || "Failed" });
//   }
// }

// export async function createLottery(req: Request, res: Response) {
//   // accept both canonical and legacy fields from frontend
//   const {
//     title,
//     description,
//     drawDate,
//     ticketPrice,
//     ticketCount,
//     totalTickets,
//     type,
//     prizes,
//   } = req.body;
//   const agentId = (req as any).user?.id;
//   // try to resolve agent name from DB if possible
//   let agentName: string | undefined = undefined;
//   if (agentId) {
//     try {
//       const u = await User.findById(agentId).select("name");
//       agentName = u?.name;
//     } catch (_) {}
//   }

//   const normalizedPrizes = Array.isArray(prizes)
//     ? prizes.map((p: any, i: number) => ({
//         // map legacy prize shape (name/description) to canonical (title/imageUrl)
//         rank: p.rank || (p?.id ? Number(p.id) : i + 1),
//         title: p.name || p.title || `Prize ${i + 1}`,
//         imageUrl: p.imageUrl || undefined,
//         id: String(p?.id || p?.rank || i + 1),
//       }))
//     : [];

//   // prefer explicit ticketCount, fall back to legacy totalTickets
//   const ticketCountToUse =
//     typeof ticketCount === "number" ? ticketCount : totalTickets;
//   // default type to 'company' when not provided (frontend may omit it)
//   const typeToUse = type || "company";

//   const l = await Lottery.create({
//     title,
//     description,
//     drawDate,
//     ticketPrice,
//     ticketCount: ticketCountToUse,
//     type: typeToUse,
//     createdBy: agentId,
//     prizes: normalizedPrizes,
//   });
//   // debug: log incoming and stored ticket counts to help track ticket-number glitches
//   try {
//     console.log("createLottery: payload", {
//       ticketCount,
//       totalTickets,
//       ticketCountToUse,
//       agentId,
//     });
//     const saved = await Lottery.findById(l._id).select(
//       "ticketCount ticketsSold createdBy"
//     );
//     console.log("createLottery: saved", saved ? saved.toObject() : null);
//   } catch (e) {
//     console.error("createLottery: debug log failed", e);
//   }
//   const obj = l.toObject ? l.toObject() : { ...l };
//   res
//     .status(201)
//     .json({ ...obj, id: String(obj._id), prizes: normalizedPrizes });
// }

// export async function updateLottery(req: Request, res: Response) {
//   const updated = await Lottery.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//   });
//   if (!updated) return res.status(404).json({ error: "Not found" });
//   res.json(updated);
// }

// export async function deleteLottery(req: Request, res: Response) {
//   await Lottery.findByIdAndDelete(req.params.id);
//   res.json({ ok: true });
// }

// // Purchase tickets: basic flow (deduct user balance, create ticket(s), create transaction)
// export async function buyTickets(req: Request, res: Response) {
//   const { quantity = 1, selections } = req.body;
//   const lotteryId = req.params.id;
//   const userId = (req as any).user?.id;
//   if (!userId) return res.status(401).json({ error: "Unauthorized" });

//   const lottery = await Lottery.findById(lotteryId);
//   if (!lottery) return res.status(404).json({ error: "Lottery not found" });
//   // Accept both 'active' (DB) and legacy 'open' as valid open states
//   const openStates = ["active", "open"];
//   if (!openStates.includes(String(lottery.status)))
//     return res.status(400).json({ error: "Lottery not open" });

//   // Prevent overselling
//   const remaining = (lottery.ticketCount || 0) - (lottery.ticketsSold || 0);
//   if (quantity > remaining)
//     return res.status(400).json({ error: "Not enough tickets available" });

//   // If explicit selections provided, validate they are within range and available
//   const explicitSelections = Array.isArray(selections)
//     ? selections.map((s: any) => Number(s))
//     : [];
//   if (explicitSelections.length > 0) {
//     // validate range
//     const invalid = explicitSelections.filter(
//       (n: number) =>
//         n < 1 || n > (lottery.ticketCount || 0) || !Number.isInteger(n)
//     );
//     if (invalid.length > 0)
//       return res
//         .status(400)
//         .json({ error: "Invalid ticket selections provided" });
//     // check already sold
//     const alreadySold = await Ticket.find({
//       lotteryId,
//       ticketNumber: { $in: explicitSelections },
//     }).select("ticketNumber");
//     if (alreadySold && alreadySold.length > 0) {
//       return res.status(400).json({
//         error: "Some selected tickets are already sold",
//         sold: alreadySold.map((s: any) => s.ticketNumber),
//       });
//     }
//   }

//   const total = (lottery.ticketPrice || 0) * quantity;
//   // debug: log pre-purchase lottery counts
//   try {
//     console.log("buyTickets: pre-purchase", {
//       lotteryId,
//       ticketCount: lottery.ticketCount,
//       ticketsSold: lottery.ticketsSold,
//       quantity,
//       explicitSelectionsLength: explicitSelections.length,
//     });
//   } catch (e) {
//     console.error("buyTickets: debug failed", e);
//   }

//   try {
//     const { transaction, result } = await applyTransaction({
//       userId,
//       type: "purchase",
//       amount: total,
//       meta: { lotteryId, quantity },
//       inTransaction: async (session) => {
//         const tickets: any[] = [];
//         if (explicitSelections.length > 0) {
//           for (let i = 0; i < explicitSelections.length; i++) {
//             const ticketNumber = explicitSelections[i];
//             const ticketDoc = await Ticket.create(
//               [
//                 {
//                   lotteryId,
//                   userId,
//                   selections: [ticketNumber],
//                   price: lottery.ticketPrice,
//                   ticketNumber,
//                   uniqueTicketCode: new mongoose.Types.ObjectId().toHexString(),
//                 },
//               ],
//               { session }
//             );
//             tickets.push(ticketDoc[0]);
//           }
//         } else {
//           const startNumber = (lottery.ticketsSold || 0) + 1;
//           for (let i = 0; i < quantity; i++) {
//             const ticketNumber = startNumber + i;
//             const ticketDoc = await Ticket.create(
//               [
//                 {
//                   lotteryId,
//                   userId,
//                   selections,
//                   price: lottery.ticketPrice,
//                   ticketNumber,
//                   uniqueTicketCode: new mongoose.Types.ObjectId().toHexString(),
//                 },
//               ],
//               { session }
//             );
//             tickets.push(ticketDoc[0]);
//           }
//         }

//         await Lottery.findByIdAndUpdate(
//           lotteryId,
//           { $inc: { ticketsSold: quantity } },
//           { session }
//         );
//         const updatedLottery = await Lottery.findById(lotteryId)
//           .select("ticketsSold ticketCount status")
//           .session(session as any);
//         if (
//           updatedLottery &&
//           typeof (updatedLottery as any).ticketsSold === "number" &&
//           typeof (updatedLottery as any).ticketCount === "number" &&
//           (updatedLottery as any).ticketsSold >=
//             (updatedLottery as any).ticketCount
//         ) {
//           await Lottery.findByIdAndUpdate(
//             lotteryId,
//             { status: "ended", endedAt: new Date() },
//             { session }
//           );
//         }

//         return tickets;
//       },
//     });

//     const createdTicketIds: any[] = Array.isArray(result)
//       ? result.map((t: any) => t._id)
//       : [];
//     const tickets = await Ticket.find({ _id: { $in: createdTicketIds } });

//     console.log(
//       `BuyTickets: user=${userId} lottery=${lotteryId} qty=${quantity} tickets=${tickets
//         .map((t: any) => t.ticketNumber)
//         .join(",")}`
//     );
//     return res.status(201).json({ tickets, transaction });
//   } catch (err: any) {
//     // if transactions not supported, fallback to atomic updates (standalone MongoDB)
//     if (
//       err &&
//       /Transaction numbers are only allowed/i.test(err.message || "")
//     ) {
//       // atomic: decrement balance only if sufficient
//       const updated = await User.findOneAndUpdate(
//         { _id: userId, balance: { $gte: total } },
//         { $inc: { balance: -total } },
//         { new: true }
//       ).select("balance");

//       if (!updated)
//         return res
//           .status(400)
//           .json({ error: "Insufficient funds or user not found" });

//       // create transaction
//       const tx = await Transaction.create({
//         userId,
//         type: "purchase",
//         amount: total,
//         balanceAfter: updated.balance,
//         meta: { lotteryId, quantity },
//       });

//       // create tickets; if ticket creation fails, attempt to refund
//       try {
//         const tickets = [] as any[];
//         if (explicitSelections.length > 0) {
//           for (let i = 0; i < explicitSelections.length; i++) {
//             const ticketNumber = explicitSelections[i];
//             const t = await Ticket.create({
//               lotteryId,
//               userId,
//               selections: [ticketNumber],
//               price: lottery.ticketPrice,
//               ticketNumber,
//               uniqueTicketCode: new mongoose.Types.ObjectId().toHexString(),
//             });
//             tickets.push(t);
//           }
//         } else {
//           const startNumber = (lottery.ticketsSold || 0) + 1;
//           for (let i = 0; i < quantity; i++) {
//             const ticketNumber = startNumber + i;
//             const t = await Ticket.create({
//               lotteryId,
//               userId,
//               selections,
//               price: lottery.ticketPrice,
//               ticketNumber,
//               uniqueTicketCode: new mongoose.Types.ObjectId().toHexString(),
//             });
//             tickets.push(t);
//           }
//         }
//         // update lottery counts
//         await Lottery.findByIdAndUpdate(lotteryId, {
//           $inc: { ticketsSold: quantity },
//         });
//         const updatedLottery = await Lottery.findById(lotteryId).select(
//           "ticketsSold ticketCount status"
//         );
//         if (
//           updatedLottery &&
//           typeof (updatedLottery as any).ticketsSold === "number" &&
//           typeof (updatedLottery as any).ticketCount === "number" &&
//           (updatedLottery as any).ticketsSold >=
//             (updatedLottery as any).ticketCount
//         ) {
//           await Lottery.findByIdAndUpdate(lotteryId, {
//             status: "ended",
//             endedAt: new Date(),
//           });
//         }
//         console.log(
//           `BuyTickets (fallback): user=${userId} lottery=${lotteryId} qty=${quantity} tickets=${tickets
//             .map((t: any) => t.ticketNumber)
//             .join(",")}`
//         );
//         return res.status(201).json({ tickets, transaction: tx });
//       } catch (ticketErr: any) {
//         console.error(
//           "Ticket creation failed after balance decrement, attempting refund",
//           ticketErr
//         );
//         if (ticketErr && (ticketErr as any).stack)
//           console.error((ticketErr as any).stack);
//         // attempt refund
//         const postUser = await User.findById(userId);
//         await Transaction.create({
//           userId,
//           type: "refund",
//           amount: total,
//           balanceAfter: postUser ? postUser.balance : 0,
//           meta: { reason: "ticket_creation_failed" },
//         });
//         return res
//           .status(500)
//           .json({
//             error: "Ticket creation failed, refund issued",
//             details: String((ticketErr as any)?.message || ticketErr),
//           });
//       }
//     }

//     console.error(err);
//     return res.status(500).json({ error: err.message || "Failed" });
//   }
// }
import { Request, Response } from "express";
import Lottery from "../models/lottery";
import Ticket, { ITicket } from "../models/ticket";
import User from "../models/user";
import Transaction from "../models/transaction";
import { applyTransaction } from "../services/wallet";
import mongoose, { Document, ObjectId } from "mongoose";

// Define proper interfaces for the populated documents
interface PopulatedUser {
  _id: mongoose.Types.ObjectId;
  name?: string;
}

interface PopulatedLottery extends mongoose.Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  ticketCount?: number;
  ticketsSold?: number;
  ticketPrice: number;
  status?: string;
  createdBy: mongoose.Types.ObjectId | PopulatedUser;
  prizes: any[];
  createdAt: Date;
  updatedAt: Date;
}

// Helper function to convert Mongoose document to plain object
const toPlainObject = (doc: any): any => {
  return doc.toObject ? doc.toObject() : { ...doc };
};

export async function listLotteries(req: Request, res: Response) {
  try {
    const list = await Lottery.find()
      .sort({ createdAt: -1 })
      .populate<{ createdBy: PopulatedUser }>("createdBy", "name");
    const normalized = list.map((l: any) => {
      const obj = toPlainObject(l);
      const prizes = Array.isArray(obj.prizes)
        ? obj.prizes.map((p: any, i: number) => ({
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

      // Handle the populated createdBy field
      const createdBy = obj.createdBy as PopulatedUser;

      return {
        ...obj,
        id: String(obj._id),
        agentId: createdBy?._id || obj.createdBy,
        agentName: createdBy?.name || "Unknown Agent",
        // support canonical and legacy fields, ensure numeric values
        totalTickets: Number(
          (obj as any).ticketCount ?? (obj as any).totalTickets ?? 0
        ),
        soldTickets: Number(
          (obj as any).ticketsSold ?? (obj as any).soldTickets ?? 0
        ),
        prizes,
      };
    });
    res.json(normalized);
  } catch (err: any) {
    console.error("listLotteries error", err);
    return res
      .status(500)
      .json({ error: err.message || "Failed to fetch lotteries" });
  }
}

export async function getLottery(req: Request, res: Response) {
  try {
    const lottery = await Lottery.findById(req.params.id).populate<{
      createdBy: PopulatedUser;
    }>("createdBy", "name");
    if (!lottery) return res.status(404).json({ error: "Not found" });

    const obj = toPlainObject(lottery);
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

    // Handle the populated createdBy field
    const createdBy = obj.createdBy as PopulatedUser;

    res.json({
      ...obj,
      id: String(obj._id),
      agentId: createdBy?._id || obj.createdBy,
      agentName: createdBy?.name || "Unknown Agent",
      totalTickets: Number(
        (obj as any).ticketCount ?? (obj as any).totalTickets ?? 0
      ),
      soldTickets: Number(
        (obj as any).ticketsSold ?? (obj as any).soldTickets ?? 0
      ),
      prizes,
    });
  } catch (err: any) {
    if (err && err.name === "CastError")
      return res.status(404).json({ error: "Not found" });
    console.error("getLottery error", err);
    return res.status(500).json({ error: err.message || "Failed" });
  }
}

export async function createLottery(req: Request, res: Response) {
  // Support multipart/form-data (multer) where files are in req.files and prizes metadata
  const {
    title,
    description,
    drawDate,
    ticketPrice,
    ticketCount,
    totalTickets,
    type,
  } = req.body as any;
  // prizes might come as JSON string or as individual fields when multipart
  let prizes: any[] = [];
  try {
    if (req.body.prizes) {
      // if prizes sent as JSON string
      if (typeof req.body.prizes === "string")
        prizes = JSON.parse(req.body.prizes);
      else prizes = req.body.prizes;
    } else {
      // try to reconstruct prizes from fields like prizes[0][name]
      // naive approach: collect indices from body keys
      const prizeIndices = new Set<number>();
      Object.keys(req.body).forEach((k) => {
        const m = k.match(/^prizes\[(\d+)\]\[(.+)\]$/);
        if (m) prizeIndices.add(Number(m[1]));
      });
      const indices = Array.from(prizeIndices).sort((a, b) => a - b);
      prizes = indices.map((i) => ({
        rank: Number((req.body as any)[`prizes[${i}][rank]`]) || i + 1,
        name: (req.body as any)[`prizes[${i}][name]`] || "",
        description: (req.body as any)[`prizes[${i}][description]`] || "",
        // hasFile flag may be present
      }));
    }
  } catch (e) {
    prizes = [];
  }
  const agentId = (req as any).user?.id;

  let agentName: string | undefined = undefined;
  if (agentId) {
    try {
      const u = await User.findById(agentId).select("name");
      agentName = u?.name;
    } catch (_) {}
  }

  // If multer provided files, map them to prizes in order they were appended (prizeFiles)
  const files = (req as any).files as Express.Multer.File[] | undefined;
  const prizeFiles =
    Array.isArray(files) && files.length > 0 ? files : undefined;

  const normalizedPrizes = Array.isArray(prizes)
    ? prizes.map((p: any, i: number) => {
        const base: any = {
          rank: p.rank || i + 1,
          title: p.name || p.title || `Prize ${i + 1}`,
          description: p.description || "",
        };
        // attach file buffer if available (match by index order)
        if (prizeFiles && prizeFiles[i]) {
          try {
            const f = prizeFiles[i];
            base.image = { data: f.buffer, contentType: f.mimetype };
            // provide imageUrl as data URL for immediate frontend use
            base.imageUrl = `data:${f.mimetype};base64,${Buffer.from(f.buffer).toString("base64")}`;
          } catch (e) {
            // ignore file processing errors
          }
        }
        return base;
      })
    : [];

  const ticketCountToUse =
    typeof ticketCount === "number" ? ticketCount : totalTickets;
  const typeToUse = type || "company";
  // default status: prefer provided status; otherwise new lotteries start as 'pending'
  const providedStatus =
    (req.body && (req.body.status || req.body.state)) || undefined;
  const statusToUse = providedStatus ? String(providedStatus) : "pending";

  try {
    const createPayload: any = {
      title,
      description,
      drawDate,
      ticketPrice,
      ticketCount: ticketCountToUse,
      type: typeToUse,
      createdBy: agentId,
      prizes: normalizedPrizes,
    };
    if (statusToUse) createPayload.status = statusToUse;

    const l = await Lottery.create(createPayload);

    const obj = toPlainObject(l);
    res.status(201).json({
      ...obj,
      id: String(obj._id),
      prizes: normalizedPrizes,
      agentId: agentId,
      agentName: agentName || "You",
    });
  } catch (error) {
    console.error("Error creating lottery:", error);
    res.status(500).json({ error: "Failed to create lottery" });
  }
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

export async function buyTickets(req: Request, res: Response) {
  const { quantity = 1, selections } = req.body;
  const lotteryId = req.params.id;
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const lottery = await Lottery.findById(lotteryId);
  if (!lottery) return res.status(404).json({ error: "Lottery not found" });

  const openStates = ["active", "open"];
  if (!openStates.includes(String(lottery.status)))
    return res.status(400).json({ error: "Lottery not open" });

  const remaining = (lottery.ticketCount || 0) - (lottery.ticketsSold || 0);
  if (quantity > remaining)
    return res.status(400).json({ error: "Not enough tickets available" });

  const explicitSelections = Array.isArray(selections)
    ? selections.map((s: any) => Number(s))
    : [];

  if (explicitSelections.length > 0) {
    const invalid = explicitSelections.filter(
      (n: number) =>
        n < 1 || n > (lottery.ticketCount || 0) || !Number.isInteger(n)
    );
    if (invalid.length > 0)
      return res
        .status(400)
        .json({ error: "Invalid ticket selections provided" });

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

    return res.status(201).json({
      tickets: tickets.map((t) => {
        const ticketObj = toPlainObject(t);
        return {
          id: ticketObj._id,
          lotteryId: ticketObj.lotteryId,
          userId: ticketObj.userId,
          ticketNumber: ticketObj.ticketNumber,
          price: ticketObj.price,
          purchasedAt: ticketObj.createdAt,
        };
      }),
      transaction,
    });
  } catch (err: any) {
    if (
      err &&
      /Transaction numbers are only allowed/i.test(err.message || "")
    ) {
      const updated = await User.findOneAndUpdate(
        { _id: userId, balance: { $gte: total } },
        { $inc: { balance: -total } },
        { new: true }
      ).select("balance");

      if (!updated)
        return res
          .status(400)
          .json({ error: "Insufficient funds or user not found" });

      const tx = await Transaction.create({
        userId,
        type: "purchase",
        amount: total,
        balanceAfter: updated.balance,
        meta: { lotteryId, quantity },
      });

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

        return res.status(201).json({
          tickets: tickets.map((t) => {
            const ticketObj = toPlainObject(t);
            return {
              id: ticketObj._id,
              lotteryId: ticketObj.lotteryId,
              userId: ticketObj.userId,
              ticketNumber: ticketObj.ticketNumber,
              price: ticketObj.price,
              purchasedAt: ticketObj.createdAt,
            };
          }),
          transaction: tx,
        });
      } catch (ticketErr) {
        console.error(
          "Ticket creation failed after balance decrement, attempting refund",
          ticketErr
        );

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
