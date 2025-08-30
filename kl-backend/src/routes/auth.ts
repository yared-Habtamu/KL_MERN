import { Router } from "express";
import {
  register,
  login,
  logout,
  changePassword,
} from "../controllers/authController";
import { validateBody } from "../middleware/validate";
import { registerSchema, loginSchema } from "../schemas/auth";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/register", validateBody(registerSchema), register);
router.post("/login", validateBody(loginSchema), login);
router.post("/logout", logout);
router.post("/change-password", requireAuth, changePassword);

export default router;
