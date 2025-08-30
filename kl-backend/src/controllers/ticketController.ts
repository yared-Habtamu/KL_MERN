import { Request, Response } from "express";
import Ticket from "../models/ticket";

export async function listTicketsForLottery(req: Request, res: Response) {
  const tickets = await Ticket.find({ lotteryId: req.params.id });
  const normalized = tickets.map((t: any) => ({
    id: (t as any)._id,
    lotteryId: (t as any).lotteryId,
    userId: (t as any).userId,
    selections: (t as any).selections,
    ticketNumber: (t as any).ticketNumber,
    price: (t as any).price,
    purchasedAt: (t as any).purchasedAt,
    createdAt: (t as any).createdAt,
  }));
  res.json(normalized);
}

export async function getTicket(req: Request, res: Response) {
  const ticket = await Ticket.findById(req.params.id);
  if (!ticket) return res.status(404).json({ error: "Not found" });
  res.json({
    id: (ticket as any)._id,
    lotteryId: (ticket as any).lotteryId,
    userId: (ticket as any).userId,
    selections: (ticket as any).selections,
    ticketNumber: (ticket as any).ticketNumber,
    price: (ticket as any).price,
    purchasedAt: (ticket as any).purchasedAt,
    createdAt: (ticket as any).createdAt,
  });
}

export async function listUserTickets(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const tickets = await Ticket.find({ userId });
  const normalized = tickets.map((t: any) => ({
    id: (t as any)._id,
    lotteryId: (t as any).lotteryId,
    userId: (t as any).userId,
    selections: (t as any).selections,
    ticketNumber: (t as any).ticketNumber,
    price: (t as any).price,
    purchasedAt: (t as any).purchasedAt,
    createdAt: (t as any).createdAt,
  }));
  res.json(normalized);
}
