// routes/subscription.routes.js
import express from "express";
import {
  createSubscription,
  approveSubscription,
  getCustomerSubscriptions,
  getPendingSubscriptions,
} from "../controllers/subscription.controller.js";

const router = express.Router();

router.post("/", createSubscription);
router.post("/:id/approve", approveSubscription);
router.get("/customer/:customerId", getCustomerSubscriptions);
router.get("/admin/pending",getPendingSubscriptions)

export default router;
