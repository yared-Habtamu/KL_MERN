import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  lotteryId: { type: mongoose.Schema.Types.ObjectId, ref: "Lottery" },
  ticketNumber: Number,
  uniqueTicketCode: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
  soldBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  soldAt: Date,
  status: { type: String, enum: ["sold", "winner", "lost"], default: "sold" },
  winnerRank: Number,
  smsSent: { type: Boolean, default: false },
  winnerSmsSent: { type: Boolean, default: false},
}, { timestamps: true });

const Ticket = mongoose.model("Ticket", ticketSchema, "Ticket");
export default Ticket;
