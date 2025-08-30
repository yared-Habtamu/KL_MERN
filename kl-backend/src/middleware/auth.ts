import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";

export interface AuthedRequest extends Request {
  user?: { id: string; role: string };
}

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const auth = req.headers.authorization;
  if (!auth)
    return res.status(401).json({ error: "Missing authorization header" });

  const [type, token] = auth.split(" ");
  if (type !== "Bearer" || !token)
    return res.status(401).json({ error: "Invalid authorization format" });

  try {
    const payload = verifyToken(token);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}
