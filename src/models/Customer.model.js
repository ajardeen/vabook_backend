import mongoose from "mongoose";
const { Schema } = mongoose;

// Sub-schema for detailed address
const AddressSchema = new Schema(
  {
    label: { type: String, required: true, trim: true }, // e.g., "Home", "Work", "Friend's House"
    street1: { type: String, required: true, trim: true },
    street2: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    pinCode: { type: String, required: true, trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    deliveryNotes: { type: String, default: "" },
    isDefault: { type: Boolean, default: false }, // To mark a default address
  },
  { _id: true }, // Mongoose automatically adds _id to subdocuments by default, but explicitly stating it for clarity
);

// Ensure only one address can be default per customer (if needed, can be enforced at application level or with a custom validator)
// For now, it's a simple boolean.
// AddressSchema.index({ customerId: 1, isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } });

const CustomerSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },

    password: { type: String, required: true },

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
    deliveryAddress: { type: [AddressSchema], default: [] },

    otpCode: { type: String }, // used for verify otp
    otpExpireAt: { type: Date },

    status: {
      type: String,
      enum: ["active", "blocked"],
      default: "active",
    },
  },
  { timestamps: true },
);

CustomerSchema.index({ email: 1, organizationId: 1 }, { unique: true });

export default mongoose.model("Customer", CustomerSchema);
