import { Router } from "express";
import {
  // createOrder,
  // getOrders,
  // getOrderById,
  // updateCycleStatus,
  // getOrdersByOrgAndBranch,
  // approveOrder,
  getOrdersByCustomerId,
  getRiderJobsForToday,
  updateDeliveryStatus,
  getRiderOrderDetail,
} from "../controllers/order.controller.js";

const router = Router();


// router.post("/", createOrder);
// router.get("/", getOrders);
// router.get("/by-org-branch", getOrdersByOrgAndBranch);
// router.get("/:id", getOrderById);
router.get("/customer/:customerId", getOrdersByCustomerId);
// router.patch("/:orderId/cycle/:cycleId/status", updateCycleStatus);
// router.put("/approve/:orderId", approveOrder);

router.get("/rider/jobs", getRiderJobsForToday);
router.get("/rider/task/:taskId", getRiderOrderDetail);
router.post("/:taskId/rider/job/update",updateDeliveryStatus)
export default router;
