import { z } from "zod";

export const createLotterySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  drawDate: z
    .string()
    .refine((s) => !isNaN(Date.parse(s)), { message: "Invalid date" }),
  ticketPrice: z.number().nonnegative(),
  totalTickets: z.number().int().nonnegative().optional(),
});

export const buyTicketsSchema = z.object({
  quantity: z.number().int().positive().optional(),
  selections: z.any().optional(),
});
