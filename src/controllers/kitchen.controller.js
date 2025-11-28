import KitchenTask from "../models/KitchenTask.model.js";
import { updateKitchenStatusSchema } from "../validations/kitchen.validation.js";
import dayjs from "dayjs";

// Get Kitchen Tasks for Today
export const getKitchenTasks = async (req, res, next) => {
  try {
    const { branchId, organizationId } = req.query;

    if (!branchId || !organizationId)
      return res.status(400).json({
        success: false,
        message: "branchId and organizationId required"
      });

    const start = dayjs().startOf("day").toDate();
    const end = dayjs().endOf("day").toDate();

    const tasks = await KitchenTask.find({
      branchId,
      organizationId,
      deliveryDate: { $gte: start, $lte: end }
    })
      .populate("menuId")
      .sort({
        status: {
          $function: {
            body: `function(status) {
                const weight = { pending: 1, cooking: 2, ready: 3, completed: 4, cancelled: 5 };
                return weight[status] || 6;
            }`,
            args: ["$status"],
            lang: "js"
          }
        },
        createdAt: 1
      });

    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};


// Update Kitchen Task Status
export const updateKitchenStatus = async (req, res, next) => {
  try {
    const { error } = updateKitchenStatusSchema.validate(req.body);
    if (error) return res.status(400).json({ success: false, message: error.details[0].message });

    const { taskId } = req.params;
    const { status, notes } = req.body;

    const task = await KitchenTask.findById(taskId);
    if (!task) return res.status(404).json({ success: false, message: "Kitchen task not found" });

    task.status = status;
    if (notes) task.notes = notes;

    await task.save();

    res.json({
      success: true,
      message: "Kitchen status updated",
      data: task
    });
  } catch (error) {
    next(error);
  }
};
