import Joi from "joi";

export const registerCustomerSchema = Joi.object({
  fullName: Joi.string().min(2).required(),
  phone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("customer").default("customer"),
});

export const loginCustomerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  role: Joi.string().valid("customer").default("customer"),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});
