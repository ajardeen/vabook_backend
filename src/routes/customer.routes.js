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

} from "../controllers/customer.controller.js";

const router = Router();

router.post("/register", registerCustomer);
router.post("/login", loginCustomer);
router.post("/forgot-password", forgotPassword);
router.get("/:customerId", getCustomerById);
router.get("/address/:customerId/:addressId", getCustomerAddressById)
router.post("/address/:customerId", addCustomerAddress)
router.put("/address/:customerId/:addressId", editCustomerAddress)
router.delete("/address/:customerId/:addressId", deleteCustomerAddress)




export default router;
