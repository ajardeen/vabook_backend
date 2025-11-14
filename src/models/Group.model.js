import mongoose from "mongoose";
const { Schema } = mongoose;

const GroupSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  name: { type: String, required: true, trim: true },
  code: { type: String, trim: true },
  type: { type: String, enum: ["restaurant", "store", "cloud-kitchen", "other"], default: "restaurant" },
  address: { type: String, default: "" },
  contactPhone: { type: String, default: "" },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  metadata: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

GroupSchema.index({ organizationId: 1, name: 1 }, { unique: true });

export default mongoose.model("Group", GroupSchema);
