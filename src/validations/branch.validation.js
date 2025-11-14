import Joi from "joi";

export const createBranchSchema = Joi.object({
  organizationId: Joi.string().required(),

  branchName: Joi.string().min(2).max(100).required(),
  branchCode: Joi.string().allow("", null).optional(),

  branchType: Joi.string().valid("virtual", "physical").default("virtual"),

  street1: Joi.string().allow("", null).optional(),
  street2: Joi.string().allow("", null).optional(),
  city: Joi.string().allow("", null).optional(),
  state: Joi.string().allow("", null).optional(),
  country: Joi.string().allow("", null).optional(),
  zipCode: Joi.string().allow("", null).optional(),

  contactPhone: Joi.string().pattern(/^[0-9]{10,15}$/).allow("", null).optional(),
  contactEmail: Joi.string().email().allow("", null).optional(),

  status: Joi.string().valid("active", "inactive").default("active"),
});
