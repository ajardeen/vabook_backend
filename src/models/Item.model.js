import mongoose from "mongoose";
const { Schema } = mongoose;

// Defines a reusable pricing structure
const PricingTierSchema = new Schema({
    type: { 
        type: String, 
        enum: ["base", "online", "parcel", "delivery", "premium"], 
        required: true 
    },
    value: { type: Number, required: true, default: 0 },
    // You could add region-specific pricing here if needed
}, { _id: false });


const ItemSchema = new Schema(
    {
        // --- Identity & Scope ---
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

        // --- Categorization (Reference Only) ---
        categoryId: { // Always reference the Category document
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
            index: true,
        },
        // **REMOVED categoryName**: Avoid redundancy; rely on population of Category.

        // --- Core Details ---
        sku: { type: String, trim: true, index: true, unique: true },
        name: { type: String, required: true, trim: true },
        description: { type: String, default: "" },

        // --- Inventory & Preparation ---
        uom: { type: String, default: "unit" },
        // Simplified validation, default handles the case where it's 0
        prepTimeMinutes: { type: Number, default: 0 }, 
        
        // --- Consolidated Pricing (Flexible) ---
        // 'price' can be calculated dynamically based on the 'base' tier
        pricing: { type: [PricingTierSchema], default: [] }, 

        // --- Media & Flags ---
        image: { type: String, default: "" }, // Single main image URL
        isVegetarian: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },

        // --- Nutritional Data (Grouped) ---
        nutrition: {
            calories: { type: Number, default: 0 },
            protein: { type: Number, default: 0 },
            carbs: { type: Number, default: 0 },
            fat: { type: Number, default: 0 },
        },

        // --- Extensibility ---
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

// Search indexes remain robust
ItemSchema.index({ organizationId: 1, branchId: 1, name: "text" });
ItemSchema.index({ branchId: 1, sku: 1 }, { unique: false, sparse: true });

export default mongoose.model("Item", ItemSchema);