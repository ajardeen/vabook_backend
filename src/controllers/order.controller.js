import {
  createOrderSchema,
  updateCycleStatusSchema,
} from "../validations/order.validation.js";
import KitchenTask from "../models/KitchenTask.model.js";
import Bundle from "../models/Bundle.model.js";
import Order from "../models/Order.model.js";
import Customer from "../models/Customer.model.js";
import Subscription from "../models/Subscription.model.js";
import StaffAccount from "../models/StaffAccount.model.js";
import dayjs from "dayjs";
import DailyMeal from "../models/DailyMeal.model.js";
// Generate Unique Order Number
const generateOrderNumber = () => "ORD-" + Date.now();

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

// Get order bu customer id
export const getOrdersByCustomerId = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    if (!customerId)
      return res
        .status(400)
        .json({ success: false, message: "Customer ID is required" });

    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;
    const orders = await DailyMeal.find({ organizationId, branchId, customerId });
    if (!orders) {
      return res.status(404).json({
        success: false,
        message: "No orders found for this customer",
      });
    }
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// GET /orders/rider/jobs
export const getRiderJobsForToday = async (req, res, next) => {
  try {
    const ctx = getIdsFromHeaders(req, res);
    if (!ctx) return;

    const { organizationId, branchId } = ctx;

    const start = dayjs().startOf("day").toDate();
    const end = dayjs().endOf("day").toDate();

    const meals = await DailyMeal.find({
      organizationId,
      branchId,
      // date: { $gte: start, $lte: end },
      deliveryStatus: { $ne: "pending" },
  //     $or: [
  //   { riderId: null },        // available jobs
  //   { riderId: riderId },     // my jobs
  // ],
    })
      .select("_id menuName deliveryStatus date subscriptionId deliveryId")
      .lean();

    if (!meals.length) {
      return res.json({ success: true, count: 0, data: [] });
    }

    // 🔑 Fetch related subscriptions
    const subscriptionIds = meals.map((m) => m.subscriptionId);
    const subscriptions = await Subscription.find({
      _id: { $in: subscriptionIds },
    })
      .select("deliveryId deliveryAddress")
      .lean();

    const subMap = {};
    subscriptions.forEach((s) => {
      subMap[s._id.toString()] = s;
    });

    const jobs = meals.map((m) => {
      const sub = subMap[m.subscriptionId.toString()];

      return {
        taskId: m._id,
        jobCode: `MEAL-${m._id.toString().slice(-6)}`,
        menuName: m.menuName,
        deliveryStatus: m.deliveryStatus,
        paymentStatus :sub?.paymentStatus,
        scheduledDate: m.date,

        // ✅ delivery address from subscription
        deliveryAddress: sub?.deliveryAddress || null,
      };
    });

    res.json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (err) {
    next(err);
  }
};


// GET /orders/rider/jobs
export const getRiderOrderDetail = async (req, res, next) => {
  try {
    const ctx = getIdsFromHeaders(req, res);
    if (!ctx) return;

    const { organizationId, branchId } = ctx;
    const { taskId } = req.params;

    const meal = await DailyMeal.findOne({
      _id: taskId,
      organizationId,
      branchId,
    })
      .populate("customerId", "fullName phone email")
      .lean();

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: "Delivery task not found",
      });
    }

    const subscription = await Subscription.findById(
      meal.subscriptionId
    ).lean();

    if (
      !subscription ||
      subscription.deliveryId.toString() !== meal.deliveryId.toString()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery mapping",
      });
    }

    const isAccepted =
      meal.deliveryStatus !== "pending" &&
      meal.deliveryStatus !== "ready_for_pickup";

    res.json({
      success: true,
      data: {
        taskId: meal._id,
        orderNumber: `MEAL-${meal._id.toString().slice(-6)}`,
        bundleName: subscription.bundleName,
        menuName: meal.menuName,
        quantity: 1,
        deliveryStatus: meal.deliveryStatus,
        paymentStatus :subscription?.paymentStatus,



        // ✅ always visible
        deliveryAddress: subscription.deliveryAddress,

        // 🔒 visible only after accept
        customer: isAccepted
          ? {
              name: meal.customerId.fullName,
              phone: meal.customerId.phone,
              email: meal.customerId.email,
            }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/orders/:orderId/delivery-status
// body: { action: "accept" | "pickup" | "on_the_way" | "delivered" }

// POST /api/orders/:taskId/delivery-status
export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { action, riderId } = req.body;

    const meal = await DailyMeal.findById(taskId);
    if (!meal) {
      return res.status(404).json({
        success: false,
        message: "Delivery task not found",
      });
    }

    let newStatus;

    // 🔒 Prevent double-delivery
    if (action === "delivered" && meal.deliveryStatus === "delivered") {
      return res.status(400).json({
        success: false,
        message: "Meal already delivered",
      });
    }

    if (action === "accept") {
      if (!riderId) {
        return res.status(400).json({
          success: false,
          message: "riderId required",
        });
      }

      newStatus = "assigned";
      meal.riderId = riderId;
    } else if (action === "pickup") {
      newStatus = "picked_up";
    } else if (action === "on_the_way") {
      newStatus = "en_route";
    } else if (action === "delivered") {
      newStatus = "delivered";
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid action",
      });
    }

    // Update DailyMeal
    meal.deliveryStatus = newStatus;
    meal.logs.push({
      status: newStatus,
      updatedAt: new Date(),
      updatedBy: riderId || null,
    });

    await meal.save();

    // 🧠 SUBSCRIPTION UPDATE (only on delivery)
    if (newStatus === "delivered") {
      const subscription = await Subscription.findById(meal.subscriptionId);

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: "Subscription not found",
        });
      }

      // Increment safely
      subscription.mealsConsumed += 1;

      // Auto-complete subscription
      if (subscription.mealsConsumed >= subscription.totalMeals) {
        subscription.status = "completed";
      }

      await subscription.save();
    }

    res.json({
      success: true,
      message: `Delivery status updated to ${newStatus}`,
      data: {
        taskId,
        status: newStatus,
      },
    });
  } catch (err) {
    next(err);
  }
};


