import Joi from "joi";

export const createOrderSchema = Joi.object({
  customerId: Joi.string().required(),
  organizationId: Joi.string().required(),
  branchId: Joi.string().required(),
  bundleId: Joi.string().required(),

  orderType: Joi.string().valid("recurring", "fixed").default("recurring"),
  startDate: Joi.date().required(),

  totalPrice: Joi.number().required(),
  currency: Joi.string().default("INR"),

  paymentStatus: Joi.string().valid("pending", "paid", "failed").default("pending"),
});

export const updateCycleStatusSchema = Joi.object({
  status: Joi.string().valid(
    "scheduled",
    "processing",
    "ready",
    "out_for_delivery",
    "delivered",
    "cancelled"
  ).required(),
  note: Joi.string().allow("", null).optional(),
});
