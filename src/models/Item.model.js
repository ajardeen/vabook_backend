import mongoose from "mongoose";
const { Schema } = mongoose;

const ItemSchema = new Schema(
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

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    categoryName: { type: String, required: true, trim: true },

    sku: { type: String, trim: true, index: true,unique: true},
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    uom: { type: String, default: "unit" },
    prepTimeMinutes: { type: Number, default: 0,required:true },

    price: { type: Number, default: 0 },
    onlinePrice: { type: Number, default: 0 },
    parcelPrice: { type: Number, default: 0 },
    deliveryPrice: { type: Number, default: 0 },

    tags: [{ type: String }],
    images: { type: String, default: "" },

    isVegetarian: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },

    nutrition: {
      calories: { type: Number, default: 0 },
      protein: { type: Number, default: 0 },
      carbs: { type: Number, default: 0 },
      fat: { type: Number, default: 0 },
    },

    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

// Search indexes
ItemSchema.index({ organizationId: 1, branchId: 1, name: "text" });
ItemSchema.index({ branchId: 1, sku: 1 }, { unique: false, sparse: true });

export default mongoose.model("Item", ItemSchema);
