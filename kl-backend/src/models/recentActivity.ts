import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  action?: string;
  details?: string;
  severity?: "success" | "info" | "warning";
  createdAt: Date;
  updatedAt: Date;
}

const ActivityLogSchema: Schema = new mongoose.Schema(
  {
    action: String,
    details: String,
    severity: {
      type: String,
      enum: ["success", "info", "warning"],
      default: "info",
    },
  },
  { timestamps: true }
);

const ActivityLog = mongoose.model<IActivityLog>(
  "RecentActivity",
  ActivityLogSchema,
  "RecentActivity"
);
export default ActivityLog;
