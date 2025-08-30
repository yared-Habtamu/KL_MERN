import { Router } from "express";
import User from "../models/user";

const router = Router();

// Link telegram info to a user record
// body: { userId?: string, telegramUsername?: string, telegramChatId?: string }
// If userId provided, update that user. Otherwise return bad request.
router.post("/telegram/link", async (req, res) => {
  const { userId, telegramUsername, telegramChatId, telegramId } =
    req.body || {};
  // Accept either userId or telegramId (backwards compatibility)
  try {
    if (userId) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      if (telegramUsername !== undefined)
        (user as any).telegramUsername = telegramUsername;
      if (telegramChatId !== undefined)
        (user as any).telegramChatId = telegramChatId;
      await user.save();
      return res.json({
        ok: true,
        user: {
          id: user._id,
          telegramUsername: (user as any).telegramUsername,
          telegramChatId: (user as any).telegramChatId,
        },
      });
    }

    if (telegramId) {
      // Try to find a user already linked to this telegramId
      const user = await User.findOne({ telegramChatId: String(telegramId) });
      if (user) {
        if (telegramUsername !== undefined)
          (user as any).telegramUsername = telegramUsername;
        await user.save();
        return res.json({
          ok: true,
          user: {
            id: user._id,
            telegramUsername: (user as any).telegramUsername,
            telegramChatId: (user as any).telegramChatId,
          },
        });
      }
      // Not linked to any user — return ok so bot doesn't fail, but instruct linking is required
      return res.json({
        ok: true,
        note: "telegramId not linked to any user; instruct app user to link their account",
      });
    }

    return res
      .status(400)
      .json({ error: "userId or telegramId required to link telegram info" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "failed" });
  }
});

// Update subscription state on a user's telegramChatId (if needed)
// body: { userId: string, subscribed: boolean }
router.post("/telegram/subscription", async (req, res) => {
  const { userId, telegramId, subscribed } = req.body || {};
  if (typeof subscribed !== "boolean")
    return res.status(400).json({ error: "subscribed boolean required" });
  try {
    if (userId) {
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: "User not found" });
      // No explicit field to store subscription; return ok.
      return res.json({ ok: true });
    }

    if (telegramId) {
      const user = await User.findOne({ telegramChatId: String(telegramId) });
      if (!user)
        return res.json({
          ok: true,
          note: "telegramId not linked to any user",
        });
      return res.json({ ok: true });
    }

    return res.status(400).json({ error: "userId or telegramId required" });
  } catch (err: any) {
    res.status(500).json({ error: err.message || "failed" });
  }
});

export default router;
