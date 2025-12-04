import { io } from "../server.js";
import Order from "../models/Order.model.js";
import KitchenTask from "../models/KitchenTask.model.js";
import { updateKitchenStatusSchema } from "../validations/kitchen.validation.js";
import dayjs from "dayjs";


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

// Get Kitchen Tasks for Today
export const getKitchenTasks = async (req, res, next) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;

    if (!branchId || !organizationId)
      return res.status(400).json({
        success: false,
        message: "branchId and organizationId required",
      });

    const start = dayjs().startOf("day").toDate();
    const end = dayjs().endOf("day").toDate();

    const tasks = await KitchenTask.find({
      branchId,
      organizationId,
      // deliveryDate: { $gte: start, $lte: end },
    }).populate("menuId");
    

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};

// Update Kitchen Task Status

export const updateKitchenStatus = async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await KitchenTask.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    task.status = status;
    await task.save();

    const order = await Order.findById(task.orderId);
    if (order) {
      const menu = order.menusStatus.find(
        m => m.menuId.toString() === task.menuId.toString()
      );
      if (menu) menu.status = status;

      // ✅ when all kitchen tasks done -> READY (not delivered)
      const allFinished = order.menusStatus.every(m => m.status === "completed");
      if (allFinished) {
        order.status = "ready";
        order.statusHistory.push({ status: "ready", note: "Order prepared by kitchen" });

        // mark ready for pickup in delivery
        if (!order.delivery) order.delivery = {};
        order.delivery.deliveryStatus = "ready_for_pickup";
        order.delivery.deliveryStatusHistory.push({
          status: "ready_for_pickup",
          note: "Order is ready for pickup by rider",
        });
      }

      await order.save();
    }

    io.emit("kitchen:update", {
      taskId,
      status,
      orderId: task.orderId,
      menuId: task.menuId,
    });

    res.json({ success: true, message: "Kitchen status updated", data: task });
  } catch (error) {
    next(error);
  }
};
