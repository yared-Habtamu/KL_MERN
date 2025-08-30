import { Router } from "express";
import {
  submitApplication,
  listApplications,
  reviewApplication,
} from "../controllers/agentApplicationController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/roles";

const router = Router();

// public submission
router.post("/", submitApplication);

// admin can list applications
router.get("/", requireAuth, requireRole("admin"), listApplications);
// admin review
router.post(
  "/:id/review",
  requireAuth,
  requireRole("admin"),
  reviewApplication
);

export default router;
