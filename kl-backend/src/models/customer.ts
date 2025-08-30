import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  phone: string;
  registeredBy?: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: String,
  },
  { timestamps: true }
);

// Add an index to speed up lookups by phone
CustomerSchema.index({ phone: 1 });

const Customer = mongoose.model<ICustomer>(
  "Customer",
  CustomerSchema,
  "Customer"
);
export default Customer;
