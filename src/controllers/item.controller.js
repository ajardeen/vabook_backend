import Item from "../models/Item.model.js";
import Category from "../models/Category.model.js"; 
import { createItemSchema } from "../validations/item.validation.js";


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

// Create Item
export const createItem = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    // Validate
    const { error } = createItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const {
      categoryId,
      sku,
      name,
      description,
      uom,
      prepTimeMinutes,
      price,
      onlinePrice,
      parcelPrice,
      deliveryPrice,
      tags,
      images,
      isVegetarian,
      isActive,
    } = req.body;

    // Prevent duplicate name inside branch + category
    const existingItem = await Item.findOne({
      organizationId,
      branchId,
      categoryId,
      name,
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message: "Item with this name already exists in this category of the branch",
      });
    }

    const category = await Category.findOne({
      _id: categoryId,
      organizationId,
      branchId,
    });

    const item = await Item.create({
      organizationId,
      branchId,
      categoryId,
      categoryName:category?category.name:"",
      sku,
      name,
      description,
      uom,
      prepTimeMinutes,
      price,
      onlinePrice,
      parcelPrice,
      deliveryPrice,
      tags,
      images,
      isVegetarian,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: item,
    });
  } catch (error) {
    next(error);
  }
};


// Get all items
export const getItems = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;
    const { categoryId, isActive } = req.query;

    const query = {
      organizationId,
      branchId,
    };
    if (categoryId) query.categoryId = categoryId;
    if (isActive !== undefined) query.isActive = isActive;

    const items = await Item.find(query).sort({ name: 1 });

    res.json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    next(error);
  }
};


// Get single item
export const getItemById = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const item = await Item.findOne({
      _id: req.params.id,
      organizationId,
      branchId,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found or does not belong to this branch",
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    next(error);
  }
};


// Update item
export const updateItem = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const item = await Item.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId,
        branchId,
      },
      req.body,
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found or does not belong to this branch",
      });
    }

    res.json({
      success: true,
      message: "Item updated successfully",
      data: item,
    });
  } catch (error) {
    next(error);
  }
};


// Delete item
export const deleteItem = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      organizationId,
      branchId,
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found or does not belong to this branch",
      });
    }

    res.json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};