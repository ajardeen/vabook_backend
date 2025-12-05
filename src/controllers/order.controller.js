import {
  createOrderSchema,
  updateCycleStatusSchema,
} from "../validations/order.validation.js";
import KitchenTask from "../models/KitchenTask.model.js";
import Bundle from "../models/Bundle.model.js";
import Order from "../models/Order.model.js";
import Customer from "../models/Customer.model.js";
import StaffAccount from "../models/StaffAccount.model.js";
import dayjs from "dayjs";
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

    console.log("received order", req.body);

    const ordersToCreate = [];

    for (const o of orderList) {
      if (!o.deliveryAddressId) {
        return res.status(400).json({
          success: false,
          message: "deliveryAddressId is required for each order item",
        });
      }

      // 1) Load customer with delivery addresses
      const customer = await Customer.findById(o.customerId).select(
        "deliveryAddress"
      );

      if (!customer) {
        return res.status(404).json({
          success: false,
          message: "Customer not found",
        });
      }

      // 2) Find specific address subdocument by id
      const address = customer.deliveryAddress.id(o.deliveryAddressId);

      if (!address) {
        return res.status(404).json({
          success: false,
          message: "Delivery address not found for given deliveryAddressId",
        });
      }

      // 3) Format delivery address string
      const formattedAddress = [
        address.label,
        address.street1,
        address.street2,
        address.city,
        address.state,
        address.pinCode,
        address.country,
      ]
        .filter(Boolean)
        .join(", ");

      // 4) Build delivery payload
      const deliveryPayload = {
        deliveryAddress: formattedAddress,
        deliveryLocation:
          address.latitude != null && address.longitude != null
            ? {
                lat: address.latitude,
                lng: address.longitude,
              }
            : null,
        expectedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000),
        deliveryStatus: "pending",
        deliveryStatusHistory: [
          { status: "pending", note: "Order created, waiting for approval" },
        ],
      };

      ordersToCreate.push({
        orderNumber: generateOrderNumber(),
        customerId: o.customerId,
        organizationId,
        branchId,
        bundleId: o.bundleId,
        bundleName: o.bundleName,
        price: o.price,
        quantity: o.quantity,
        totalPrice: o.price * o.quantity,

        // Payment
        paymentStatus: "pending",
        paymentMethod: o.paymentMethod || "gpay",

        // Main status
        status: "placed",
        deliveryStartDate: new Date(),

        // Delivery object
        delivery: deliveryPayload,

        statusHistory: [
          {
            status: "placed",
            note: `Order placed via app. Payment method: ${
              o.paymentMethod || "gpay"
            }`,
          },
        ],
      });
    }

    const createdOrders = await Order.insertMany(ordersToCreate);

    return res.status(201).json({
      success: true,
      message: "Orders placed successfully",
      count: createdOrders.length,
      data: createdOrders,
    });
  } catch (error) {
    console.log("error", error.message);

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

    if (!order.deliveryStartDate) {
      order.deliveryStartDate = new Date(); // ⭐ Start from today
      order.statusHistory.push({
        status: "processing",
        note: "Delivery started",
      });
    }

    const bundle = await Bundle.findById(order.bundleId)
      .populate("menus.menuId")
      .populate("menus.items.itemId");

    if (!bundle)
      return res
        .status(404)
        .json({ success: false, message: "Bundle not found" });

    let menusStatus = [];
    const cycleCount = bundle.bundleType === "weekly" ? bundle.repeatWeeks : 1;

    for (let cycle = 0; cycle < cycleCount; cycle++) {
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
        let scheduledDaysPassed;

        if (bundle.bundleType === "weekly") {
          scheduledDaysPassed = cycle * 7 + m.dayIndex;
        } else {
          scheduledDaysPassed = m.dayIndex;
        }

        const deliveryDate = dayjs(order.deliveryStartDate)
          .add(scheduledDaysPassed, "day")
          .toDate();

        await KitchenTask.create({
          organizationId: order.organizationId,
          branchId: order.branchId,
          orderId: order._id,
          customerName: order.customerId?.fullName || "Customer",
          bundleName: order.bundleName,
          deliveryDate: deliveryDate,
          menuId: m.menuId._id,
          items: mappedItems,
          totalPrepTime,
          cycleIndex: cycle, // ⭐ optional tracking (Week number)
          dayIndex: m.dayIndex, // ⭐ exact day inside the week
        });

        menusStatus.push({
          menuId: m.menuId._id,
          menuName: m.menuId.name,
          status: "pending",
          items: mappedItems,
          totalPrepTime,
          cycleIndex: cycle,
          dayIndex: m.dayIndex,
        });
      }
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

// delivery related api controllers
export const getRiderJobsForToday = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;
    const { organizationId, branchId } = context;

    const start = dayjs().startOf("day").toDate();
    const end = dayjs().endOf("day").toDate();

    // all menus ready to go for today
    const tasks = await KitchenTask.find({
      organizationId,
      branchId,
      status: "completed",
      // deliveryDate: { $gte: start, $lte: end },
    })
      .populate("menuId")
      .populate({
        path: "orderId",
        populate: {
          path: "customerId",
          select: "fullName phone email deliveryAddress", // pick only needed fields
        },
      });

    // shape data for rider
    const jobs = tasks.map((t) => ({
      taskId: t._id,
      menuId: t.menuId._id,
      orderId: t.orderId._id,
      orderNumber: t.orderId.orderNumber,
      menuName: t.menuId.name,
      deliveryStatus: t.orderId.delivery?.deliveryStatus || "pending",
      deliveryAddress: t.orderId.delivery?.deliveryAddress,
    }));

    return res.json({ success: true, count: jobs.length, data: jobs });
  } catch (err) {
    next(err);
  }
};

