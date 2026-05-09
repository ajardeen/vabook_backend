// routes/subscription.routes.js
import express from "express";
import {
  createSubscription,
  approveSubscription,
  getCustomerSubscriptions,
  getPendingSubscriptions,
  getSubscriptionById,
} from "../controllers/subscription.controller.js";
import authMiddleware from "../middleware/authMiddleware.js";
import allowRoles from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  allowRoles("admin", "customer"),
  createSubscription,
);
router.post(
  "/:id/approve",
  authMiddleware,
  allowRoles("admin"),
  approveSubscription,
);
router.get(
  "/customer/:customerId",
  authMiddleware,
  allowRoles("admin", "customer"),
  getCustomerSubscriptions,
);
// GET /subscriptions/:id/customer/:customerId
router.get(
  "/:id/customer/:customerId",
  authMiddleware,
  allowRoles("admin", "customer"),
  getSubscriptionById,
);
router.get(
  "/admin/pending",
  authMiddleware,
  allowRoles("admin", "customer"),
  getPendingSubscriptions,
);

export default router;
