import Order from "../models/Order.model.js";
import Bundle from "../models/Bundle.model.js";
import { createOrderSchema, updateCycleStatusSchema } from "../validations/order.validation.js";
import dayjs from "dayjs"; // npm install dayjs

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

// Create Order
export const createOrder = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;
    const orderList = req.body; // array

    if (!Array.isArray(orderList) || orderList.length === 0) {
      return res.status(400).json({ success: false, message: "Order list is empty" });
    }

    const generateOrderNumber = () => "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 9999);

    const ordersToCreate = orderList.map((o) => ({
      orderNumber: generateOrderNumber(),
      customerId: o.customerId,
      organizationId,
      branchId,
      bundleId: o.bundleId,
      bundleName: o.bundleName,
      price: o.price,
      quantity: o.quantity,
      totalPrice: o.price * o.quantity,
      paymentStatus: "pending",
      statusHistory: [{ status: "placed" }]
    }));

    const createdOrders = await Order.insertMany(ordersToCreate);

    return res.status(201).json({
      success: true,
      message: "Orders placed successfully",
      count: createdOrders.length,
      data: createdOrders
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

export const getKitchenOrders = async (req, res, next) => {
  try {
    const { organizationId, branchId } = getIdsFromHeaders(req, res);
    if (!organizationId || !branchId) return;

    const orders = await Order.find({
      organizationId,
      branchId,
      status: { $in: ["placed", "processing", "ready"] }
    }).populate("bundleId customerId");

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};
