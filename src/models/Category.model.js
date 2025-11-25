import mongoose from "mongoose";
const { Schema } = mongoose;

const CategorySchema = new Schema(
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
    sortOrder: { type: Number, default: 0 },

    status: { type: String, enum: ["active", "inactive"], default: "active" },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

CategorySchema.index(
  { organizationId: 1, branchId: 1, name: 1 },
  { unique: true }
);

export default mongoose.model("Category", CategorySchema);
