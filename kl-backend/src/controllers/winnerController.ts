import { Request, Response } from "express";
import Lottery from "../models/lottery";
import Winner from "../models/winner";
import { AuthedRequest } from "../middleware/auth";

export async function listWinners(req: Request, res: Response) {
  const winnersDoc = await Winner.findOne({ lotteryId: req.params.id });
  if (!winnersDoc) return res.status(404).json({ error: "Not found" });
  res.json(winnersDoc.winners || []);
}

export async function registerWinners(req: AuthedRequest, res: Response) {
  const lotteryId = req.params.id;
  const { winners } = req.body; // expect array of { name, phone }
  if (!Array.isArray(winners))
    return res.status(400).json({ error: "Invalid winners payload" });

  const lottery = await Lottery.findById(lotteryId);
  if (!lottery) return res.status(404).json({ error: "Not found" });

  // only allow registration when lottery status is ended (draw completed)
  // require status === 'ended' and all tickets sold
  // use documented fields (ticketCount / ticketsSold) but tolerate legacy names via any cast
  const sold = Number(
    (lottery as any).ticketsSold ?? (lottery as any).soldTickets ?? 0
  );
  const total = Number(
    (lottery as any).ticketCount ?? (lottery as any).totalTickets ?? 0
  );
  if (!(lottery.status === "ended" && total > 0 && sold >= total)) {
    return res.status(400).json({
      error:
        "Winners can only be registered after the draw has ended and all tickets are sold",
    });
  }

  // if requester is an agent, ensure they are the lottery creator
  if (req.user && req.user.role === "agent") {
    if (
      !lottery.createdBy ||
      String(lottery.createdBy) !== String(req.user.id)
    ) {
      return res
        .status(403)
        .json({ error: "Only the lottery creator can register winners" });
    }
  }

  // limit winners to number of prizes
  const max = Array.isArray(lottery.prizes) ? lottery.prizes.length : 0;
  const prizes = Array.isArray(lottery.prizes) ? lottery.prizes : [];
  const toRegister = winners.slice(0, max).map((w: any, idx: number) => ({
    name: w.name,
    phone: w.phone,
    registeredAt: new Date(),
    winnerRank: (prizes[idx] && prizes[idx].rank) || idx + 1,
  }));

  // store winners in Winner collection (one document per lottery)
  const existing = await Winner.findOne({ lotteryId });
  if (existing) {
    existing.winners = toRegister;
    existing.createdBy = req.user!.id as any;
    await existing.save();
    return res.json(existing.winners);
  }
  const created = await Winner.create({
    lotteryId,
    winners: toRegister,
    createdBy: req.user!.id,
  });
  res.json(created.winners);
}
