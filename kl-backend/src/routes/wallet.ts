import { Router } from "express";
import {
  getWallet,
  deposit,
  withdraw,
  listWalletTransactions,
  listPendingDeposits,
  reviewDeposit,
} from "../controllers/walletController";
import { requireAuth } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { depositSchema, withdrawSchema } from "../schemas/wallet";
import { requireRole } from "../middleware/roles";
import multer from "multer";

const upload = multer({ dest: "uploads/" });

const router = Router();

router.get("/", requireAuth, getWallet);
// accept multipart/form-data for deposits (file upload + fields)
router.post(
  "/deposit",
  requireAuth,
  upload.single("paymentProof") as any,
  deposit
);
router.post("/withdraw", requireAuth, validateBody(withdrawSchema), withdraw);
router.get("/transactions", requireAuth, listWalletTransactions);

// Admin routes for deposit review
router.get("/pending", requireAuth, requireRole("admin"), listPendingDeposits);
router.post(
  "/pending/:id/review",
  requireAuth,
  requireRole("admin"),
  reviewDeposit
);

export default router;
