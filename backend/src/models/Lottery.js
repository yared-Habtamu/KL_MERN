import mongoose from "mongoose";

const lotterySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  ticketCount: Number,
  ticketsSold: { type: Number, default: 0 },
  ticketPrice: { type: Number, required: true },
  commissionPerTicket: { type: Number, default: 0 },
  winningTicketNumber: [Number],
  status: { type: String, enum: ["pending","active", "ended"], default: "pending" },
  type: { type: String, enum: ["company", "agent"], required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  tiktokStreamLink: String,
  endedAt: { type: Date },
  prizes: [
    {
      rank: { type: Number, required: true },
      title: { type: String, required: true },
      imageUrl: { type: String }
    }
  ],
}, { timestamps: true });

const Lottery = mongoose.model("Lottery", lotterySchema, "Lottery");
export default Lottery;
