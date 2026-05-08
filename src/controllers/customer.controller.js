import Customer from "../models/Customer.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  registerCustomerSchema,
  loginCustomerSchema,
  forgotPasswordSchema,
} from "../validations/customer.validation.js";
import {generateOtp} from "../utils/generateOtp.js";
import { sendOtpMail } from "../utils/sendOtpMail.js";

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
  try {
    const { error } = registerCustomerSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;
    const { fullName, phone, email, password } = req.body;

    const existing = await Customer.findOne({ email, organizationId });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Customer already exists",
      });
    }

    const hashed = await bcrypt.hash(password, 10);
    const otp = generateOtp();
    // local server it works
    // ⚠️ Email disabled — free hosting blocks SMTP outbound
    // await sendOtpMail({ email, otp, name: fullName });

    const customer = await Customer.create({
      fullName,
      phone,
      email,
      password: hashed,
      organizationId,
      branchId,
      otpCode: otp,
      otpExpireAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    res.status(201).json({
      success: true,
      message: "OTP sent to your email (demo: email disabled on free hosting)",
      data: {
        userId: customer._id,
        email: customer.email,
        otp, // ⚠️ Remove this in production
      },
    });
  } catch (err) {
    console.log(err.message);
    next(err);
  }
};

// LOGIN
export const loginCustomer = async (req, res, next) => {
  try {
    const { error } = loginCustomerSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;
    const { email, password } = req.body;

    const customer = await Customer.findOne({ organizationId, branchId, email });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const valid = await bcrypt.compare(password, customer.password);

    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const otp = generateOtp();

    customer.otpCode = otp;
    customer.otpExpireAt = new Date(Date.now() + 5 * 60 * 1000);
    await customer.save();

    // ⚠️ Email disabled — free hosting blocks SMTP outbound
    // await sendOtpMail({ email, otp, name: customer.fullName });

    res.json({
      success: true,
      message: "OTP sent to your email (demo: email disabled on free hosting)",
      data: {
        userId: customer._id,
        email: customer.email,
        otp, // ⚠️ Remove this in production
      },
    });
  } catch (err) {
    next(err);
  }
};


export const verifyCustomerOtp = async (
  req,
  res,
  next
) => {
  try {
    const { email, otp } = req.body;

    const context = getIdsFromHeaders(req, res);

    if (context.error) return;

    const { organizationId, branchId } =
      context;

    const customer =
      await Customer.findOne({
        email,
        organizationId,
        branchId,
      });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    if (
      !customer.otpCode ||
      customer.otpCode !== otp
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    if (
      customer.otpExpireAt < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    customer.otpCode = null;
    customer.otpExpireAt = null;

    await customer.save();

    const token = jwt.sign(
      {
        id: customer._id,
        organizationId:
          customer.organizationId,
        branchId: customer.branchId,
      },

      process.env.JWT_SECRET,

      {
        expiresIn: "7d",
      }
    );

    res.json({
      success: true,

      message:
        "OTP verified successfully",

      data: {
        token,

        customer: {
          _id: customer._id,
          fullName: customer.fullName,
          email: customer.email,
          phone: customer.phone,
          status: customer.status,
          deliveryAddress:
            customer.deliveryAddress,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const resendCustomerOtp = async (
  req,
  res,
  next
) => {
  try {
    const { email } = req.body;

    const context = getIdsFromHeaders(req, res);

    if (context.error) return;

    const { organizationId, branchId } =
      context;

    const customer =
      await Customer.findOne({
        email,
        organizationId,
        branchId,
      });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    const otp = generateOtp();

    customer.otpCode = otp;

    customer.otpExpireAt =
      new Date(Date.now() + 5 * 60 * 1000);

    await customer.save();

    await sendOtpMail({
      email,
      otp,
      name: customer.fullName,
    });

    res.json({
      success: true,
      message: "OTP resent successfully",
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


export const getCustomerById = async (req, res, next) => {
  try {
    const { customerId } = req.params;
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const customer = await Customer.findOne({
      _id: customerId,
      organizationId: context.organizationId,
      branchId: context.branchId,
    });

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    res.json({
      success: true,
      customer,
    });
  } catch (err) {
    next(err);
  }
};



export const addCustomerAddress = async (req, res, next) => {
  try {
    const { customerId } = req.params;

    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const customer = await Customer.findOne({
      _id: customerId,
      organizationId: context.organizationId,
      branchId: context.branchId,
    });

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    const newAddress = req.body;

    // If new address has isDefault = true, then remove default from others.
    if (newAddress.isDefault) {
      customer.deliveryAddress.forEach((a) => (a.isDefault = false));
    }

    customer.deliveryAddress.push(newAddress);
    await customer.save();

    return res.status(201).json({
      success: true,
      message: "Address added successfully",
      deliveryAddress: customer.deliveryAddress,
    });
  } catch (err) {
    next(err);
  }
};
export const getCustomerAddressById = async (req, res, next) => {
  try {
    const { customerId, addressId } = req.params;
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const customer = await Customer.findOne({
      _id: customerId,
      organizationId: context.organizationId,
      branchId: context.branchId,
    });

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    const address = customer.deliveryAddress.id(addressId);
    if (!address)
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });

    return res.json({
      success: true,
      address,
    });
  } catch (err) {
    next(err);
  }
};
export const editCustomerAddress = async (req, res, next) => {
  try {
    const { customerId, addressId } = req.params;
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const customer = await Customer.findOne({
      _id: customerId,
      organizationId: context.organizationId,
      branchId: context.branchId,
    });

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    const updateData = req.body;

    // If edited address isDefault → make others false
    if (updateData.isDefault) {
      customer.deliveryAddress.forEach((a) => (a.isDefault = false));
    }

    const index = customer.deliveryAddress.findIndex(
      (a) => a._id.toString() === addressId
    );
    if (index === -1)
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });

    customer.deliveryAddress[index] = {
      ...customer.deliveryAddress[index],
      ...updateData,
    };

    await customer.save();

    return res.json({
      success: true,
      message: "Address updated successfully",
      deliveryAddress: customer.deliveryAddress,
    });
  } catch (err) {
    next(err);
  }
};
export const deleteCustomerAddress = async (req, res, next) => {
  try {
    const { customerId, addressId } = req.params;
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const customer = await Customer.findOne({
      _id: customerId,
      organizationId: context.organizationId,
      branchId: context.branchId,
    });

    if (!customer)
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });

    const address = customer.deliveryAddress.id(addressId);
    if (!address)
      return res
        .status(404)
        .json({ success: false, message: "Address not found" });

    address.deleteOne(); // remove from array
    if (
      !customer.deliveryAddress.some((a) => a.isDefault) &&
      customer.deliveryAddress.length > 0
    ) {
      customer.deliveryAddress[0].isDefault = true;
    }

    await customer.save();

    return res.json({
      success: true,
      message: "Address deleted successfully",
      deliveryAddress: customer.deliveryAddress,
    });
  } catch (err) {
    next(err);
  }
};
