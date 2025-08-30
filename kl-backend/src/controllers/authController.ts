import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/user";
import { signToken } from "../utils/jwt";

export async function changePassword(req: Request, res: Response) {
  const userId = (req as any).user?.id;
  const { currentPassword, newPassword } = req.body;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  if (!currentPassword || !newPassword)
    return res
      .status(400)
      .json({ error: "currentPassword and newPassword required" });
  if (String(newPassword).length < 6)
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });

  const user = await User.findById(userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const ok = await bcrypt.compare(currentPassword, (user as any).passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid current password" });

  const hashed = await bcrypt.hash(newPassword, 10);
  (user as any).passwordHash = hashed;
  await user.save();

  res.json({ ok: true });
}

export async function register(req: Request, res: Response) {
  const { phone, password, name, role, cityAddress, kebeleAddress } = req.body;
  if (!phone || !password)
    return res.status(400).json({ error: "Phone and password required" });
  if (String(password).length < 6)
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters" });

  try {
    const exists = await User.findOne({ phone });
    if (exists) return res.status(409).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    // default role to 'client' when not provided by frontend (role selection happens later)
    const roleToUse = role || "client";
    const user = await User.create({
      phone,
      passwordHash: hashed,
      name,
      role: roleToUse,
      cityAddress,
      kebeleAddress,
    });

    const token = signToken({ id: user._id, role: user.role });
    res.json({
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (err: any) {
    // return a readable error instead of a silent 500
    const message = err?.message || "Failed to register user";
    return res.status(500).json({ error: message });
  }
}

export async function login(req: Request, res: Response) {
  const { phone, password } = req.body;
  if (!phone || !password)
    return res.status(400).json({ error: "Phone and password required" });

  const user = await User.findOne({ phone });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const ok = await bcrypt.compare(password, (user as any).passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  const token = signToken({ id: user._id, role: user.role });
  res.json({
    user: { id: user._id, phone: user.phone, name: user.name, role: user.role },
    token,
  });
}

export async function logout(req: Request, res: Response) {
  // For JWT stateless logout, frontend should drop token; we return success
  res.json({ ok: true });
}
