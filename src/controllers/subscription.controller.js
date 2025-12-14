import Bundle from "../models/Bundle.model.js";
import Subscription from "../models/Subscription.model.js";
import DailyMeal from "../models/DailyMeal.model.js";
import dayjs from "dayjs";

// POST /subscriptions
export const createSubscription = async (req, res, next) => {
  try {
    const { organizationId, branchId } = getIdsFromHeaders(req, res);
    if (!organizationId) return;

    const {
      customerId,
      bundleId,
      startDate,
      defaultAddress,
    } = req.body;

    const bundle = await Bundle.findOne({
      _id: bundleId,
      isPublished: true,
    });

    if (!bundle) {
      return res.status(400).json({
        success: false,
        message: "Bundle not available for subscription",
      });
    }

    const endDate = dayjs(startDate)
      .add(bundle.durationDays - 1, "day")
      .toDate();

    const subscription = await Subscription.create({
      customerId,
      organizationId,
      branchId,
      bundleId,
      bundleName: bundle.name,
      totalPrice: bundle.price,
      startDate,
      endDate,
      status: "paused", // 🔑 admin approval required
      defaultAddress,
    });

    res.status(201).json({
      success: true,
      message: "Subscription created. Awaiting approval.",
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
    if (!subscription)
      return res.status(404).json({ message: "Subscription not found" });

    if (subscription.status !== "paused") {
      return res.status(400).json({
        message: "Only paused subscriptions can be approved",
      });
    }

    const bundle = await Bundle.findById(subscription.bundleId)
      .populate("schedule.menuId");

    const dailyMeals = [];

    for (let day = 0; day < bundle.durationDays; day++) {
      const schedule = bundle.schedule.find(
        (s) => s.dayIndex === day
      );

      if (!schedule) continue;

      const menu = schedule.menuId;

      dailyMeals.push({
        subscriptionId: subscription._id,
        customerId: subscription.customerId,
        branchId: subscription.branchId,
        date: dayjs(subscription.startDate).add(day, "day").toDate(),
        dayIndex: day,
        menuId: menu._id,
        menuName: menu.name,
        items: menu.items.map((i) => ({
          itemId: i.itemId,
          name: i.name,
          qty: i.qty,
        })),
        deliveryAddress: subscription.defaultAddress,
        kitchenStatus: "scheduled",
        deliveryStatus: "pending",
      });
    }

    await DailyMeal.insertMany(dailyMeals);

    subscription.status = "active";
    await subscription.save();

    res.json({
      success: true,
      message: "Subscription approved and daily meals created",
    });
  } catch (err) {
    next(err);
  }
};


