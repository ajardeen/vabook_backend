// controllers/subscription.controller.js
import Bundle from "../models/Bundle.model.js";
import Subscription from "../models/Subscription.model.js";
import DailyMeal from "../models/DailyMeal.model.js";
import Menu from "../models/Menu.model.js";
import Customer from "../models/Customer.model.js";

import dayjs from "dayjs";

const getIdsFromHeaders = (req, res) => {
  const organizationId = req.headers["x-organization-id"];
  const branchId = req.headers["x-branch-id"];

  if (!organizationId || !branchId) {
    res.status(400).json({
      success: false,
      message: "Organization ID and Branch ID are required in headers",
    });
    return null;
  }
  return { organizationId, branchId };
};

// POST /subscriptions
export const createSubscription = async (req, res, next) => {
  try {
    const ids = getIdsFromHeaders(req, res);
    if (!ids) return;

    const { organizationId, branchId } = ids;

    const {
      customerId,
      bundleId,
      startDate,
      deliveryId,
      deliveryInstruction = "",
      reminderBeforeEndDays = 2,
      whatsappUpdates = true,
    } = req.body;

    if (!deliveryId) {
      return res.status(400).json({
        success: false,
        message: "deliveryId is required",
      });
    }

    // 1️⃣ Validate bundle
    const bundle = await Bundle.findOne({
      _id: bundleId,
      isPublished: true,
    });

    if (!bundle) {
      return res.status(400).json({
        success: false,
        message: "Bundle not available",
      });
    }

    // 2️⃣ Fetch customer + resolve delivery address
    const customer = await Customer.findOne({
      _id: customerId,
      organizationId,
      branchId,
    }).lean();

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const deliveryAddress = customer.deliveryAddress.find(
      (addr) => addr._id.toString() === deliveryId
    );

    if (!deliveryAddress) {
      return res.status(400).json({
        success: false,
        message: "Invalid delivery address",
      });
    }

    // 3️⃣ Compute subscription dates
    const totalMeals = bundle.totalMealsCount;

    const endDate = dayjs(startDate)
      .add(totalMeals - 1, "day")
      .toDate();

    // 4️⃣ Create subscription with address snapshot
    const subscription = await Subscription.create({
      customerId,
      organizationId,
      branchId,

      bundleId,
      bundleName: bundle.name,
      mealType: bundle.bundleMealType,
      totalMeals,

      totalPrice: bundle.price,
      paidAmount: 0,
      paymentStatus: "pending",

      startDate,
      endDate,

      status: "pending_approval",

      deliveryId,
      deliveryAddress, // ✅ resolved snapshot

      deliveryInstruction,
      reminderBeforeEndDays,
      whatsappUpdates,
    });

    res.status(201).json({
      success: true,
      message: "Subscription created. Awaiting admin approval.",
      data: subscription,
    });
  } catch (err) {
    next(err);
  }
};


// POST /subscriptions/:id/approve
export const approveSubscription = async (req, res, next) => {
  try {
    const subscription = await Subscription.findById(req.params.id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: "Subscription not found",
      });
    }

    if (subscription.status !== "pending_approval") {
      return res.status(400).json({
        success: false,
        message: "Only pending approval subscriptions can be approved",
      });
    }

    const bundle = await Bundle.findById(subscription.bundleId);

    if (!bundle || !bundle.schedule?.length) {
      return res.status(400).json({
        success: false,
        message: "Invalid or empty bundle schedule",
      });
    }

    const menus = await Menu.find({
      _id: { $in: bundle.schedule.map((s) => s.menuId) },
    }).lean();

    const menuMap = {};
    menus.forEach((m) => (menuMap[m._id.toString()] = m));

    const dailyMeals = [];
    const totalMeals = subscription.totalMeals;

    for (let i = 0; i < totalMeals; i++) {
      const scheduleIndex = i % bundle.schedule.length;
      const schedule = bundle.schedule[scheduleIndex];
      const menu = menuMap[schedule.menuId.toString()];

      if (!menu) continue;

      dailyMeals.push({
        subscriptionId: subscription._id,
        customerId: subscription.customerId,
        organizationId: subscription.organizationId,
        branchId: subscription.branchId,

        date: dayjs(subscription.startDate).add(i, "day").toDate(),
        dayIndex: schedule.dayIndex,

        menuId: menu._id,
        menuName: menu.name,

        items: menu.items.map((itm) => ({
          itemId: itm.itemId,
          name: itm.name,
          qty: itm.qty,
        })),
          deliveryId: subscription.deliveryId,
        deliveryAddress: subscription.defaultAddress,

        kitchenStatus: "scheduled",
        deliveryStatus: "pending",

        logs: [
          {
            status: "scheduled",
            updatedAt: new Date(),
          },
        ],
      });
    }

    await DailyMeal.insertMany(dailyMeals);

    subscription.status = "active";
    subscription.approvedAt = new Date();
    subscription.approvedBy = null; // old-style approval
    await subscription.save();

    res.json({
      success: true,
      message: "Subscription approved & daily meals created",
      mealsCreated: dailyMeals.length,
    });
  } catch (err) {
    next(err);
  }
};

