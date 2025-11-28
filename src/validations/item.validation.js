import Joi from "joi";

export const createItemSchema = Joi.object({
  categoryId: Joi.string().required(),
  sku: Joi.string().allow("", null),

  name: Joi.string().min(2).max(150).required(),
  description: Joi.string().allow("", null),

  uom: Joi.string().default("unit"),
  prepTimeMinutes: Joi.number().min(0).default(0),

  price: Joi.number().min(0).default(0),
  onlinePrice: Joi.number().min(0).default(0),
  parcelPrice: Joi.number().min(0).default(0),
  deliveryPrice: Joi.number().min(0).default(0),

  tags: Joi.array().items(Joi.string()),
  images: Joi.string().allow("", null).optional().default(""),


  isVegetarian: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),

  nutrition: Joi.object({
    calories: Joi.number().min(0).default(0),
    protein: Joi.number().min(0).default(0),
    carbs: Joi.number().min(0).default(0),
    fat: Joi.number().min(0).default(0),
  }).optional(),
});
