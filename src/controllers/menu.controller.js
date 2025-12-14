import Menu from "../models/Menu.model.js";
import {
  createMenuSchema,
  updateMenuSchema,
} from "../validations/menu.validation.js";

// 🔐 Header helper
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

// ➕ Create Menu
export const createMenu = async (req, res, next) => {
  try {
    const ctx = getIdsFromHeaders(req, res);
    if (ctx.error) return;

    const { error, value } = createMenuSchema.validate(req.body, {
      abortEarly: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const menu = await Menu.create({
      ...value,
      organizationId: ctx.organizationId,
      branchId: ctx.branchId,
    });

    res.status(201).json({
      success: true,
      message: "Menu created successfully",
      data: menu,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Menu with this name already exists in this branch",
      });
    }
    next(err);
  }
};

// 📄 Get Menus
export const getMenus = async (req, res, next) => {
  try {
    const ctx = getIdsFromHeaders(req, res);
    if (ctx.error) return;

    const query = {
      organizationId: ctx.organizationId,
      branchId: ctx.branchId,
    };

    if (req.query.suggestedDay) {
      query.suggestedDay = req.query.suggestedDay;
    }

    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === "true";
    }

    const menus = await Menu.find(query)
      .populate("items.itemId", "name isVegetarian price uom")
      .sort({ name: 1 });

    res.json({
      success: true,
      count: menus.length,
      data: menus,
    });
  } catch (err) {
    next(err);
  }
};

// 📄 Get Menu by ID
export const getMenuById = async (req, res, next) => {
  try {
    const ctx = getIdsFromHeaders(req, res);
    if (ctx.error) return;

    const menu = await Menu.findOne({
      _id: req.params.id,
      organizationId: ctx.organizationId,
      branchId: ctx.branchId,
    }).populate("items.itemId", "name isVegetarian");

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found or access denied",
      });
    }

    res.json({
      success: true,
      data: menu,
    });
  } catch (err) {
    next(err);
  }
};

// ✏️ Update Menu (SAFE)
export const updateMenu = async (req, res, next) => {
  try {
    const ctx = getIdsFromHeaders(req, res);
    if (ctx.error) return;

    const { error, value } = updateMenuSchema.validate(req.body, {
      abortEarly: true,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const menu = await Menu.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId: ctx.organizationId,
        branchId: ctx.branchId,
      },
      value,
      { new: true, runValidators: true }
    ).populate("items.itemId", "name isVegetarian");

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found or access denied",
      });
    }

    res.json({
      success: true,
      message: "Menu updated successfully",
      data: menu,
    });
  } catch (err) {
    next(err);
  }
};

// 🗑 Delete Menu
export const deleteMenu = async (req, res, next) => {
  try {
    const ctx = getIdsFromHeaders(req, res);
    if (ctx.error) return;

    const menu = await Menu.findOneAndDelete({
      _id: req.params.id,
      organizationId: ctx.organizationId,
      branchId: ctx.branchId,
    });

    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Menu not found or access denied",
      });
    }

    res.json({
      success: true,
      message: "Menu deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};