export const getPendingSubscriptions = async (req, res, next) => {
  const { organizationId, branchId } = getIdsFromHeaders(req, res);
  if (!organizationId) return;

  const subs = await Subscription.find({
    organizationId,
    branchId,
    status: "pending_approval",
  })
    .populate("customerId", "fullName email")
    .sort({ createdAt: -1 });

  res.json({ success: true, data: subs });
};

// GET /subscriptions/customer/:customerId
export const getCustomerSubscriptions = async (req, res, next) => {
  try {
    const ids = getIdsFromHeaders(req, res);
    if (!ids) return;

    const { organizationId, branchId } = ids;
    const { customerId } = req.params;

    const subscriptions = await Subscription.find({
      customerId,
      organizationId,
      branchId,
      status: { $ne: "cancelled" },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (!subscriptions.length) {
      return res.json({ success: true, data: [] });
    }

    const subscriptionIds = subscriptions.map((s) => s._id);

    // Aggregate deliveries (fallback)
    const deliveryStats = await DailyMeal.aggregate([
      {
        $match: {
          subscriptionId: { $in: subscriptionIds },
          deliveryStatus: "delivered",
        },
      },
      {
        $group: {
          _id: "$subscriptionId",
          deliveredCount: { $sum: 1 },
        },
      },
    ]);

    const deliveredMap = {};
    deliveryStats.forEach((d) => {
      deliveredMap[d._id.toString()] = d.deliveredCount;
    });

    const response = subscriptions.map((sub) => {
      const delivered =
        sub.mealsConsumed ?? deliveredMap[sub._id.toString()] ?? 0;

      const totalMeals = sub.totalMeals || 0;

      const perMealPrice = totalMeals > 0 ? sub.totalPrice / totalMeals : 0;

      return {
        id: sub._id,
        title: sub.bundleName,
        subtitle: `${sub.mealType} · Subscription`,
        deliveriesUsed: `${delivered}/${totalMeals}`,
        balance: Math.max(sub.totalPrice - delivered * perMealPrice, 0),
        expiryDate: dayjs(sub.endDate).format("DD MMM YYYY"),
        reminder: `${sub.reminderBeforeEndDays} days before`,
        deliveryInstruction: sub.deliveryInstruction || "Not specified",
        status: sub.status,
      };
    });

    res.json({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
};

// GET /subscriptions/:id/customer/:customerId
export const getSubscriptionById = async (req, res, next) => {
  try {
    const ids = getIdsFromHeaders(req, res);
    if (!ids) return;

    const { organizationId, branchId } = ids;
    const { id, customerId } = req.params;

    // 1. Fetch the specific subscription
    const subscription = await Subscription.findOne({
      _id: id,
      customerId,
      organizationId,
      branchId,
    }).lean();

    if (!subscription) {
      return res.status(404).json({ 
        success: false, 
        message: "Subscription not found or unauthorized access." 
      });
    }

    // 2. Fetch delivery stats for this specific subscription
    const deliveryStats = await DailyMeal.countDocuments({
      subscriptionId: id,
      deliveryStatus: "delivered",
    });

    // 3. Calculate data points
    const delivered = subscription.mealsConsumed ?? deliveryStats ?? 0;
    const totalMeals = subscription.totalMeals || 0;
    const perMealPrice = totalMeals > 0 ? subscription.totalPrice / totalMeals : 0;

    // 4. Format response
    const response = {
      id: subscription._id,
      title: subscription.bundleName,
      subtitle: `${subscription.mealType} · Subscription`,
      deliveriesUsed: `${delivered}/${totalMeals}`,
      balance: Math.max(subscription.totalPrice - delivered * perMealPrice, 0),
      expiryDate: dayjs(subscription.endDate).format("DD MMM YYYY"),
      reminder: `${subscription.reminderBeforeEndDays} days before`,
      deliveryInstruction: subscription.deliveryInstruction || "Not specified",
      status: subscription.status,
      // You might want to include extra fields for a "Detail" view
      startDate: dayjs(subscription.startDate).format("DD MMM YYYY"),
      totalPrice: subscription.totalPrice,
    };

    res.json({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
};