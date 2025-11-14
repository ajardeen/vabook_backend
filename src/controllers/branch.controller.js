import Branch from "../models/Branch.model.js";
import { createBranchSchema } from "../validations/branch.validation.js";


// Create new branch
export const createBranch = async (req, res, next) => {
  try {
    // Validate input
    const { error } = createBranchSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const {
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
      status
    } = req.body;

    // Prevent duplicate branch name inside organization
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

    // Create
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


// Get all branches (optional: filter by org)
export const getBranches = async (req, res, next) => {
  try {
    const { organizationId } = req.query;

    const query = organizationId ? { organizationId } : {};

    const branches = await Branch.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: branches.length,
      data: branches,
    });
  } catch (error) {
    next(error);
  }
};


// Get branch by ID
export const getBranchById = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    res.json({ success: true, data: branch });
  } catch (error) {
    next(error);
  }
};


// Update branch
export const updateBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
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


// Delete branch
export const deleteBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
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
