import mongoose from "mongoose";
const { Schema } = mongoose;

/**
 Bundle:
  - name, description
  - durationDays (e.g., 7)
  - price
  - menus: array of { dayIndex, menuId }
*/
const BundleMenuRefSchema = new Schema({
  dayIndex: { type: Number, required: true }, // 0 .. n-1
  menuId: { type: Schema.Types.ObjectId, ref: "Menu", required: true }
}, { _id: false });

const BundleSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  groupId: { type: Schema.Types.ObjectId, ref: "Group", required: false, index: true },

  name: { type: String, required: true, trim: true },
  slug: { type: String, trim: true },
  description: { type: String, default: "" },

  durationDays: { type: Number, default: 7 },
  basePrice: { type: Number, default: 0 },      // price customer sees
  currency: { type: String, default: "INR" },

  menus: { type: [BundleMenuRefSchema], default: [] },

  isPublished: { type: Boolean, default: false },
  status: { type: String, enum: ["active","inactive"], default: "active" },

  metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

BundleSchema.index({ organizationId: 1, name: 1 });

export default mongoose.model("Bundle", BundleSchema);
