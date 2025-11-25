import Joi from "joi";

export const createBundleSchema = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  slug: Joi.string().allow("", null).optional(),
  description: Joi.string().allow("", null).optional(),

  durationDays: Joi.number().min(1).required(),
  bundleType: Joi.string().valid("weekly", "fixed").default("weekly").required(),

  basePrice: Joi.number().min(0).default(0),
  currency: Joi.string().default("INR"),

  menus: Joi.array()
    .items(
      Joi.object({
        dayIndex: Joi.number().min(0).required(),
        menuId: Joi.string().required(),
        items: Joi.array()
          .items(
            Joi.object({
              itemId: Joi.string().required(),
              qty: Joi.number().min(1).required(),
            })
          )
          .min(1)
          .required(),
      })
    )
    .default([]),

  isPublished: Joi.boolean().default(false),
  status: Joi.string().valid("active", "inactive").default("active"),
});
