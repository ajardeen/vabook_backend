import Bundle from "../models/Bundle.model.js";
// Assuming you have updated these validation schemas
import {
  createBundleSchema,
  updateBundleSchema,
} from "../validations/bundle.validation.js";

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

    // Convert stringified schedule back to an array
    let bundleData = { ...req.body };
    if (typeof bundleData.schedule === "string") {
      bundleData.schedule = JSON.parse(bundleData.schedule);
    }

    // Validation
    const { error, value } = createBundleSchema.validate(bundleData);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    // Create the bundle
    const bundle = await Bundle.create({
      organizationId,
      branchId,
      ...value,
      img: req.file ? req.file.filename : null, // req.file comes from Multer
    });

    res.status(201).json({ success: true, data: bundle });
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
    } // schedule.menuId is correct for populating only the menu basic fields

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
      // Construct base URL for images
      const baseUrl = `${req.protocol}://${req.get("host")}/uploads/bundles/`;
      
      const days = bundle.schedule
        .sort((a, b) => a.dayIndex - b.dayIndex)
        .map((s) => {
          const menu = s.menuId;
          if (!menu) return null;

          const items = menu.items.map((itm) => {
            const itemDoc = itm.itemId;
            const nutrition = itemDoc?.nutrition || { calories: 0, protein: 0, carbs: 0, fat: 0 };

            return {
              itemName: itm.name || itemDoc?.name,
              quantity: itm.qty,
              uom: itemDoc?.uom || "",
              category: itm.isVegetarian ? "veg" : "non-veg",
              description: itemDoc?.description || "",
              imageUrl: itemDoc?.images || "",
              nutrition,
              price: itemDoc?.price,
            };
          });

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
        description: bundle.description,
        bundleMealType: bundle.bundleMealType,
        totalMealsCount: bundle.totalMealsCount,
        // ✅ Construct full Image URL
        imgUrl: bundle.img ? `${baseUrl}${bundle.img}` : null,
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
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const bundle = await Bundle.findOne({
      _id: req.params.id,
      organizationId,
      branchId,
    }).populate({
      path: "schedule.menuId",
      model: "Menu",
      populate: {
        path: "items.itemId",
        model: "Item",
        select: "name price uom description pricing",
      },
    });

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: "Bundle not found or does not belong to this branch",
      });
    }

    // ✅ Attach Image URL before sending
    const baseUrl = `${req.protocol}://${req.get("host")}/uploads/bundles/`;
    const bundleObj = bundle.toObject(); // Convert to plain JS object
    bundleObj.imgUrl = bundle.img ? `${baseUrl}${bundle.img}` : null;

    res.json({
      success: true,
      data: bundleObj,
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
