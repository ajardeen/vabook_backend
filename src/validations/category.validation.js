import Joi from "joi";

export const createCategorySchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  description: Joi.string().allow("", null).optional(),

  sortOrder: Joi.number().integer().min(0).optional(),
  status: Joi.string().valid("active", "inactive").default("active"),
});