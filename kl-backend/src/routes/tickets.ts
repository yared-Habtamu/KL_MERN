import { Router } from "express";
import {
  listTicketsForLottery,
  getTicket,
  listUserTickets,
} from "../controllers/ticketController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.get("/lottery/:id", listTicketsForLottery);
router.get("/:id", getTicket);
router.get("/user/me", requireAuth, listUserTickets);

export default router;
