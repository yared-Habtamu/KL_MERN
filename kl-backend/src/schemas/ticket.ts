import { z } from "zod";

export const createTicketSchema = z.object({
  quantity: z.number().int().positive().default(1),
  selections: z.any().optional(),
});

export const ticketQuerySchema = z.object({
  lotteryId: z.string().optional(),
});
