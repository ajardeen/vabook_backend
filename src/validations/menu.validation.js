import Joi from "joi";

export const createMenuSchema = Joi.object({


  name: Joi.string().min(2).max(150).required(),
  description: Joi.string().allow("", null).optional(),

  dayOfWeek: Joi.string().valid(
    "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday", "Sunday", ""
  ).optional(),

  dayIndex: Joi.number().min(0).allow(null).optional(),

  items: Joi.array().items(
    Joi.object({
      itemId: Joi.string().required(),
      itemName: Joi.string().required(),
      itemPrice: Joi.number().min(0).required(),
      qty: Joi.number().min(1).default(1),
      notes: Joi.string().allow("", null),
      priceOverride: Joi.number().allow(null),
    })
  ).default([]),

  availableFrom: Joi.date().optional(),
  availableTo: Joi.date().optional(),

  status: Joi.string().valid("active", "inactive").default("active"),
});
