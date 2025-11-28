import mongoose from "mongoose";
const { Schema } = mongoose;

const PaymentSchema = new Schema(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },

    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    // Payment details
    transactionId: { type: String, index: true },
    amount: { type: Number, required: true },
    method: {
      type: String,
      enum: ["razorpay", "stripe", "cash", "upi", "card", "paypal", "wallet", "manual"],
      default: "cash",
    },
    status: {
      type: String,
      enum: ["initiated", "paid", "failed", "refunded"],
      default: "paid",
    },
    currency: { type: String, default: "INR" },
    paidAt: { type: Date, default: Date.now },

    // Optional refund fields
    refundAmount: { type: Number, default: 0 },
    refundReason: { type: String, default: "" },

    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", PaymentSchema);
