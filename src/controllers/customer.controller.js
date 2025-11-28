import Customer from "../models/Customer.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  registerCustomerSchema,
  loginCustomerSchema,
  forgotPasswordSchema,
} from "../validations/customer.validation.js";

const getIdsFromHeaders = (req, res) => {
  const organizationId = req.headers["x-organization-id"];
  const branchId = req.headers["x-branch-id"];

  if (!organizationId || !branchId) {
    res.status(400).json({
      success: false,
      message: "Organization ID and Branch ID are required in headers",
    });
    return { error: true };
  }
  return { organizationId, branchId };
};

// REGISTER
export const registerCustomer = async (req, res, next) => {
  console.log("req.body regi", req.body);
  try {
    const { error } = registerCustomerSchema.validate(req.body);
    if (error)
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });
    const context = getIdsFromHeaders(req, res);

    if (context.error) return;

    const { organizationId, branchId } = context;

    const { fullName, phone, email, password } = req.body;

    const existing = await Customer.findOne({ email, organizationId });
    if (existing)
      return res
        .status(400)
        .json({ success: false, message: "Customer already exists" });

    const hashed = await bcrypt.hash(password, 10);

    const customer = await Customer.create({
      fullName,
      phone,
      email,
      password: hashed,
      organizationId,
      branchId,
    });

    res.status(201).json({
      success: true,
      message: "Customer registered successfully",
      data: customer,
    });
  } catch (err) {
    next(err);
  }
};

// LOGIN
export const loginCustomer = async (req, res, next) => {
  console.log("req.body", req.body);
  try {
    const { error } = loginCustomerSchema.validate(req.body);
    const context = getIdsFromHeaders(req, res);
    console.log("context", context);

    if (context.error) return;

    const { organizationId, branchId } = context;
    if (error)
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });

    const { email, password } = req.body;

    const customer = await Customer.findOne({
      organizationId,
      branchId,
      email,
    });
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    const valid = await bcrypt.compare(password, customer.password);
    if (!valid)
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: customer._id,
        organizationId: customer.organizationId,
        branchId: customer.branchId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    const structuredCustomer = {
      _id: customer._id,
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone,
      status: customer.status,
      deliveryAddress: customer.deliveryAddress,
    };

    res.json({
      success: true,
      message: "Login successful",
      token,
      customer:structuredCustomer,
    });
  } catch (err) {
    next(err);
  }
};

// FORGOT PASSWORD — generates OTP
export const forgotPassword = async (req, res, next) => {
  console.log("req.body", req.body);
  try {
    const { error } = forgotPasswordSchema.validate(req.body);
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;
    if (error)
      return res
        .status(400)
        .json({ success: false, message: error.details[0].message });

    const { email } = req.body;

    const customer = await Customer.findOne({
      organizationId,
      branchId,
      email,
    });
    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    customer.otpCode = otp;
    customer.otpExpireAt = Date.now() + 10 * 60 * 1000; // 10 mins
    await customer.save();

    res.json({
      success: true,
      message: "OTP sent to email (next step: verify and reset)",
      otp, // (for now show otp, later integrate email)
      customerId: customer._id,
    });
  } catch (err) {
    next(err);
  }
};
