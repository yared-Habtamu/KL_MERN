import { Request, Response } from "express";
import User from "../models/user";
import { signToken } from "../utils/jwt";

export async function getUserById(req: Request, res: Response) {
  const u = await User.findById(req.params.id).select(
    "_id phone name role balance"
  );
  if (!u) return res.status(404).json({ error: "User not found" });
  res.json(u);
}

export async function updateMe(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const allowed: any = {};
  const { name, phone, role } = req.body;
  if (typeof name === "string") allowed.name = name;
  if (typeof phone === "string") allowed.phone = phone;
  // Allow role change only to player or agent (no admin)
  if (role === "player" || role === "agent") allowed.role = role;

  const updated = await User.findByIdAndUpdate(userId, allowed, {
    new: true,
  }).select("_id phone name role balance");
  if (!updated) return res.status(404).json({ error: "User not found" });
  // Return new token so frontend has updated role in JWT
  const token = signToken({ id: updated._id, role: updated.role });
  res.json({ user: updated, token });
}
