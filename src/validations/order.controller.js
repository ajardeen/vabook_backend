import Order from "../models/Order.model.js";
import Bundle from "../models/Bundle.model.js";
import { createOrderSchema, updateCycleStatusSchema } from "../validations/order.validation.js";
import dayjs from "dayjs"; // npm install dayjs

// Generate Unique Order Number
const generateOrderNumber = () => "ORD-" + Date.now();


// Create Order
export const createOrder = async (req, res, next) => {
  try {
    const { error } = createOrderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const { customerId, organizationId, branchId, bundleId, orderType, startDate, totalPrice, currency, paymentStatus } = req.body;

    // Fetch bundle to build delivery plan
    const bundle = await Bundle.findById(bundleId).populate("menus.menuId");
    if (!bundle) return res.status(404).json({ success: false, message: "Bundle not found" });

    // Build delivery cycles based on bundle menus
    const cycles = bundle.menus.map((b) => ({
      dayIndex: b.dayIndex,
      date: dayjs(startDate).add(b.dayIndex, "day"),
      menuId: b.menuId,
      items: b.items,
      statusHistory: [{ status: "scheduled" }]
    }));

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customerId,
      organizationId,
      branchId,
      bundleId,
      orderType,
      totalPrice,
      currency,
      paymentStatus,
      cycles,
      status: "in_progress"
    });

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order
    });
  } catch (error) {
    next(error);
  }
};


// Get Orders
export const getOrders = async (req, res, next) => {
  try {
    const { customerId } = req.query;

    const query = customerId ? { customerId } : {};
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .populate("bundleId")
      .populate("customerId");

    res.json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};


// Get Order Details by ID
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("bundleId")
      .populate("cycles.menuId")
      .populate("customerId");

    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};


// Update status of a specific delivery cycle
export const updateCycleStatus = async (req, res, next) => {
  try {
    const { error } = updateCycleStatusSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { status, note } = req.body;
    const { orderId, cycleId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    const cycle = order.cycles.id(cycleId);
    if (!cycle) return res.status(404).json({ success: false, message: "Cycle not found" });

    cycle.status = status;
    cycle.statusHistory.push({ status, note });
    await order.save();

    // If all cycles are delivered, mark order complete
    const allDelivered = order.cycles.every(c => c.status === "delivered");
    if (allDelivered) order.status = "completed";

    await order.save();

    res.json({ success: true, message: "Status updated", data: cycle });
  } catch (error) {
    next(error);
  }
};
