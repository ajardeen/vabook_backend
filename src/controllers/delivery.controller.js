import Order from "../models/Order.model.js";

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
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    const { orderId } = req.params;
    const { riderId, riderName, contactNumber } = req.body;

    const order = await Order.findById({ organizationId, branchId, orderId });
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    order.delivery = order.delivery || {};

    order.delivery.riderId = riderId;
    order.delivery.riderName = riderName;
    order.delivery.contactNumber = contactNumber;

    order.delivery.deliveryStatus = "assigned";
    order.delivery.deliveryStatusHistory.push({
      status: "assigned",
      note: `Rider assigned: ${riderName}`,
    });

    await order.save();

    io.emit("delivery:update", {
      orderId,
      deliveryStatus: order.delivery.deliveryStatus,
    });

    res.json({ success: true, message: "Rider assigned", data: order });
  } catch (error) {
    next(error);
  }
};

export const updateDeliveryStatus = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;
    const { orderId } = req.params;
    const { status, note } = req.body; // status in ["picked_up","en_route","arriving","delivered","failed","returned"]

    const order = await Order.findById({organizationId, branchId, orderId});
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    if (!order.delivery) order.delivery = {};

    // update delivery internal status
    order.delivery.deliveryStatus = status;
    order.delivery.deliveryStatusHistory.push({
      status,
      note: note || "",
    });

    // sync main order.status for major milestones
    if (
      status === "picked_up" ||
      status === "en_route" ||
      status === "arriving"
    ) {
      order.status = "out_for_delivery";
      order.statusHistory.push({
        status: "out_for_delivery",
        note: "Rider is on the way",
      });
    }

    if (status === "delivered") {
      order.status = "delivered";
      order.statusHistory.push({
        status: "delivered",
        note: "Order delivered to customer",
      });
      order.delivery.deliveredAt = new Date();
    }

    if (status === "failed" || status === "returned") {
      order.status = "cancelled";
      order.statusHistory.push({
        status: "cancelled",
        note: note || "Delivery failed/returned",
      });
    }

    await order.save();

    io.emit("delivery:update", {
      orderId,
      deliveryStatus: status,
    });

    res.json({
      success: true,
      message: "Delivery status updated",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export const updateDeliveryLocation = async (req, res, next) => {
  try {
       const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;
    const { orderId } = req.params;
    const { lat, lng } = req.body;

    const order = await Order.findById(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    if (!order.delivery) order.delivery = {};

    order.delivery.liveTracking.push({ lat, lng });

    await order.save();

    io.emit("delivery:location", {
      orderId,
      lat,
      lng,
    });

    res.json({ success: true, message: "Location updated" });
  } catch (error) {
    next(error);
  }
};
