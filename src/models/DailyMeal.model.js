import mongoose from "mongoose";
const { Schema } = mongoose;

// Track history of status changes (e.g., "Kitchen started at 10:00 AM")
const StatusLogSchema = new Schema({
  status: { type: String, required: true },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: Schema.Types.ObjectId } // User ID of Chef or Rider
}, { _id: false });

const DailyMealSchema = new Schema({
  // Link to Parents
  subscriptionId: { type: Schema.Types.ObjectId, ref: "Subscription", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true, index: true },

  // The "When"
  date: { type: Date, required: true, index: true }, // 2025-10-01 (Midnight UTC)
  dayIndex: { type: Number, required: true }, // 0, 1, 2...

  // The "What" (Snapshot from Menu)
  menuId: { type: Schema.Types.ObjectId, ref: "Menu" },
  menuName: { type: String }, 
  items: [{
    itemId: { type: Schema.Types.ObjectId, ref: "Item" },
    name: String,
    qty: Number
  }],

  chefId:{ type: Schema.Types.ObjectId, ref: "StaffAccount", default: null, index: true },
  // 1. Kitchen Lifecycle
  kitchenStatus: {
    type: String,
    enum: ["scheduled", "preparing", "ready","completed", "cancelled"],
    default: "scheduled"
  },
  // 2. Delivery Lifecycle
  deliveryStatus: {
    type: String,
    enum: [
      "pending",          // Waiting for kitchen
      "ready_for_pickup", // Kitchen done, broadcasting to riders
      "assigned",         // Rider accepted
      "picked_up",        // Rider has food
      "en_route",         // On the way
      "delivered",        // Done
      "failed"
    ],
    default: "pending"
  },
  
  // Rider Details
  riderId: { type: Schema.Types.ObjectId, ref: "StaffAccount", default: null, index: true },
  deliveryOtp: { type: String }, // Generated when status becomes 'out_for_delivery'
  
  // Location for this specific day
  deliveryId:{
    type: Schema.Types.ObjectId,
    ref: "Delivery"
  },


  logs: [StatusLogSchema] // Full audit trail
}, { timestamps: true });

// COMPOUND INDEXES (Crucial for Dashboard Speed)

// 1. "Show me what to cook today"
DailyMealSchema.index({ branchId: 1, date: 1, kitchenStatus: 1 });

// 2. "Show me open deliveries for today"
DailyMealSchema.index({ branchId: 1, date: 1, deliveryStatus: 1 });

export default mongoose.model("DailyMeal", DailyMealSchema);