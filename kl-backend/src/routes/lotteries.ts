import { Router } from "express";
import {
  listLotteries,
  getLottery,
  createLottery,
  updateLottery,
  deleteLottery,
  buyTickets,
} from "../controllers/lotteryController";
import { requireAuth } from "../middleware/auth";
import { requireRole } from "../middleware/roles";
import { listTicketsForLottery } from "../controllers/ticketController";
import { registerWinners, listWinners } from "../controllers/winnerController";

const router = Router();

import { validateBody } from "../middleware/validate";
import { createLotterySchema, buyTicketsSchema } from "../schemas/lottery";
router.get("/", listLotteries);
router.get("/:id", getLottery);
// restricted to agent/admin
router.post(
  "/",
  requireAuth,
  requireRole("agent", "admin"),
  validateBody(createLotterySchema),
  createLottery
);
router.put("/:id", requireAuth, requireRole("agent", "admin"), updateLottery);
router.delete(
  "/:id",
  requireAuth,
  requireRole("agent", "admin"),
  deleteLottery
);
router.get("/:id/tickets", listTicketsForLottery);
router.post(
  "/:id/tickets",
  requireAuth,
  validateBody(buyTicketsSchema),
  buyTickets
);

// Winners registration - only agent/admin who created lottery can register winners
router.post(
  "/:id/winners",
  requireAuth,
  requireRole("agent", "admin"),
  registerWinners
);
router.get("/:id/winners", listWinners);

export default router;
