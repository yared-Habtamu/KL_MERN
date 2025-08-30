import { z } from "zod";

export const depositSchema = z.object({
  // accept number or numeric string when sent via multipart/form-data
  amount: z.union([
    z.number().positive(),
    z.string().regex(/^\d+(\.\d+)?$/, "Invalid number"),
  ]),
  currency: z.string().optional(),
});

export const withdrawSchema = z.object({
  amount: z.number().positive(),
  reason: z.string().optional(),
});
