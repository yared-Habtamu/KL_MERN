import { Request, Response } from "express";
import User from "../models/user";
import { signToken } from "../utils/jwt";
import bcrypt from "bcryptjs";

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

// GET /api/users/telegram?telegramUsername=...&telegramChatId=...
export async function getUserByTelegram(req: Request, res: Response) {
  const { telegramUsername, telegramChatId } = req.query as any;
  if (!telegramUsername && !telegramChatId)
    return res
      .status(400)
      .json({ error: "telegramUsername or telegramChatId required" });

  const q: any = {};
  if (telegramUsername) q.telegramUsername = String(telegramUsername);
  if (telegramChatId) q.telegramChatId = String(telegramChatId);

  const user = await User.findOne(q).select(
    "_id phone name role balance telegramUsername telegramChatId"
  );
  if (!user) return res.status(200).json({});
  res.json({ user });
}

// POST /api/users/register-telegram
export async function registerTelegramUser(req: Request, res: Response) {
  const { telegramUsername, telegramChatId } = req.body as any;
  if (!telegramUsername && !telegramChatId)
    return res
      .status(400)
      .json({ error: "telegramUsername or telegramChatId required" });

  // check existing by either field
  const existing = await User.findOne({
    $or: [
      { telegramUsername: telegramUsername || null },
      { telegramChatId: telegramChatId || null },
    ],
  }).select("_id phone name role balance telegramUsername telegramChatId");
  if (existing) return res.status(200).json({ user: existing });

  // Create a minimal user record. Phone and passwordHash are required in schema, so
  // create a placeholder phone and random passwordHash.
  const phonePlaceholder = `telegram:${telegramChatId || telegramUsername}`;
  const randomPassword = Math.random().toString(36).slice(2, 12);
  const passwordHash = await bcrypt.hash(randomPassword, 10);

  const u = await User.create({
    name: telegramUsername ? String(telegramUsername) : `tg-${telegramChatId}`,
    phone: phonePlaceholder,
    role: "client",
    passwordHash,
    telegramUsername: telegramUsername ? String(telegramUsername) : "",
    telegramChatId: telegramChatId ? String(telegramChatId) : "",
  });

  const safe = await User.findById(u._id).select(
    "_id phone name role balance telegramUsername telegramChatId"
  );
  res.status(201).json({ user: safe });
}
