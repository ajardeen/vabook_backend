import mongoose from "mongoose";
const { Schema } = mongoose;

const BundleDaySchema = new Schema(
  {
    dayIndex: { type: Number, required: true, min: 0, max: 6 }, // 0 = Monday, 6 = Sunday (Fixed 7-day pattern)
    menuId: { type: Schema.Types.ObjectId, ref: "Menu", required: true },
  },
  { _id: false },
);

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
    img: { type: String }, // Store the unique filename here
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true }, // ✅ NEW FIELD: Replaces the old `filterMealType` logic and goes into the model

    bundleMealType: {
      type: String,
      required: true,
      enum: ["breakfast", "lunch", "dinner", "snacks", "all_day"],
    }, // ✅ NEW FIELD: Total meals (credits) for the subscription

    totalMealsCount: { type: Number, required: true, min: 1 }, // ❌ REMOVED: durationDays is no longer needed since the schedule is fixed (7 days)
    // durationDays:

    schedule: {
      type: [BundleDaySchema],
      required: true,
    },

    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

// Prevent duplicate bundle names per branch
BundleSchema.index(
  { organizationId: 1, branchId: 1, name: 1 },
  { unique: true },
);

export default mongoose.model("Bundle", BundleSchema);
