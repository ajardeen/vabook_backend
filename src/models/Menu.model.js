import mongoose from "mongoose";
const { Schema } = mongoose;

// Snapshot of item details to preserve history if main Item changes
const MenuItemSubSchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    name: { type: String,  required: true },
    qty: { type: Number, default: 1 },
  },
  { _id: false }
);

const MenuSchema = new Schema(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    branchId: { type: Schema.Types.ObjectId, ref: "Branch", required: true },

    name: { type: String, required: true }, // e.g., "Monday Standard Non-Veg"
    description: String,
    // 🔥 NEW FIELD: Defines what meal this menu is for
    mealType: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snacks", "all_day"],
      required: true,
      default: "lunch",
    },
    // This helps Admin organize, but the Bundle decides when it is actually served
    suggestedDay: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
        "Any",
      ],
    },

    items: [MenuItemSubSchema],

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Menu", MenuSchema);
