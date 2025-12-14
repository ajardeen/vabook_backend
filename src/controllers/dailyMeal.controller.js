// GET /daily-meals/kitchen/today
export const getTodayKitchenMeals = async (req, res) => {
  const { organizationId, branchId } = getIdsFromHeaders(req, res);

  const start = dayjs().startOf("day").toDate();
  const end = dayjs().endOf("day").toDate();

  const meals = await DailyMeal.find({
    branchId,
    date: { $gte: start, $lte: end },
    kitchenStatus: { $in: ["scheduled", "preparing"] },
  }).populate("menuId");

  res.json({ success: true, data: meals });
};


// PATCH /daily-meals/:id/kitchen-status
export const updateKitchenStatus = async (req, res) => {
  const { status } = req.body;

  const meal = await DailyMeal.findById(req.params.id);
  if (!meal) return res.status(404).json({ message: "Meal not found" });

  meal.kitchenStatus = status;
  meal.logs.push({ status, updatedAt: new Date() });

  // Auto-trigger delivery
  if (status === "ready") {
    meal.deliveryStatus = "ready_for_pickup";
  }

  await meal.save();
  res.json({ success: true });
};
