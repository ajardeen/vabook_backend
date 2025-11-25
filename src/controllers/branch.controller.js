import Branch from "../models/Branch.model.js";
import { createBranchSchema } from "../validations/branch.validation.js";


const getOrgIdFromHeaders = (req, res) => {
  const organizationId = req.headers["x-organization-id"];

  if (!organizationId) {
    res.status(400).json({
      success: false,
      message: "Organization ID is required in headers",
    });
    return { error: true };
  }
  return { organizationId };
};

export const createBranch = async (req, res, next) => {
  try {
    const context = getOrgIdFromHeaders(req, res);
    if (context.error) return;

    const { organizationId } = context;

    const { error } = createBranchSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const {
      branchName,
      branchCode,
      branchType,
      street1,
      street2,
      city,
      state,
      country,
      zipCode,
      contactPhone,
      contactEmail,
      status
    } = req.body;

    const existingBranch = await Branch.findOne({
      organizationId,
      branchName,
    });

    if (existingBranch) {
      return res.status(400).json({
        success: false,
        message: "Branch name already exists in this organization",
      });
    }

    const branch = await Branch.create({
      organizationId,
      branchName,
      branchCode,
      branchType,
      street1,
      street2,
      city,
      state,
      country,
      zipCode,
      contactPhone,
      contactEmail,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};


export const getBranches = async (req, res, next) => {
  try {
    const context = getOrgIdFromHeaders(req, res);
    if (context.error) return;

    const { organizationId } = context;

    const branches = await Branch.find({ organizationId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: branches.length,
      data: branches,
    });
  } catch (error) {
    next(error);
  }
};


export const getBranchById = async (req, res, next) => {
  try {
    const context = getOrgIdFromHeaders(req, res);
    if (context.error) return;

    const { organizationId } = context;

    const branch = await Branch.findOne({
      _id: req.params.id,
      organizationId,
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found or does not belong to this organization",
      });
    }

    res.json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};


export const updateBranch = async (req, res, next) => {
  try {
    const context = getOrgIdFromHeaders(req, res);
    if (context.error) return;

    const { organizationId } = context;

    const branch = await Branch.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found or does not belong to this organization",
      });
    }

    res.json({
      success: true,
      message: "Branch updated successfully",
      data: branch,
    });
  } catch (error) {
    next(error);
  }
};


export const deleteBranch = async (req, res, next) => {
  try {
    const context = getOrgIdFromHeaders(req, res);
    if (context.error) return;

    const { organizationId } = context;

    const branch = await Branch.findOneAndDelete({
      _id: req.params.id,
      organizationId,
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found or does not belong to this organization",
      });
    }

    res.json({
      success: true,
      message: "Branch deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};