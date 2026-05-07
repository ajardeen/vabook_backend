import StaffAccount from "../models/StaffAccount.model.js";
import bcrypt from "bcryptjs";

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

// ✅ Get all staff (Scoped to Org & Branch)
export const getAllStaff = async (req, res) => {
  try {
    const context = getIdsFromHeaders(req, res);
    if (context.error) return;

    const { organizationId, branchId } = context;
    
    const staff = await StaffAccount.find({ organizationId, branchId })
      .select("-password") // Good practice to exclude password
      .sort({ createdAt: -1 });
      
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Create new staff (Scoped check for existing email)
export const createStaff = async (req, res) => {
  const context = getIdsFromHeaders(req, res);
  if (context.error) return;

  const { organizationId, branchId } = context;
  try {
    const { email, password } = req.body;

    const existingEmail = await StaffAccount.findOne({
      organizationId,
      branchId,
      email,
    });
    
    if (existingEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists in this branch" });
    }

    const staff = await StaffAccount.create({
      ...req.body,
      organizationId,
      branchId,
      password: password,
    });

    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update staff (Must match ID, Org, and Branch)
// ✅ Update staff (Triggers the Pre-Save Hook for Password Hashing)
export const updateStaff = async (req, res) => {
  const context = getIdsFromHeaders(req, res);
  if (context.error) return;

  const { organizationId, branchId } = context;
  try {
    const { id } = req.params;

    // 1. Find the document first
    const staff = await StaffAccount.findOne({ _id: id, organizationId, branchId });

    if (!staff) {
      return res
        .status(404)
        .json({ success: false, message: "Staff not found in this branch" });
    }

    // 2. Update the fields manually from req.body
    // This allows the .isModified('password') check in your schema to work
    Object.keys(req.body).forEach((key) => {
      staff[key] = req.body[key];
    });

    // 3. Save the document (This triggers the StaffAccountSchema.pre("save") hook)
    await staff.save();

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// ✅ Suspend staff (Must match ID, Org, and Branch)
export const suspendStaff = async (req, res) => {
  const context = getIdsFromHeaders(req, res);
  if (context.error) return;

  const { organizationId, branchId } = context;
  try {
    const { id } = req.params;
    
    const staff = await StaffAccount.findOne({ _id: id, organizationId, branchId });
    
    if (!staff)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found in this branch" });

    staff.status = staff.status === "suspended" ? "active" : "suspended";
    await staff.save();

    res
      .status(200)
      .json({ success: true, message: "Staff status updated", data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete staff (Must match ID, Org, and Branch)
export const deleteStaff = async (req, res) => {
  const context = getIdsFromHeaders(req, res);
  if (context.error) return;

  const { organizationId, branchId } = context;
  try {
    const { id } = req.params;
    
    const staff = await StaffAccount.findOneAndDelete({
      _id: id,
      organizationId,
      branchId,
    });

    if (!staff)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found or access denied" });

    res.status(200).json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};