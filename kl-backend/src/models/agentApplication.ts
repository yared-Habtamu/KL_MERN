import mongoose, { Schema, Document } from "mongoose";

export interface IAgentApplication extends Document {
  data: any;
  status?: "pending" | "approved" | "rejected";
  createdAt: Date;
}

const AgentApplicationSchema: Schema<IAgentApplication> = new Schema({
  data: { type: Schema.Types.Mixed, required: true },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

export const AgentApplication = mongoose.model<IAgentApplication>(
  "AgentApplication",
  AgentApplicationSchema
);
