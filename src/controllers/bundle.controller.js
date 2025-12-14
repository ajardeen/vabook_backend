import Bundle from "../models/Bundle.model.js";
// Assuming you have updated these validation schemas
import { createBundleSchema, updateBundleSchema } from "../validations/bundle.validation.js"; 

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

// =======================
// CREATE BUNDLE
// =======================
export const createBundle = async (req, res, next) => {
  try {
    const { organizationId, branchId } = getIdsFromHeaders(req, res);
    if (!organizationId) return;

    const { error, value } = createBundleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // The validation (value) now contains name, price, totalMealsCount, bundleMealType, schedule
    const existing = await Bundle.findOne({
      organizationId,
      branchId,
      name: value.name,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Bundle with this name already exists in this branch",
      });
    }

    const bundle = await Bundle.create({
      organizationId,
      branchId,
      ...value, 
    });

    res.status(201).json({
      success: true,
      message: "Bundle created successfully",
      data: bundle,
    });
  } catch (err) {
    next(err);
  }
};

// =======================
// GET ALL BUNDLES (ADMIN VIEW)
// =======================
export const getBundles = async (req, res, next) => {
  try {
    const { organizationId, branchId } = getIdsFromHeaders(req, res);
    if (!organizationId) return;

    const query = { organizationId, branchId };

    if (req.query.isPublished !== undefined) {
      query.isPublished = req.query.isPublished === "true";
    }

    // schedule.menuId is correct for populating only the menu basic fields
    const bundles = await Bundle.find(query)
      .populate("schedule.menuId", "name mealType suggestedDay")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bundles.length,
      data: bundles,
    });
  } catch (err) {
    next(err);
  }
};

// =======================
// GET PUBLISHED BUNDLES (CLIENT VIEW)
// =======================
export const getPublishedBundles = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const bundles = await Bundle.find({
      organizationId,
      branchId,
      isPublished: true,
    })
      .populate({
        path: "schedule.menuId",
        model: "Menu",
        populate: {
          path: "items.itemId",
          model: "Item",
        },
      })
      .sort({ createdAt: -1 });

    const formattedBundles = bundles.map((bundle) => {
      const days = bundle.schedule
        .sort((a, b) => a.dayIndex - b.dayIndex)
        .map((s) => {
          const menu = s.menuId;
          if (!menu) return null;

          const items = menu.items.map((itm) => {
            const itemDoc = itm.itemId;

            const nutrition = itemDoc?.nutrition || {
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
            };

            return {
              itemName: itm.name || itemDoc?.name, // Use item name from menu or item doc
              quantity: itm.qty,
              uom: itemDoc?.uom || "",
              category: itm.isVegetarian ? "veg" : "non-veg",
              description: itemDoc?.description || "",
              imageUrl: itemDoc?.images || "",
              nutrition,
              // Keep original price fields if available
              price: itemDoc?.price, 
            };
          });

          // 🧮 Daily nutrition total
          const totalNutrition = items.reduce(
            (acc, item) => {
              acc.calories += item.nutrition.calories || 0;
              acc.protein += item.nutrition.protein || 0;
              acc.carbs += item.nutrition.carbs || 0;
              acc.fat += item.nutrition.fat || 0;
              return acc;
            },
            { calories: 0, protein: 0, carbs: 0, fat: 0 }
          );

          return {
            dayIndex: s.dayIndex,
            menuId: menu._id,
            menuName: menu.name,
            mealType: menu.mealType,
            items,
            totalNutrition,
          };
        })
        .filter(Boolean);

      return {
        id: bundle._id,
        name: bundle.name,
        price: bundle.price,
        // ✅ NEW FIELDS
        bundleMealType: bundle.bundleMealType,
        totalMealsCount: bundle.totalMealsCount,
        days,
      };
    });

    return res.json({
      success: true,
      count: formattedBundles.length,
      data: { bundles: formattedBundles },
    });
  } catch (error) {
    next(error);
  }
};
  
// =======================
// GET BUNDLE BY ID
// =======================
export const getBundleById = async (req, res, next) => {
  console.log("called bundle id");
  
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const bundle = await Bundle.findOne({
      _id: req.params.id,
      organizationId,
      branchId,
    })
      // Deep Population for Menu and Items
      .populate({
        path: "schedule.menuId",
        model: "Menu",
        // Populate the 'items' array inside the 'Menu'
        populate: {
          path: "items.itemId", // Path to the actual Item document
          model: "Item", // Assuming your Item model is named 'Item'
           // We need name, price, uom from Item Master
           select: "name price uom description" 
        },
      });

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: "Bundle not found or does not belong to this branch",
      });
    }

    res.json({
      success: true,
      data: bundle,
    });
  } catch (error) {
    next(error);
  }
};

// =======================
// UPDATE BUNDLE
// =======================
export const updateBundle = async (req, res, next) => {
  try {
    const { organizationId, branchId } = getIdsFromHeaders(req, res);
    if (!organizationId) return;

    const { error, value } = updateBundleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const bundle = await Bundle.findOneAndUpdate(
      { _id: req.params.id, organizationId, branchId },
      value, // value now includes bundleMealType and totalMealsCount
      { new: true, runValidators: true }
    ).populate("schedule.menuId", "name mealType suggestedDay");

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: "Bundle not found or access denied",
      });
    }

    res.json({
      success: true,
      message: "Bundle updated successfully",
      data: bundle,
    });
  } catch (err) {
    next(err);
  }
};

// =======================
// DELETE BUNDLE
// =======================
export const deleteBundle = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const bundle = await Bundle.findOneAndDelete({
      _id: req.params.id,
      organizationId,
      branchId,
    });

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: "Bundle not found or does not belong to this branch",
      });
    }

    res.json({
      success: true,
      message: "Bundle deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};