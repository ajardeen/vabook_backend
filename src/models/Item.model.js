import mongoose from "mongoose";
const { Schema } = mongoose;

const ItemSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  groupId: { type: Schema.Types.ObjectId, ref: "Group", required: false, index: true }, // if item is group-specific
  categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: false, index: true },

  sku: { type: String, trim: true, index: true },     // optional SKU / itemCode
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },

  uom: { type: String, default: "unit" }, // unit of measure
  prepTimeMinutes: { type: Number, default: 0 },

  price: { type: Number, default: 0 },
  onlinePrice: { type: Number, default: 0 },
  parcelPrice: { type: Number, default: 0 },
  deliveryPrice: { type: Number, default: 0 },

  tags: [{ type: String }],
  images: [{ type: String }], // URLs
  isVegetarian: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },

  metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

ItemSchema.index({ organizationId: 1, name: "text", sku: 1 });
ItemSchema.index({ organizationId: 1, sku: 1 }, { unique: false, sparse: true });

export default mongoose.model("Item", ItemSchema);
