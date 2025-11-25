import jwt from "jsonwebtoken";
import Account from "../models/Account.model.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.account = await Account.findById(decoded.id).select("-password");

    if (!req.account) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
