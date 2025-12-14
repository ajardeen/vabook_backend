import DailyMeal from "../models/DailyMeal.model.js";
import StaffAccount from "../models/StaffAccount.model.js";

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


export const assignRider = async (req, res, next) => {
  try {
    const { error, branchId } = getIdsFromHeaders(req, res);
    if (error) return;

    const { mealId } = req.params;
    const { riderId } = req.body;

    const rider = await StaffAccount.findOne({
      _id: riderId,
      role: "rider",
      status: "active",
    });

    if (!rider) {
      return res.status(400).json({
        success: false,
        message: "Invalid or inactive rider",
      });
    }

    const meal = await DailyMeal.findOne({
      _id: mealId,
      branchId,
    });

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: "DailyMeal not found",
      });
    }

    meal.riderId = rider._id;
    meal.deliveryStatus = "assigned";
    meal.logs.push({
      status: "assigned",
      updatedBy: rider._id,
    });

    await meal.save();

    // socket emit optional
    // io.emit("delivery:update", { mealId, status: "assigned" });

    res.json({
      success: true,
      message: "Rider assigned successfully",
      data: meal,
    });
  } catch (err) {
    next(err);
  }
};


export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { error, branchId } = getIdsFromHeaders(req, res);
    if (error) return;

    const { mealId } = req.params;
    const { status, riderId } = req.body;

    const allowedStatuses = [
      "picked_up",
      "en_route",
      "delivered",
      "failed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery status",
      });
    }

    const meal = await DailyMeal.findOne({
      _id: mealId,
      branchId,
    });

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: "DailyMeal not found",
      });
    }

    // enforce rider ownership
    if (meal.riderId && riderId && meal.riderId.toString() !== riderId) {
      return res.status(403).json({
        success: false,
        message: "This meal is assigned to another rider",
      });
    }

    meal.deliveryStatus = status;

    meal.logs.push({
      status,
      updatedBy: riderId || meal.riderId,
    });

    await meal.save();

    // socket emit optional
    // io.emit("delivery:update", { mealId, status });

    res.json({
      success: true,
      message: "Delivery status updated",
      data: meal,
    });
  } catch (err) {
    next(err);
  }
};

import dayjs from "dayjs";

export const getRiderJobsForToday = async (req, res, next) => {
  try {
    const { error, branchId } = getIdsFromHeaders(req, res);
    if (error) return;

    const start = dayjs().startOf("day").toDate();
    const end = dayjs().endOf("day").toDate();

    const meals = await DailyMeal.find({
      branchId,
      date: { $gte: start, $lte: end },
      deliveryStatus: { $in: ["ready_for_pickup", "assigned"] },
    })
      .populate("menuId", "name")
      .populate("customerId", "fullName phone");

    const jobs = meals.map((m) => ({
      mealId: m._id,
      date: m.date,
      menuName: m.menuName,
      deliveryStatus: m.deliveryStatus,
      customer: {
        name: m.customerId?.fullName,
        phone: m.customerId?.phone,
      },
      deliveryAddress: m.deliveryAddress?.text,
    }));

    res.json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (err) {
    next(err);
  }
};

export const getRiderMealDetail = async (req, res, next) => {
  try {
    const { error, branchId } = getIdsFromHeaders(req, res);
    if (error) return;

    const { mealId } = req.params;

    const meal = await DailyMeal.findOne({
      _id: mealId,
      branchId,
    })
      .populate("menuId", "name")
      .populate("customerId", "fullName phone email");

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: "DailyMeal not found",
      });
    }

    res.json({
      success: true,
      data: {
        mealId: meal._id,
        date: meal.date,
        menuName: meal.menuName,
        deliveryStatus: meal.deliveryStatus,
        deliveryAddress: meal.deliveryAddress,
        customer: {
          name: meal.customerId?.fullName,
          phone: meal.customerId?.phone,
          email: meal.customerId?.email,
        },
        items: meal.items,
      },
    });
  } catch (err) {
    next(err);
  }
};
