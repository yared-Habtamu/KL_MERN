import { z } from "zod";

export const createLotterySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  // drawDate is optional — the system will determine draw/end when tickets sell out
  drawDate: z
    .string()
    .refine((s) => !isNaN(Date.parse(s)), { message: "Invalid date" })
    .optional(),
  ticketPrice: z.number().nonnegative(),
  // accept ticketCount (preferred) or legacy totalTickets
  ticketCount: z.number().int().nonnegative().optional(),
  totalTickets: z.number().int().nonnegative().optional(),
  prizes: z
    .array(
      z.object({
        id: z.any().optional(),
        rank: z.number().int().optional(),
        name: z.string().optional(),
        description: z.string().optional(),
        image: z.string().optional(), // accept data URL or image URL
      })
    )
    .optional(),
});

export const buyTicketsSchema = z.object({
  quantity: z.number().int().positive().optional(),
  selections: z.any().optional(),
});
