import Item from "../models/Item.model.js";
import Menu from "../models/Menu.model.js";
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

    const { organizationId, branchId } = context; // Validate

    const { error } = createItemSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    } // --- START: Schema Alignment Updates --- // Removed old pricing fields and 'categoryName', added 'pricing'

    const {
      categoryId,
      sku,
      name,
      description,
      uom,
      prepTimeMinutes,
      pricing, // NEW: Expecting the array of pricing tiers
      image, // Assuming 'image' maps to the single URL field
      isVegetarian,
      isActive,
      nutrition, // NOTE: Removed redundant fields from body: price, onlinePrice, parcelPrice, deliveryPrice, tags, images (now 'image')
    } = req.body; // --- END: Schema Alignment Updates --- // Prevent duplicate name inside branch + category
    const existingItem = await Item.findOne({
      organizationId,
      branchId,
      categoryId,
      name,
    });

    if (existingItem) {
      return res.status(400).json({
        success: false,
        message:
          "Item with this name already exists in this category of the branch",
      });
    } // --- START: Data Redundancy Removal --- // Removed Category lookup as 'categoryName' is no longer stored in Item schema. // const category = await Category.findOne({ ... }); // --- END: Data Redundancy Removal ---

    const item = await Item.create({
      organizationId,
      branchId,
      categoryId, // Removed categoryName: category ? category.name : "",
      sku,
      name,
      description,
      uom,
      prepTimeMinutes,
      pricing, // NEW: Using the consolidated pricing array // Removed old price fields (price, onlinePrice, parcelPrice, deliveryPrice)
      image, // Using the single image field
      isVegetarian,
      isActive,
      nutrition,
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

    const items = await Item.find(query)
      .populate("categoryId", "name") // Populate only the 'name' field from Category
      .lean() // Use lean for better performance as we are formatting the output
      .sort({ name: 1 });

    const formattedItems = items.map((item) => ({
      ...item,
      categoryName: item.categoryId ? item.categoryId.name : null,
    }));

    res.json({
      success: true,
      count: formattedItems.length,
      data: formattedItems,
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
    // Removed console.log("req=body", req.body); for cleaner logs
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context; // finding item is linked with menu item
    const itemId = req.params.id; // Check if item linked with any menu
    const isLinkedWithMenu = await Menu.exists({
      organizationId,
      branchId,
      "items.itemId": itemId,
    }); // Note: This check correctly prevents deactivating an item linked to a menu.

    if (isLinkedWithMenu && req.body.isActive === false) {
      return res.status(400).json({
        success: false,
        message: "Item is linked with menu and cannot be deactivated",
      });
    } // Mongoose will automatically validate and update the pricing array // if the client sends the new 'pricing' field in req.body.

    const item = await Item.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId,
        branchId,
      },
      req.body, // req.body should now contain the 'pricing' array instead of individual price fields
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
    const itemId = req.params.id; // Check if item linked with any menu
    const isLinkedWithMenu = await Menu.exists({
      organizationId,
      branchId,
      "items.itemId": itemId,
    });
    if (isLinkedWithMenu) {
      return res.status(405).json({
        success: false,
        message: "Item is linked with menu and cannot be deleted",
      });
    }

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
