import { Router } from "express";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateCycleStatus
} from "../controllers/order.controller.js";

const router = Router();

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.patch("/:orderId/cycle/:cycleId/status", updateCycleStatus);

export default router;
