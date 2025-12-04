import mongoose from "mongoose";
const { Schema } = mongoose;

const StatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "placed",
        "processing",
        "ready",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: false }
);

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
        itemName: String,
      },
    ],
  },
  { _id: false }
);

// 🚚 Delivery-related sub-schema
const DeliveryStatusHistorySchema = new Schema(
  {
    status: {
      type: String,
      enum: [
        "pending",           // default
        "ready_for_pickup",  // kitchen ready, waiting rider
        "assigned",          // rider assigned
        "picked_up",         // rider picked from branch
        "en_route",          // on the way
        "arriving",          // near destination (optional)
        "delivered",         // completed
        "failed",            // could not deliver
        "returned",          // returned to store
      ],
      required: true,
    },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: false }
);

const DeliverySchema = new Schema(
  {
    riderId: { type: Schema.Types.ObjectId, ref: "Rider", default: null },
    riderName: { type: String, default: "" },
    contactNumber: { type: String, default: "" },

    deliveryAddress: { type: String, required: true },
    deliveryLocation: {
      type: {
        lat: { type: Number },
        lng: { type: Number },
      },
      default: null,
    },

    deliveryOtp: { type: String, default: null },
    isOtpVerified: { type: Boolean, default: false },

    expectedDeliveryTime: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },

    // 🔥 New delivery state
    deliveryStatus: {
      type: String,
      enum: [
        "pending",
        "ready_for_pickup",
        "assigned",
        "picked_up",
        "en_route",
        "arriving",
        "delivered",
        "failed",
        "returned",
      ],
      default: "pending",
    },
    deliveryStatusHistory: {
      type: [DeliveryStatusHistorySchema],
      default: [],
    },

    liveTracking: [
      {
        lat: Number,
        lng: Number,
        timestamp: { type: Date, default: Date.now },
      },
    ],
  },
  { _id: false }
);


const OrderSchema = new Schema(
  {
    orderNumber: { type: String, unique: true },

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

    paymentMethod: {
      type: String,
      enum: ["gpay", "upi", "card", "cash_on_delivery"],
      default: "gpay",
    },

    status: {
      type: String,
      enum: [
        "placed",
        "processing",
        "ready",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      default: "placed",
    },

    deliveryStartDate: { type: Date, default: null },

    // 🔥 Delivery Schema added here
    delivery: { type: DeliverySchema, default: {} },

    menusStatus: { type: [MenuStatusSchema], default: [] },
    statusHistory: { type: [StatusHistorySchema], default: [] },
  },
  { timestamps: true }
);

OrderSchema.virtual("orderSteps").get(function () {
  return this.statusHistory.map((entry, index) => ({
    id: index + 1,
    title: entry.status.replace(/_/g, " ").toUpperCase(),
    subtitle: entry.note || "",
    time: entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : "",
    completed: index < this.statusHistory.length - 1,
  }));
});

OrderSchema.set("toJSON", { virtuals: true });
OrderSchema.set("toObject", { virtuals: true });

export default mongoose.model("Order", OrderSchema);
