import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateCycleStatus,
  getOrdersByOrgAndBranch,
  approveOrder,
  getOrdersByCustomerId,
} from "../controllers/order.controller.js";
import {
  assignRider,
  updateDeliveryLocation,
  updateDeliveryStatus,
} from "../controllers/delivery.controller.js";

const router = Router();
// // delivery routes (still under /orders)
// router.patch("/:orderId/delivery/assign", assignRider);
// router.patch("/:orderId/delivery/status", updateDeliveryStatus);
// router.patch("/:orderId/delivery/location", updateDeliveryLocation);

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/by-org-branch", getOrdersByOrgAndBranch);
router.get("/:id", getOrderById);
router.get("/customer/:customerId", getOrdersByCustomerId);
router.patch("/:orderId/cycle/:cycleId/status", updateCycleStatus);
router.put("/approve/:orderId", approveOrder);


export default router;
