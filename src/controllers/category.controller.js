import Category from "../models/Category.model.js";
import { createCategorySchema } from "../validations/category.validation.js";

const getIdsFromHeaders = (req, res) => {
  const organizationId = req.headers["x-organization-id"];
  const branchId = req.headers["x-branch-id"];

  if (!organizationId || !branchId) {
    res.status(400).json({
      success: false,
      message: "Organization ID and Branch ID are required in headers",
    });
    return { error: true };
  }
  return { organizationId, branchId };
};

// Create Category
export const createCategory = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const { error } = createCategorySchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const {
      name,
      description,
      sortOrder,
      status,
    } = req.body;

    // Check duplicate (same org + branch + name)
    const existing = await Category.findOne({
      organizationId,
      branchId,
      name,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists in this branch",
      });
    }

    const category = await Category.create({
      organizationId,
      branchId,
      name,
      description,
      sortOrder,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

// Get all categories (filtered by organization/branch from headers)
export const getCategories = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;
    const { status } = req.query; // Status remains an optional query filter

    const query = {
      organizationId,
      branchId,
    };
    if (status) query.status = status;

    const categories = await Category.find(query).sort({ sortOrder: 1, name: 1 });

    res.json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};

// Get single category (must belong to the organization/branch in headers)
export const getCategoryById = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const category = await Category.findOne({
      _id: req.params.id,
      organizationId,
      branchId,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found or does not belong to this branch",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

// Update category (must belong to the organization/branch in headers)
export const updateCategory = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    // Use findOneAndUpdate with context for security
    const category = await Category.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId,
        branchId,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found or does not belong to this branch",
      });
    }

    res.json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (err) {
    next(err);
  }
};

// Delete category (must belong to the organization/branch in headers)
export const deleteCategory = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    // Use findOneAndDelete with context for security
    const category = await Category.findOneAndDelete({
      _id: req.params.id,
      organizationId,
      branchId,
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found or does not belong to this branch",
      });
    }

    res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};