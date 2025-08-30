import { z } from "zod";
import { Request, Response, NextFunction } from "express";

export function validateBody(schema: z.ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const err = result.error.format();
      return res.status(400).json({ error: "Validation failed", details: err });
    }
    req.body = result.data;
    next();
  };
}
