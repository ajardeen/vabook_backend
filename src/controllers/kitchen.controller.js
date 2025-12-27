import { io } from "../server.js";
// controllers/kitchen.controller.js
import dayjs from "dayjs";
import DailyMeal from "../models/DailyMeal.model.js";
import Customer from "../models/Customer.model.js";

const getIdsFromHeaders = (req, res) => {
  const organizationId = req.headers["x-organization-id"];
  const branchId = req.headers["x-branch-id"];

  if (!organizationId || !branchId) {
    res.status(400).json({
      success: false,
      message: "Organization ID and Branch ID are required",
    });
    return null;
  }
  return { organizationId, branchId };
};


// GET /kitchen
export const getKitchenTasks = async (req, res, next) => {
  try {
    const ctx = getIdsFromHeaders(req, res);
    if (!ctx) return;

    const { branchId } = ctx;

    const start = dayjs().startOf("day").toDate();
    const end = dayjs().endOf("day").toDate();

    const meals = await DailyMeal.find({
      branchId,
      // date: { $gte: start, $lte: end }, // ✅ today only
      kitchenStatus: { $ne: "cancelled" },
    })
      .populate("customerId", "fullName")
      .populate("chefId", "name") // 🔥 NEW (optional but useful)
      .lean();

    const response = meals.map((m) => {
      /**
       * BACKEND → UI STATUS MAP
       */
      const statusMap = {
        scheduled: "queue",
        preparing: "cooking",
        ready: "ready",
        completed: "completed",
      };

      const items = m.items.map((i) => ({
        itemName: i.name,
        qty: i.qty,
        prepTimeMinutes: 5, // ⛔ static for now (UI dependency)
      }));

      return {
        _id: m._id,
        customerName: m.customerId?.fullName ?? "Customer",
        bundleName: m.menuName,
        deliveryDate: m.date,

        items,
        totalPrepTime: items.length * 5,

        status: statusMap[m.kitchenStatus] ?? "queue",

        // 🔥 EXTRA (UI-safe, ignored if unused)
        chef: m.chefId
          ? {
              id: m.chefId._id,
              name: m.chefId.name,
            }
          : null,

        kitchenStatus: m.kitchenStatus, // for debugging / future UI
      };
    });

    res.json({
      success: true,
      count: response.length,
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

export const updateKitchenStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, chefId } = req.body;

    const meal = await DailyMeal.findById(id);
    if (!meal) {
      return res.status(404).json({
        success: false,
        message: "Daily meal not found",
      });
    }

    /**
     * STATUS MAP (frontend → backend)
     */
    const statusMap = {
      cooking: "preparing",
      ready: "ready",
      completed: "completed",
    };

    const nextStatus = statusMap[status];
    if (!nextStatus) {
      return res.status(400).json({
        success: false,
        message: "Invalid kitchen status",
      });
    }

    /**
     * VALIDATE CHEF OWNERSHIP
     */
    if (nextStatus !== "scheduled" && nextStatus !== "cancelled") {
      if (!chefId) {
        return res.status(400).json({
          success: false,
          message: "chefId is required for this action",
        });
      }
    }

    /**
     * START COOKING
     */
    if (meal.kitchenStatus === "scheduled" && nextStatus === "preparing") {
      meal.chefId = chefId;
    }

    /**
     * PREVENT OTHER CHEFS FROM MODIFYING
     */
    if (meal.chefId && chefId && meal.chefId.toString() !== chefId) {
      return res.status(403).json({
        success: false,
        message: "This task is already assigned to another chef",
      });
    }

    /**
     * VALID STATE TRANSITIONS
     */
    const allowedTransitions = {
      scheduled: ["preparing", "cancelled"],
      preparing: ["ready", "cancelled"],
      ready: ["completed"],
      completed: [],
    };

    if (!allowedTransitions[meal.kitchenStatus]?.includes(nextStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid transition from ${meal.kitchenStatus} to ${nextStatus}`,
      });
    }

    /**
     * APPLY STATUS
     */
    meal.kitchenStatus = nextStatus;

    meal.logs.push({
      status: nextStatus,
      updatedAt: new Date(),
      updatedBy: chefId,
    });

    /**
     * WHEN COMPLETED → OPEN DELIVERY PIPELINE
     */
    if (nextStatus === "completed") {
      meal.deliveryStatus = "ready_for_pickup";
      meal.logs.push({
        status: "ready_for_pickup",
        updatedAt: new Date(),
        updatedBy: chefId,
      });
    }

    await meal.save();

    /**
     * SOCKET UPDATE
     */
    io.emit("kitchen:update", {
      mealId: meal._id,
      kitchenStatus: meal.kitchenStatus,
      chefId: meal.chefId,
    });

    res.json({
      success: true,
      message: "Kitchen status updated successfully",
      data: meal,
    });
  } catch (err) {
    next(err);
  }
};
