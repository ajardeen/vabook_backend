import Joi from "joi";

export const createOrganizationSchema = Joi.object({
  // Add the required accountId validation here
  accountId: Joi.string().required(),
  // Basic details
  name: Joi.string().min(2).max(100).required(),
  slug: Joi.string().allow(null, "").optional(),
  description: Joi.string().allow("", null).optional(),

  // Contact
  contactEmail: Joi.string().email().required(),
  contactPhone: Joi.string().pattern(/^[0-9]{10,15}$/).required(),

  // Address
  street1: Joi.string().allow("", null).optional(),
  street2: Joi.string().allow("", null).optional(),
  city: Joi.string().allow("", null).optional(),
  state: Joi.string().allow("", null).optional(),
  country: Joi.string().allow("", null).optional(),
  zipCode: Joi.string().allow("", null).optional(),
  location: Joi.string().allow("", null).optional(),
  gstNumber: Joi.string().allow("", null).optional(),

  address: Joi.string().allow("", null).optional(),

  // Business details
  industry: Joi.string().allow("", null).optional(),

  // Regional settings
  currency: Joi.string().default("INR"),
  language: Joi.string().default("English"),
  timeZone: Joi.string().default("Asia/Kolkata"),
});
