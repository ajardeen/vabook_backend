import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const { Schema } = mongoose;

const StaffAccountSchema = new Schema(
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
    email: { type: String, required: true, unique: true, trim: true },
    phone: { type: String, unique: true, sparse: true },
    password: { type: String, required: true },
    position: { type: String, trim: true },
    department: { type: String, trim: true },
    role: {
      type: String,
      enum: ["staff", "chef", "rider"],
      default: "staff",
    },
    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
  },
  { timestamps: true }
);
// ✔ HASH PASSWORD BEFORE SAVE (Correct position)
StaffAccountSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

export default mongoose.model("StaffAccount", StaffAccountSchema);
