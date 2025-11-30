import {
  createOrderSchema,
  updateCycleStatusSchema,
} from "../validations/order.validation.js";
import KitchenTask from "../models/KitchenTask.model.js";
import Bundle from "../models/Bundle.model.js";
import Order from "../models/Order.model.js";
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
      return res
        .status(400)
        .json({ success: false, message: "Order list is empty" });
    }

    const generateOrderNumber = () =>
      "ORD-" + Date.now() + "-" + Math.floor(Math.random() * 9999);

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
      statusHistory: [{ status: "placed" }],
    }));

    const createdOrders = await Order.insertMany(ordersToCreate);

    return res.status(201).json({
      success: true,
      message: "Orders placed successfully",
      count: createdOrders.length,
      data: createdOrders,
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
// Get All Orders by Organization & Branch
export const getOrdersByOrgAndBranch = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const orders = await Order.find({ organizationId, branchId })
      .sort({ createdAt: -1 })
      .populate("bundleId")
      .populate("customerId");

    res.json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
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
    const orders = await Order.find({ organizationId, branchId, customerId });
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

// Get Order Details by ID
export const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("bundleId")
      .populate("cycles.menuId")
      .populate("customerId");

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const approveOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    console.log("orderid", orderId);

    const order = await Order.findById(orderId).populate("customerId");

    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    const bundle = await Bundle.findById(order.bundleId)
      .populate("menus.menuId")
      .populate("menus.items.itemId");

    if (!bundle)
      return res
        .status(404)
        .json({ success: false, message: "Bundle not found" });
    let menusStatus = [];

    for (const m of bundle.menus) {
      const mappedItems = m.items.map((i) => ({
        itemId: i.itemId._id,
        qty: i.qty,
        itemName: i.itemId.name,
        prepTimeMinutes: i.itemId.prepTimeMinutes || 20,
      }));
      const totalPrepTime = mappedItems.reduce(
        (acc, it) => acc + it.prepTimeMinutes * it.qty,
        0
      );

      await KitchenTask.create({
        organizationId: order.organizationId,
        branchId: order.branchId,
        orderId: order._id,
        customerName: order.customerId?.name || "Customer",
        bundleName: order.bundleName,
        deliveryDate: new Date(),
        menuId: m.menuId._id,
        items: mappedItems,
        totalPrepTime,
      });

      menusStatus.push({
        menuId: m.menuId._id,
        menuName: m.menuId.name,
        status: "pending",
        items: mappedItems,
        totalPrepTime,
      });
    }

    order.menusStatus = menusStatus;
    order.status = "processing";
    order.statusHistory.push({ status: "processing" });
    await order.save();

    res.json({
      success: true,
      message: "Order approved and sent to kitchen",
      order,
    });
  } catch (e) {
    // console.log("error", e);

    next(e);
  }
};

// Update status of a specific delivery cycle
export const updateCycleStatus = async (req, res, next) => {
  try {
    const { error } = updateCycleStatusSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });

    const { status, note } = req.body;
    const { orderId, cycleId } = req.params;

    const order = await Order.findById(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    const cycle = order.cycles.id(cycleId);
    if (!cycle)
      return res
        .status(404)
        .json({ success: false, message: "Cycle not found" });

    cycle.status = status;
    cycle.statusHistory.push({ status, note });
    await order.save();

    // If all cycles are delivered, mark order complete
    const allDelivered = order.cycles.every((c) => c.status === "delivered");
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
      status: { $in: ["placed", "processing", "ready"] },
    }).populate("bundleId customerId");

    res.json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};
