import Joi from "joi";

export const updateKitchenStatusSchema = Joi.object({
  status: Joi.string().valid(
    "pending",
    "cooking",
    "ready",
    "completed",
    "cancelled"
  ).required(),
  notes: Joi.string().allow("", null).optional()
});
