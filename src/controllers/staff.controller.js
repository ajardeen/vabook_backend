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
// ✅ Get all staff
export const getAllStaff = async (req, res) => {
  try {
    // Exclude password from the result
    const staff = await StaffAccount.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Create new staff
export const createStaff = async (req, res) => {
  const context = getIdsFromHeaders(req, res);
  if (context.error) return;

  const { organizationId, branchId } = context;
  try {
    const { email, phone, password } = req.body;

    const existingEmail = await StaffAccount.findOne({
      organizationId,
      branchId,
      email,
    });
    if (existingEmail) {
      return res
        .status(400)
        .json({ success: false, message: "Email already exists" });
    }
   
    const staff = await StaffAccount.create({
      ...req.body,
      organizationId,
      branchId,
      password: password,
    });

    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    console.log("error", error);

    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update staff
export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await StaffAccount.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (!staff)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });

    res.status(200).json({ success: true, data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Suspend staff
export const suspendStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await StaffAccount.findById(id);
    if (!staff)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });

    staff.status = staff.status === "suspended" ? "active" : "suspended";
    await staff.save();

    res
      .status(200)
      .json({ success: true, message: "Staff status updated", data: staff });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete staff
export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await StaffAccount.findByIdAndDelete(id);
    if (!staff)
      return res
        .status(404)
        .json({ success: false, message: "Staff not found" });

    res.status(200).json({ success: true, message: "Staff deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
