import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import User from "../models/user";

const router = Router();

// Dev-only route to promote the authenticated user to 'agent'
router.post("/promote", requireAuth, async (req, res) => {
  const userId = (req as any).user?.id;
  if (!userId) return res.status(401).json({ error: "Unauthorized" });
  const u = await User.findByIdAndUpdate(
    userId,
    { role: "agent" },
    { new: true }
  );
  if (!u) return res.status(404).json({ error: "User not found" });
  res.json({ ok: true, user: { id: u._id, phone: u.phone, role: u.role } });
});

export default router;
