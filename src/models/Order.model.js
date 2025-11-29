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

// Track each menu inside bundle
const MenuStatusSchema = new Schema(
  {
    menuId: { type: Schema.Types.ObjectId, ref: "Menu", required: true },
    menuName: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "cooking", "ready", "completed", "cancelled"],
      default: "pending",
    },
    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
        qty: Number,
        itemName: String
      }
    ]
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

    // Main order level status
    status: {
      type: String,
      enum: ["placed", "processing", "ready", "out_for_delivery", "delivered", "cancelled"],
      default: "placed",
    },

    // 🔥 Menu level kitchen tracking for customer & kitchen
    menusStatus: { type: [MenuStatusSchema], default: [] },

    statusHistory: { type: [StatusHistorySchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model("Order", OrderSchema);
