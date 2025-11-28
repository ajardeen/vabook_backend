import mongoose from "mongoose";
const { Schema } = mongoose;

// --- Reference for menus inside a bundle ---
const BundleMenuRefSchema = new Schema(
  {
    dayIndex: { type: Number, required: true },
    menuId: { type: Schema.Types.ObjectId, ref: "Menu", required: true },
    items: [
      {
        itemId: { type: Schema.Types.ObjectId, ref: "Item", required: true },
        qty: { type: Number, required: true, default: 1 },
      }
    ]
  },
  { _id: false }
);


// --- Bundle main schema ---
const BundleSchema = new Schema(
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
    slug: { type: String, trim: true },
    description: { type: String, default: "" },
    repeatWeeks: { type: Number, default: 0 },
    durationDays: { type: Number, default: 7 },
    basePrice: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    discount: { type: Number, default: 0 },
    discountType: {
      type: String,
      enum: ["fixed", "percentage", "free", "none"],
      default: "none",
    },
    discountDuration: {
      type: String,
      enum: ["day", "week", "month", "year", "none"],
      default: "none",
    },
    bundleImage: { type: String, default: "" },
    bundleCategory: {
      type: String,
      enum: ["breakfast", "lunch", "dinner", "snacks"],
      default: "lunch",
      required: true,
    },

    bundleType: {
      type: String,
      enum: ["weekly", "fixed"],
      default: "weekly",
      required: true,
    },

    menus: { type: [BundleMenuRefSchema], default: [] },

    isPublished: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },

    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

BundleSchema.index({ organizationId: 1, branchId: 1, name: 1 });

export default mongoose.model("Bundle", BundleSchema);
