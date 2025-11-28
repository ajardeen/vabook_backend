import mongoose from "mongoose";
const { Schema } = mongoose;

const StatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: ["placed", "processing", "ready", "out_for_delivery", "delivered", "cancelled"],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: "" }
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, unique: true },

    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },

    bundleId: { type: Schema.Types.ObjectId, ref: "Bundle", required: true },
    bundleName: { type: String, required: true },

    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    totalPrice: { type: Number, required: true },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    status: {
      type: String,
      enum: ["placed", "processing", "ready", "out_for_delivery", "delivered", "cancelled"],
      default: "placed",
    },

    statusHistory: { type: [StatusHistorySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
