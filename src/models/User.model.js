import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema(
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
      required: false,
      index: true,
    },

    email: { type: String, required: true, trim: true },
    password: { type: String, required: true },

    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },

    roles: [
      {
        type: String,
        enum: ["org_admin", "branch_admin", "manager", "staff",],
        default: "staff",
      },
    ],

    isSuperAdmin: { type: Boolean, default: false },

    status: {
      type: String,
      enum: ["active", "inactive", "suspended"],
      default: "active",
    },

    meta: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

UserSchema.index(
  { organizationId: 1, email: 1 },
  { unique: true, partialFilterExpression: { email: { $exists: true } } }
);

export default mongoose.model("User", UserSchema);
