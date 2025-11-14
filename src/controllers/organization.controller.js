import Organization from "../models/Organization.model.js";
import { createOrganizationSchema } from "../validations/organization.validation.js";

export const createOrganization = async (req, res, next) => {
  try {
    // 1. Validate using Joi
    const { error } = createOrganizationSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const {
      name,
      slug,
      description,
      contactEmail,
      contactPhone,
      address,
      industry,
      street1,
      street2,
      city,
      state,
      country,
      zipCode,
      currency,
      language,
      timeZone,
    } = req.body;

    // 2. Prevent duplicate email or phone
    const existingOrg = await Organization.findOne({
      $or: [{ contactEmail }, { contactPhone }],
    });

    if (existingOrg) {
      return res.status(400).json({
        success: false,
        message: "Email or phone already exists for another organization",
      });
    }

    // 3. Create organization
    const org = await Organization.create({
      name,
      slug,
      description,
      contactEmail,
      contactPhone,
      address,

      // new fields
      industry,
      street1,
      street2,
      city,
      state,
      country,
      zipCode,
      currency,
      language,
      timeZone,
    });

    res.status(201).json({
      success: true,
      message: "Organization created successfully",
      data: org,
    });
  } catch (error) {
    next(error);
  }
};


// Get all organizations
export const getOrganizations = async (req, res, next) => {
  try {
    const orgs = await Organization.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: orgs.length,
      data: orgs
    });
  } catch (error) {
    next(error);
  }
};

// Get single organization
export const getOrganizationById = async (req, res, next) => {
  try {
    const org = await Organization.findById(req.params.id);

    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    res.json({ success: true, data: org });
  } catch (error) {
    next(error);
  }
};

// Update organization
export const updateOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    res.json({ success: true, message: "Updated successfully", data: org });
  } catch (error) {
    next(error);
  }
};

// Delete organization
export const deleteOrganization = async (req, res, next) => {
  try {
    const org = await Organization.findByIdAndDelete(req.params.id);

    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found" });
    }

    res.json({ success: true, message: "Organization deleted successfully" });
  } catch (error) {
    next(error);
  }
};
