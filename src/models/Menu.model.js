import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 Menu represents the set of items for a particular day or meal.
 items: array of { itemId, qty, notes, priceOverride }
*/
const MenuItemSubSchema = new Schema({
  itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
  qty: { type: Number, default: 1 },
  notes: { type: String, default: "" },
  priceOverride: { type: Number, default: null } // if you want to override item price for this menu
}, { _id: false });

const MenuSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  groupId: { type: Schema.Types.ObjectId, ref: "Group", required: false, index: true },

  name: { type: String, required: true, trim: true }, // e.g., "Monday Menu" or "Breakfast - Day 1"
  description: { type: String, default: "" },

  // semantic day: either weekday name or explicit dayIndex in a bundle
  dayOfWeek: { type: String, enum: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday", ""], default: "" },
  dayIndex: { type: Number, default: null }, // 0..n index used when attaching to bundles

  items: { type: [MenuItemSubSchema], default: [] },

  availableFrom: { type: Date },
  availableTo: { type: Date },

  status: { type: String, enum: ["active","inactive"], default: "active" },

  metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

MenuSchema.index({ organizationId: 1, name: 1 });

export default mongoose.model("Menu", MenuSchema);
