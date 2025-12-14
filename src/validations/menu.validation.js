import Joi from "joi";

export const menuItemSchema = Joi.object({
  itemId: Joi.string().required(),
  name: Joi.string().required(),
  qty: Joi.number().min(1).default(1),
  isVegetarian: Joi.boolean().default(false),
});

export const createMenuSchema = Joi.object({
  name: Joi.string().min(2).max(150).required(),
  description: Joi.string().allow("", null),

  mealType: Joi.string()
    .valid("breakfast", "lunch", "dinner", "snacks", "all_day")
    .required(),

  suggestedDay: Joi.string()
    .valid(
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
      "Any"
    )
    .optional(),

  items: Joi.array().items(menuItemSchema).min(1).required(),

  isActive: Joi.boolean().default(true),
});

export const updateMenuSchema = Joi.object({
  name: Joi.string().min(2).max(150).optional(),
  description: Joi.string().allow("", null).optional(),

  mealType: Joi.string()
    .valid("breakfast", "lunch", "dinner", "snacks", "all_day")
    .optional(),

  suggestedDay: Joi.string()
    .valid(
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
      "Any"
    )
    .optional(),

  items: Joi.array().items(menuItemSchema).min(1).optional(),

  isActive: Joi.boolean().optional(),
});
