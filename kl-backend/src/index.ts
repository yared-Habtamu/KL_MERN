import express, { Request, Response } from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";
import "express-async-errors";
import authRoutes from "./routes/auth";
import lotteryRoutes from "./routes/lotteries";
import ticketRoutes from "./routes/tickets";
import walletRoutes from "./routes/wallet";
import debugRoutes from "./routes/debug";
import usersRoutes from "./routes/users";
import agentApplicationsRoutes from "./routes/agentApplications";
import integrationsRoutes from "./routes/integrations";
import { requireAuth, AuthedRequest } from "./middleware/auth";
import errorHandler from "./middleware/errorHandler";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ensure uploads directory exists and serve it
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (e) {}
}
app.use("/uploads", express.static(uploadsDir));

const MONGO = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/kl_db";
const PORT = process.env.PORT || 4000;

app.use("/api/auth", authRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/lotteries", lotteryRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/debug", debugRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/agent-applications", agentApplicationsRoutes);
app.use("/api/integrations", integrationsRoutes);
app.get("/api/health", (req: Request, res: Response) => res.json({ ok: true }));

app.get(
  "/api/user/profile",
  requireAuth,
  async (req: AuthedRequest, res: Response) => {
    // richer profile handler: pull user data from DB
    const userId = req.user?.id;
    // lazy require to avoid top-level circular imports during startup ordering
    const mod = await import("./models/user");
    const User = mod.default;
    const u = await User.findById(userId).select("_id phone name role balance");
    if (!u) return res.status(404).json({ error: "User not found" });
    res.json({
      id: u._id,
      phone: u.phone,
      name: u.name,
      role: u.role,
      balance: u.balance,
    });
  }
);

async function start() {
  await mongoose.connect(MONGO);
  console.log("Connected to MongoDB");

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

// global error handler
app.use(errorHandler);
