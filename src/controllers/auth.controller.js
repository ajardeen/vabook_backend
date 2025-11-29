import Account from "../models/Account.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt.js";


// SIGNUP
export const signup = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if email exists
    const existing = await Account.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already in use" });
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
    const { email, password,role } = req.body;

    const account = await Account.findOne({ email });

    if (!account) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, account.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid email or password" });
    }

    if(account.role!==role){
      return res.status(400).json({ success: false, message: "Invalid role for this account" });
    }

    res.json({
      success: true,
      message: "Login successful",
      data: {
        account,
        token: generateToken(account)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
    next(error);
  }
};
