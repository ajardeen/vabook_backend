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
import authMiddleware from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = Router();

// router.post("/", createOrder);
// router.get("/", getOrders);
// router.get("/by-org-branch", getOrdersByOrgAndBranch);
// router.get("/:id", getOrderById);
router.get(
  "/customer/:customerId",
  authMiddleware,
  allowRoles("admin", "customer", "rider"),
  getOrdersByCustomerId,
);
// router.patch("/:orderId/cycle/:cycleId/status", updateCycleStatus);
// router.put("/approve/:orderId", approveOrder);

router.get(
  "/rider/jobs",
  authMiddleware,
  allowRoles("admin", "rider"),
  getRiderJobsForToday,
);
router.get(
  "/rider/task/:taskId",
  authMiddleware,
  allowRoles("admin", "rider"),
  getRiderOrderDetail,
);
router.post(
  "/:taskId/rider/job/update",
  authMiddleware,
  allowRoles("admin", "rider"),
  updateDeliveryStatus,
);
export default router;
