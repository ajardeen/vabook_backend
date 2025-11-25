import mongoose from "mongoose";
const { Schema } = mongoose;

const OrganizationSchema = new Schema(
  {
    accountId: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, trim: true, index: true },
    branchIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Branch",
      },
    ],
    // New fields
    industry: { type: String, default: "" },
    country: { type: String, default: "" },
    state: { type: String, default: "" },
    city: { type: String, default: "" },
    street1: { type: String, default: "" },
    street2: { type: String, default: "" },
    zipCode: { type: String, default: "" },
    currency: { type: String, default: "INR" },
    language: { type: String, default: "English" },
    timeZone: { type: String, default: "Asia/Kolkata" },
    gstNumber: { type: String, default: "" },

    // Your existing fields
    contactEmail: { type: String, trim: true, unique: true },
    contactPhone: { type: String, trim: true, unique: true },
    description: { type: String, default: "" },
    address: { type: String, default: "" },
    status: { type: String, enum: ["active", "inactive"], default: "active" },

    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);


OrganizationSchema.index({ name: 1 }, { unique: false });

export default mongoose.model("Organization", OrganizationSchema);
