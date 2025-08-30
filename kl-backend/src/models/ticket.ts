import mongoose, { Schema, Document } from "mongoose";

export interface ITicket extends Document {
  lotteryId?: mongoose.Types.ObjectId;
  ticketNumber?: number;
  uniqueTicketCode?: string;
  customer?: mongoose.Types.ObjectId;
  soldBy?: mongoose.Types.ObjectId;
  soldAt?: Date;
  status?: "sold" | "winner" | "lost";
  winnerRank?: number;
  smsSent?: boolean;
  winnerSmsSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema: Schema<ITicket> = new Schema(
  {
    lotteryId: { type: mongoose.Schema.Types.ObjectId, ref: "Lottery" },
    ticketNumber: Number,
    uniqueTicketCode: { type: String, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    soldBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    soldAt: Date,
    status: { type: String, enum: ["sold", "winner", "lost"], default: "sold" },
    winnerRank: Number,
    smsSent: { type: Boolean, default: false },
    winnerSmsSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Ticket = mongoose.model<ITicket>("Ticket", TicketSchema, "Ticket");
export default Ticket;
