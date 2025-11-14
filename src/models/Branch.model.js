import mongoose from "mongoose";
const { Schema } = mongoose;

const BranchSchema = new Schema(
  {
    organizationId: { 
      type: Schema.Types.ObjectId, 
      ref: "Organization", 
      required: true, 
      index: true 
    },

    // Basic Branch Info
    branchName: { 
      type: String, 
      required: true, 
      trim: true 
    },

    branchCode: { 
      type: String, 
      trim: true 
    },

    // For online vs physical stores
    branchType: { 
      type: String, 
      enum: ["virtual", "physical"], 
      default: "virtual" 
    },

    // Full Address – useful for delivery & future outlets
    street1: { type: String, default: "" },
    street2: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    country: { type: String, default: "" },
    zipCode: { type: String, default: "" },

    // Contact details
    contactPhone: { type: String, default: "" },
    contactEmail: { type: String, trim: true },

    // Status
    status: { 
      type: String, 
      enum: ["active", "inactive"], 
      default: "active" 
    },

    metadata: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

// Unique per organization
BranchSchema.index(
  { organizationId: 1, branchName: 1 }, 
  { unique: true }
);

export default mongoose.model("Branch", BranchSchema);
