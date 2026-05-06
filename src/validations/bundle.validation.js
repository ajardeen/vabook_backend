import Joi from "joi";

export const createBundleSchema = Joi.object({
  name: Joi.string().min(3).max(150).required(),
  description: Joi.string().min(3).max(500).optional(),
  bundleMealType: Joi.string()
    .valid("breakfast", "lunch", "dinner", "snacks", "all_day")
    .required(),
  price: Joi.number().min(0).required(),
  img:Joi.string().allow("", null).optional(),

  totalMealsCount: Joi.number().min(1).max(365).required(),

  schedule: Joi.array()
    .items(
      Joi.object({
        dayIndex: Joi.number().min(0).required(),
        menuId: Joi.string().required(),
      })
    )
    .min(1)
    .required(),

  // ✅ default false
  isPublished: Joi.boolean().default(false),
});

export const updateBundleSchema = Joi.object({
  name: Joi.string().min(3).max(150).optional(),
  description: Joi.string().min(3).max(500).optional(),

  price: Joi.number().min(0).optional(),
  durationDays: Joi.number().min(1).max(365).optional(),

  schedule: Joi.array()
    .items(
      Joi.object({
        dayIndex: Joi.number().min(0).required(),
        menuId: Joi.string().required(),
      })
    )
    .optional(),

  isPublished: Joi.boolean().optional(),
});
