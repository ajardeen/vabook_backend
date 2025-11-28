import { Router } from "express";
import {
  registerCustomer,
  loginCustomer,
  forgotPassword,
} from "../controllers/customer.controller.js";

const router = Router();

router.post("/register", registerCustomer);
router.post("/login", loginCustomer);
router.post("/forgot-password", forgotPassword);

export default router;
