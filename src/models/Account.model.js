import mongoose from "mongoose";
const { Schema } = mongoose;
import bcrypt from "bcryptjs";

const AccountSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },

    email: { type: String, required: true, unique: true, trim: true },

    phone: { type: String, unique: true, sparse: true },

    password: { type: String, required: true },

    // Account starts with no organization
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },

    role: {
      type: String,
      enum: ["admin", "branch_admin", "manager", "staff"],
      default: "admin",
    },

    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);


// ✔ HASH PASSWORD BEFORE SAVE (Correct position)
AccountSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// ✔ EXPORT AFTER MIDDLEWARE
export default mongoose.model("Account", AccountSchema);
