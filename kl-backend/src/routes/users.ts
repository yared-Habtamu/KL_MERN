import { Router } from "express";
import { getUserById, updateMe } from "../controllers/userController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/:id", getUserById);
router.put("/me", requireAuth, updateMe);

export default router;
