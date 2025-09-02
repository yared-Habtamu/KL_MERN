import { Router } from "express";
import {
  getUserById,
  updateMe,
  getUserByTelegram,
  registerTelegramUser,
} from "../controllers/userController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Telegram helpers (must be defined before the param route)
router.get("/telegram", getUserByTelegram);
router.post("/register-telegram", registerTelegramUser);

router.get("/:id", getUserById);
router.put("/me", requireAuth, updateMe);

export default router;
