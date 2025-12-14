import mongoose from "mongoose";
const { Schema } = mongoose;

const SubscriptionSchema = new Schema({
  // Who and What
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },
  
  bundleId: { type: Schema.Types.ObjectId, ref: "Bundle", required: true },
  bundleName: { type: String, required: true }, // Snapshot name

  // Financials
  totalPrice: { type: Number, required: true },
  paymentStatus: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  paymentId: { type: String }, // From Stripe/Razorpay

  // Dates
  startDate: { type: Date, required: true }, // e.g., 2025-10-01
  endDate: { type: Date, required: true },   // e.g., 2025-10-07

  // High-level Status
  status: { 
    type: String, 
    enum: ["active", "paused", "completed", "cancelled"], 
    default: "active" 
  },

  // Default Address (copied to DailyMeals, but can be overridden there)
  defaultAddress: {
    text: String,
    coordinates: { lat: Number, lng: Number }
  }
}, { timestamps: true });

export default mongoose.model("Subscription", SubscriptionSchema);