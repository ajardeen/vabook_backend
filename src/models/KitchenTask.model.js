import mongoose from "mongoose";
const { Schema } = mongoose;

const KitchenTaskSchema = new Schema(
  {
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

    orderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },

    // Display data to kitchen
    customerName: { type: String, required: true },
    bundleName: { type: String, required: true },
    deliveryDate: { type: Date, required: true },
    menuId: { type: Schema.Types.ObjectId, ref: "Menu", required: true },
    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
        qty: { type: Number, required: true },
        itemName: { type: String, required: true },
        prepTimeMinutes: { type: Number, required: true }, // NEW
      },
    ],

    totalPrepTime: { type: Number, default: 0 }, // NEW (sum of all item prep times)

    // Kitchen status flow
    status: {
      type: String,
      enum: ["pending", "cooking", "ready", "completed", "cancelled"],
      default: "pending",
    },

    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("KitchenTask", KitchenTaskSchema);
