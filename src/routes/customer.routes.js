import { Router } from "express";
import {
  registerCustomer,
  loginCustomer,
  forgotPassword,
  addCustomerAddress,
  editCustomerAddress,
  deleteCustomerAddress,
  getCustomerById,
  getCustomerAddressById,
  verifyCustomerOtp,
  resendCustomerOtp,
} from "../controllers/customer.controller.js";
import allowRoles from "../middleware/roleMiddleware.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = Router();

router.post("/register", registerCustomer);
router.post("/login", loginCustomer);
router.post("/verify-otp", verifyCustomerOtp);
router.post("/resend-otp", resendCustomerOtp);
router.post("/forgot-password", forgotPassword);
router.get(
  "/:customerId",
  authMiddleware,
  allowRoles("customer"),
  getCustomerById,
);
router.get(
  "/address/:customerId/:addressId",
  authMiddleware,
  allowRoles("customer"),
  getCustomerAddressById,
);
router.post(
  "/address/:customerId",
  authMiddleware,
  allowRoles("customer"),
  addCustomerAddress,
);
router.put(
  "/address/:customerId/:addressId",
  authMiddleware,
  allowRoles("customer"),
  editCustomerAddress,
);
router.delete(
  "/address/:customerId/:addressId",
  authMiddleware,
  allowRoles("customer"),
  deleteCustomerAddress,
);

export default router;
