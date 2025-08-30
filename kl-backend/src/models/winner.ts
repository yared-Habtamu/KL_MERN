import mongoose, { Schema, Document } from "mongoose";

export interface IRegisteredWinner {
  name: string;
  phone: string;
  registeredAt: Date;
  winnerRank?: number;
}

export interface IWinnerDoc extends Document {
  lotteryId: mongoose.Types.ObjectId;
  winners: IRegisteredWinner[];
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WinnerSchema: Schema<IWinnerDoc> = new Schema(
  {
    lotteryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lottery",
      required: true,
      unique: true,
    },
    winners: [
      {
        name: String,
        phone: String,
        registeredAt: Date,
      },
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

const Winner = mongoose.model<IWinnerDoc>("Winner", WinnerSchema, "Winners");
export default Winner;
