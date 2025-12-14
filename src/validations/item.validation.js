import Joi from "joi";

// Schema for a single pricing tier object
const PricingTierSchema = Joi.object({
  type: Joi.string()
    .valid("base", "online", "parcel", "delivery", "premium") // Ensure only defined types are used
    .required()
    .messages({
      "any.required": "Pricing tier type is required.",
      "any.only": "Invalid pricing tier type provided.",
    }),
  value: Joi.number()
    .min(0)
    .required()
    .messages({
      "number.base": "Price value must be a number.",
      "number.min": "Price value cannot be negative.",
      "any.required": "Price value is required.",
    }),
}).required(); 

export const createItemSchema = Joi.object({
  categoryId: Joi.string().required(),
  sku: Joi.string().allow("", null).optional(),

  name: Joi.string().min(2).max(150).required(),
  description: Joi.string().allow("", null).optional(),

  uom: Joi.string().default("unit").optional(),
  prepTimeMinutes: Joi.number().min(0).default(0).optional(),

  pricing: Joi.array().items(PricingTierSchema).default([]).optional(),

  image: Joi.string().allow("", null).optional().default(""), 

  isVegetarian: Joi.boolean().default(false).optional(),
  isActive: Joi.boolean().default(true).optional(),
  
  nutrition: Joi.object({
    calories: Joi.number().min(0).default(0),
    protein: Joi.number().min(0).default(0),
    carbs: Joi.number().min(0).default(0),
    fat: Joi.number().min(0).default(0),
  }).optional(),
  
 

});