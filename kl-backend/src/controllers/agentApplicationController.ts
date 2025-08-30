import { Request, Response } from "express";
import { AgentApplication } from "../models/agentApplication";

export async function submitApplication(req: Request, res: Response) {
  const body = req.body || {};
  const data = {
    fullName: body.fullName || body.full_name || body.name,
    phone: body.phone,
    address: body.address,
    meta: {
      // preserve any small extras but do not store full form
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    },
  };
  if (!data.fullName || !data.phone || !data.address)
    return res
      .status(400)
      .json({ error: "fullName, phone and address are required" });
  const app = await AgentApplication.create({ data, status: "pending" });
  res.status(201).json({ id: app._id, createdAt: app.createdAt });
}

export async function listApplications(req: Request, res: Response) {
  const list = await AgentApplication.find().sort({ createdAt: -1 });
  res.json(
    list.map((l: any) => ({
      id: l._id,
      data: l.data,
      status: l.status,
      createdAt: l.createdAt,
    }))
  );
}

export async function reviewApplication(req: Request, res: Response) {
  const { id } = req.params;
  const { action } = req.body; // 'approve' | 'reject'
  if (!id) return res.status(400).json({ error: "Missing id" });
  if (!["approve", "reject"].includes(action))
    return res.status(400).json({ error: "Invalid action" });
  const app = await AgentApplication.findById(id);
  if (!app) return res.status(404).json({ error: "Not found" });
  if (action === "approve") app.status = "approved";
  else app.status = "rejected";
  await app.save();
  return res.json({ ok: true, id: app._id, status: app.status });
}
