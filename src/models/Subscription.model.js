import mongoose from "mongoose";
const { Schema } = mongoose;

const PauseHistorySchema = new Schema(
  {
    from: { type: Date, required: true },
    to: { type: Date },
    reason: { type: String },
    pausedBy: { type: Schema.Types.ObjectId }, // admin or customer
  },
  { _id: false }
);

const PaymentHistorySchema = new Schema(
  {
    paymentId: String,
    amount: Number,
    gateway: { type: String, enum: ["razorpay", "stripe", "cash"] },
    status: { type: String, enum: ["success", "failed"] },
    paidAt: Date,
  },
  { _id: false }
);

const SubscriptionSchema = new Schema(
  {
    /* -------- Identity -------- */
    customerId: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
      index: true,
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
      index: true,
    },

    /* -------- Bundle Snapshot -------- */
    bundleId: {
      type: Schema.Types.ObjectId,
      ref: "Bundle",
      required: true,
    },
    bundleName: {
      type: String,
      required: true,
    },
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner"],
      required: true,
    },
    totalMeals: {
      type: Number,
      required: true,
    },

    /* -------- Financials -------- */
    totalPrice: {
      type: Number,
      required: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    paymentMethods: {
      type: String,
      enum: ["razorpay", "stripe", "cash", "upi", "card", "paypal", "wallet"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paymentHistory: [PaymentHistorySchema],

    /* -------- Dates -------- */
    startDate: {
      type: Date,
      required: true,
      index: true,
    },
    endDate: {
      type: Date,
      required: true,
      index: true,
    },

    /* -------- Delivery Tracking -------- */
    mealsConsumed: {
      type: Number,
      default: 0,
    },

    /* -------- Status -------- */
    status: {
      type: String,
      enum: ["pending_approval", "active", "paused", "completed", "cancelled"],
      default: "pending_approval",
      index: true,
    },

    pauseHistory: [PauseHistorySchema],

    approvedAt: Date,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: "Account",
    },

    /* -------- Customer Preferences -------- */
    deliveryInstruction: {
      type: String,
      default: "",
    },
    reminderBeforeEndDays: {
      type: Number,
      default: 2,
    },
    whatsappUpdates: {
      type: Boolean,
      default: true,
    },

    /* -------- Address Snapshot -------- */
    deliveryId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    deliveryAddress: {
      label: String,
      street1: String,
      street2: String,
      city: String,
      state: String,
      country: String,
      pinCode: String,

      latitude: Number,
      longitude: Number,

      deliveryNotes: String,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Subscription", SubscriptionSchema);
