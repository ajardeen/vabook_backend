import Bundle from "../models/Bundle.model.js";
import { createBundleSchema } from "../validations/bundle.validation.js";

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

export const createBundle = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const { error } = createBundleSchema.validate(req.body);
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
      durationDays,
      basePrice,
      currency,
      repeatWeeks,
      menus,
      isPublished,
      status,
    } = req.body;

    const existing = await Bundle.findOne({
      organizationId,
      branchId,
      name,
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "A bundle with this name already exists in this branch",
      });
    }

    const bundle = await Bundle.create({
      organizationId,
      branchId,
      name,
      slug,
      description,
      durationDays,
      repeatWeeks,
      basePrice,
      currency,
      menus,
      isPublished,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Bundle created successfully",
      data: bundle,
    });
  } catch (error) {
    next(error);
  }
};

export const getBundles = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;
    const { isPublished, status } = req.query;

    const query = {
      organizationId,
      branchId,
    };

    if (isPublished !== undefined) query.isPublished = isPublished;
    if (status) query.status = status;

    const bundles = await Bundle.find(query)
      .populate("menus.menuId")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: bundles.length,
      data: bundles,
    });
  } catch (error) {
    next(error);
  }
};

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
        path: "menus.menuId",
        model: "Menu",
        populate: {
          path: "items.itemId",
          model: "Item",
        },
      })
      .sort({ createdAt: -1 });

    const formattedBundles = bundles.map((bundle) => ({
      id: bundle._id,
      name: bundle.name,
      description: bundle.description || "",
      category: "veg" || "mix",
      price: bundle.basePrice || 0,
      bundleType:bundle.bundleType || "",
      bundleImage: bundle.metadata?.image || "", // optional later
      days: bundle.menus.map((m) => {
        const menu = m.menuId;
        const items = menu.items.map((itm) => {
          const bundleItem = m.items?.find(
            (bi) => bi.itemId.toString() === itm.itemId._id.toString()
          );
          return {
            itemName: itm.itemName || "",
            quantity: bundleItem ? bundleItem.qty : itm.qty || 0,
            uom: itm.itemId?.uom || "",
            category: itm.itemId?.isVegetarian ? "veg" : "non-veg",
            description: itm.itemId?.description || "",
            imageUrl: itm.itemId?.images || "",
            nutrition: itm.itemId?.nutrition || {
              calories: 0,
              protein: 0,
              carbs: 0,
              fat: 0,
            },
          };
        });

        // Calculate daily total nutrition
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
          day: menu.dayOfWeek || "",
          menuName: menu.name || "",
          items,
          totalNutrition,
        };
      }),
    }));

    return res.json({
      success: true,
      count: formattedBundles.length,
      data: { bundles: formattedBundles },
    });
  } catch (error) {
    next(error);
  }
};

export const getBundleById = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const bundle = await Bundle.findOne({
      _id: req.params.id,
      organizationId,
      branchId,
    }).populate("menus.menuId");

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

export const updateBundle = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const bundle = await Bundle.findOneAndUpdate(
      {
        _id: req.params.id,
        organizationId,
        branchId,
      },
      req.body,
      { new: true, runValidators: true }
    ).populate("menus.menuId");

    if (!bundle) {
      return res.status(404).json({
        success: false,
        message: "Bundle not found or does not belong to this branch",
      });
    }

    res.json({
      success: true,
      message: "Bundle updated successfully",
      data: bundle,
    });
  } catch (error) {
    next(error);
  }
};

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
