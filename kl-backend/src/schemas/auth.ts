import { z } from "zod";

const ethiopianPhoneRegex = /^(\+251|0)9\d{8}$/;

export const registerSchema = z.object({
  phone: z.string().regex(ethiopianPhoneRegex, {
    message: "Phone must be in Ethiopian format +2519XXXXXXXX",
  }),
  password: z.string().min(6),
  // accept either name or fullName from frontend, make optional so controller can default
  name: z.string().min(1).optional(),
  // frontend only allows client and agent when registering
  role: z.enum(["client", "agent"]).optional(),
  cityAddress: z.string().optional(),
  kebeleAddress: z.string().optional(),
});

export const loginSchema = z.object({
  phone: z.string().regex(ethiopianPhoneRegex, {
    message: "Phone must be in Ethiopian format +2519XXXXXXXX",
  }),
  password: z.string().min(6),
});
