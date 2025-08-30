import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true }, // ensures no duplicate customers
    registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // collector/operator who registered them
    userId: {type: mongoose.Schema.Types.ObjectId, ref: "User"}, // user who registered themselves/client
    notes: String, // any additional info or KYC details
  }, { timestamps: true });

  // Add an index to speed up lookups by phone
CustomerSchema.index({ phone: 1 });

const Customer = mongoose.model("Customer", CustomerSchema, "Customer");
export default Customer;