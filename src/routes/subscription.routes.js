// routes/subscription.routes.js
import express from "express";
import {
  createSubscription,
  approveSubscription,
  getCustomerSubscriptions,
  getPendingSubscriptions,
  getSubscriptionById,
} from "../controllers/subscription.controller.js";

const router = express.Router();

router.post("/", createSubscription);
router.post("/:id/approve", approveSubscription);
router.get("/customer/:customerId", getCustomerSubscriptions);
// GET /subscriptions/:id/customer/:customerId
router.get("/:id/customer/:customerId", getSubscriptionById);
router.get("/admin/pending",getPendingSubscriptions)

export default router;