// GET /rider/task/:taskId
export const getRiderOrderDetail = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;
    const { organizationId, branchId } = context;
    const { taskId } = req.params;

    const task = await KitchenTask.findOne({
      _id: taskId,
      organizationId,
      branchId,
    })
      .populate("menuId")
      .populate({
        path: "orderId",
        populate: {
          path: "customerId",
          select: "fullName phone email",
        },
      });

    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    const order = task.orderId;

    return res.json({
      success: true,
      data: {
        taskId,
        orderId: order._id,
        orderNumber: order.orderNumber,
        bundleName: order.bundleName,
        menuName: task.menuId?.name,
        quantity: order.quantity,
        price: order.price,
        deliveryStatus: order.delivery.deliveryStatus,
        deliveryAddress: order.delivery.deliveryAddress,
        deliveryLocation: order.delivery.deliveryLocation,
        customer: {
          name: order.customerId.fullName,
          phone: order.customerId.phone,
          email: order.customerId.email,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};


// POST /api/orders/:orderId/delivery-status
// body: { action: "accept" | "pickup" | "on_the_way" | "delivered" }

export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { action, riderId } = req.body;

    const task = await KitchenTask.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // find order
    const order = await Order.findById(task.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    let newStatus;
    let note = "";

    // ───────────────────────────────
    // 1️⃣ ACCEPT → assign rider
    // ───────────────────────────────
    if (action === "accept") {
      if (!riderId) {
        return res.status(400).json({
          success: false,
          message: "riderId required when accepting order",
        });
      }

      const rider = await StaffAccount.findOne({
        _id: riderId,
        status: "active",
        role: "rider",
      });

      if (!rider) {
        return res.status(400).json({
          success: false,
          message: "Invalid rider id",
        });
      }

      newStatus = "assigned";
      order.delivery.riderId = rider._id;
      order.delivery.riderName = rider.name;
      order.delivery.contactNumber = rider.phone;
      note = "Rider accepted delivery";
    }

    // ───────────────────────────────
    // 2️⃣ PICKUP
    // ───────────────────────────────
    else if (action === "pickup") {
      newStatus = "picked_up";
      order.status = "out_for_delivery";
      note = "Order picked up by rider";
    }

    // ───────────────────────────────
    // 3️⃣ ON THE WAY
    // ───────────────────────────────
    else if (action === "on_the_way") {
      newStatus = "en_route";
      order.status = "out_for_delivery";
      note = "Order is on the way";
    }

    // ───────────────────────────────
    // 4️⃣ DELIVERED
    // ───────────────────────────────
    else if (action === "delivered") {
      newStatus = "delivered";
      order.status = "delivered";
      order.delivery.deliveredAt = new Date();
      note = "Order delivered to customer";
    }

    // ───────────────────────────────
    else {
      return res.status(400).json({ success: false, message: "Invalid action" });
    }

    // ───────────────────────────────
    // Update order delivery status
    // ───────────────────────────────
    order.delivery.deliveryStatus = newStatus;
    order.delivery.deliveryStatusHistory.push({
      status: newStatus,
      note,
    });

    // ───────────────────────────────
    // Update ONLY this menu's status inside order
    // ───────────────────────────────
    const menu = order.menusStatus.find(
      (m) => m.menuId.toString() === task.menuId.toString()
    );
    if (menu) {
      // only this task's menu status
      menu.status = action === "delivered" ? "completed" : menu.status;
    }

    await order.save();
    await task.save();

    return res.json({
      success: true,
      message: `Delivery status updated to ${newStatus}`,
      data: { taskId, orderId: order._id, status: newStatus },
    });
  } catch (err) {
    next(err);
  }
};
