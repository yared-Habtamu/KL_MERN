import mongoose from "mongoose"

const ActivityLogSchema = new mongoose.Schema({
    action: String, // e.g., "Sold ticket", "Sent SMS"
    details: String, // additional context
    severity: {
      type: String,
      enum: ["success", "info", "warning"],
      default: "info",
    },
  }, { timestamps: true });

const ActivityLog = mongoose.model("RecentActivity", ActivityLogSchema, "RecentActivity");
export default ActivityLog;