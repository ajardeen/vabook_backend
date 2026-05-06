import Account from "../models/Account.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";
import StaffAccountModel from "../models/StaffAccount.model.js";


// SIGNUP
export const signup = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if email exists
    const existing = await Account.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ success: false, message: "Email already in use" });
    }

    // Create account
    const account = await Account.create({ name, email, phone, password });

    res.status(201).json({
      success: true,
      message: "Account created successfully",
    });
  } catch (error) {
    next(error);
  }
};

// LOGIN
export const login = async (req, res, next) => {
  try {
    // Destructure accountId (organization ID) from the body
    const { email, password, role, organizationId } = req.body;

    let user;

    // --- 1. ADMIN LOGIC ---
    if (role === "admin") {
      user = await Account.findOne({ email });
    } 
    // --- 2. STAFF / CHEF / RIDER LOGIC ---
    else {
      // Validate that accountId was provided for non-admin roles
      if (!organizationId) {
        return res.status(400).json({ 
          success: false, 
          message: "Organization selection is required for this role." 
        });
      }
      // console.log( email, password, role, organizationId);
      
      // Query includes organizationId to ensure the staff belongs to the selected org
      user = await StaffAccountModel.findOne({ 
        email, 
        role, 
        organizationId: organizationId // Ensure they belong to the selected org
      }).populate("organizationId branchId");
    }

    // --- 3. VALIDATION ---
    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid email, password, or organization" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    // Double check role matching
    if (user.role !== role) {
      return res.status(400).json({ success: false, message: "Unauthorized role" });
    }

    // --- 4. RESPONSE PAYLOAD ---
    const accountPayload = {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      // Use optional chaining to handle both populated and unpopulated cases
      organizationId: user.organizationId?._id || user.organizationId || null,
      branchId: user.branchId?._id || user.branchId || null,
    };

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token: generateToken(user),
        account: accountPayload,
        // Optional: send back the full organization details if needed by frontend
        organization: role !== "admin" ? user.organizationId : null 
      },
    });
  } catch (error) {
    next(error);
  }
};

// try {
//     const { email, password, role } = req.body;

//     const account = await Account.findOne({ email });

//     if (!account) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid email or password" });
//     }

//     const isMatch = await bcrypt.compare(password, account.password);

//     if (!isMatch) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid email or password" });
//     }

//     if (account.role !== role) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid role for this account" });
//     }

//     res.json({
//       success: true,
//       message: "Login successful",
//       data: {
//         account,
//         token: generateToken(account),
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//     next(error);
//   }