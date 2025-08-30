import mongoose, { Schema, Document } from "mongoose";

export interface IPrize {
  rank: number;
  title: string;
  description?: string;
  // allow storing either a URL or raw image bytes (as Buffer) with content type
  imageUrl?: string;
  image?: { data: Buffer; contentType?: string } | Buffer;
}

export interface ILottery extends Document {
  title: string;
  description?: string;
  ticketCount?: number;
  ticketsSold?: number;
  ticketPrice: number;
  commissionPerTicket?: number;
  winningTicketNumber?: number[];
  status?: "pending" | "active" | "ended";
  type: "company" | "agent";
  createdBy: mongoose.Types.ObjectId;
  tiktokStreamLink?: string;
  endedAt?: Date;
  createdAt: Date;
  prizes?: IPrize[];
  updatedAt: Date;
}

const LotterySchema: Schema<ILottery> = new Schema(
  {
    title: { type: String, required: true },
    description: String,
    ticketCount: { type: Number },
    ticketsSold: { type: Number, default: 0 },
    ticketPrice: { type: Number, required: true },
    commissionPerTicket: { type: Number, default: 0 },
    winningTicketNumber: [Number],
    status: {
      type: String,
      enum: ["pending", "active", "ended"],
      default: "pending",
    },
    type: { type: String, enum: ["company", "agent"] },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tiktokStreamLink: String,
    endedAt: { type: Date },
    prizes: [
      {
        rank: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String },
        imageUrl: { type: String },
        image: {
          data: Buffer,
          contentType: String,
        },
      },
    ],
  },
  { timestamps: true }
);

const Lottery = mongoose.model<ILottery>("Lottery", LotterySchema, "Lottery");
export default Lottery;
