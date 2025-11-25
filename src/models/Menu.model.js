import mongoose from "mongoose";
const { Schema } = mongoose;

const MenuItemSubSchema = new Schema(
  {
    itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    itemName: { type: String, required: true },
    itemPrice: { type: Number, required: true },
    qty: { type: Number, default: 1 },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const MenuSchema = new Schema(
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
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    dayOfWeek: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
        "",
      ],
      default: "",
    },
    dayIndex: { type: Number, default: null },
    items: { type: [MenuItemSubSchema], default: [] },
    availableFrom: { type: Date },
    availableTo: { type: Date },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

MenuSchema.index({ organizationId: 1, branchId: 1, name: 1 });

export default mongoose.model("Menu", MenuSchema);
