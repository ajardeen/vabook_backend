import Menu from "../models/Menu.model.js";
import { createMenuSchema } from "../validations/menu.validation.js";


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

// Create Menu
export const createMenu = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    // Validate
    const { error } = createMenuSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const {
      name,
      description,
      dayOfWeek,
      dayIndex,
      items,
      availableFrom,
      availableTo,
      status,
    } = req.body;

    // Prevent duplicate menu name in same branch
    const existingMenu = await Menu.findOne({
      organizationId,
      branchId,
      name,
    });

    if (existingMenu) {
      return res.status(400).json({
        success: false,
        message: "Menu with this name already exists in this branch",
      });
    }

    const menu = await Menu.create({
      organizationId,
      branchId,
      name,
      description,
      dayOfWeek,
      dayIndex,
      items,
      availableFrom,
      availableTo,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Menu created successfully",
      data: menu,
    });
  } catch (error) {
    next(error);
  }
};


// Get menus (with filters)
export const getMenus = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;
    const { dayOfWeek, status } = req.query;

    const query = {
      organizationId,
      branchId,
    };
    if (dayOfWeek) query.dayOfWeek = dayOfWeek;
    if (status) query.status = status;

    const menus = await Menu.find(query)
      .populate("items.itemId")
      .sort({ name: 1 });

    res.json({
      success: true,
      count: menus.length,
      data: menus,
    });
  } catch (error) {
    next(error);
  }
};


// Get single menu
export const getMenuById = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const menu = await Menu.findOne({
      _id: req.params.id,
      organizationId,
      branchId,
    }).populate("items.itemId");

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found or does not belong to this branch",
      });
    }

    res.json({
      success: true,
      data: menu,
    });
  } catch (error) {
    next(error);
  }
};


// Update menu
export const updateMenu = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const menu = await Menu.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId,
        branchId,
      },
      req.body,
      { new: true, runValidators: true }
    ).populate("items.itemId");

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found or does not belong to this branch",
      });
    }

    res.json({
      success: true,
      message: "Menu updated successfully",
      data: menu,
    });
  } catch (error) {
    next(error);
  }
};


// Delete menu
export const deleteMenu = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const menu = await Menu.findOneAndDelete({
      _id: req.params.id,
      organizationId,
      branchId,
    });

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found or does not belong to this branch",
      });
    }

    res.json({
      success: true,
      message: "Menu deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};