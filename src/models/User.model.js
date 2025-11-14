import mongoose from "mongoose";
const { Schema } = mongoose;

const UserSchema = new Schema({
  organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true, index: true },
  email: { type: String, required: true, unique: false, index: true, trim: true },
  password: { type: String, required: true }, // hashed
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  roles: [{ type: String, enum: ["org_admin", "group_admin", "manager", "staff", "customer"], default: "staff" }],
  isSuperAdmin: { type: Boolean, default: false }, // cross-organization admin, if needed
  status: { type: String, enum: ["active", "inactive", "suspended"], default: "active" },
  meta: { type: Schema.Types.Mixed, default: {} }
}, { timestamps: true });

UserSchema.index({ organizationId: 1, email: 1 }, { unique: true, partialFilterExpression: { email: { $exists: true } } });

export default mongoose.model("User", UserSchema);
