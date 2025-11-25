import mongoose from "mongoose";
const { Schema } = mongoose;

// --- Reference for menus inside a bundle ---
const BundleMenuRefSchema = new Schema(
  {
    dayIndex: { type: Number, required: true },
    menuId: { type: Schema.Types.ObjectId, ref: "Menu", required: true },
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

    durationDays: { type: Number, default: 7 },
    basePrice: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },

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

// --- Validation: ensure unique itemIds and positive maxQty ---


BundleSchema.index({ organizationId: 1, branchId: 1, name: 1 });

export default mongoose.model("Bundle", BundleSchema);
