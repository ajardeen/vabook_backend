import mongoose from "mongoose";
const { Schema } = mongoose;

const CategorySchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  groupId: { type: Schema.Types.ObjectId, ref: "Group", required: false, index: true }, // optional if category is org-wide
  name: { type: String, required: true, trim: true },
  description: { type: String, default: "" },
  sortOrder: { type: Number, default: 0 },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
}, { timestamps: true });

CategorySchema.index({ organizationId: 1, name: 1 }, { unique: false });

export default mongoose.model("Category", CategorySchema);
