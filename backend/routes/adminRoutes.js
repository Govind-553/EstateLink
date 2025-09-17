import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

const router = express.Router();

// Admin Login
router.post("/login", async (req, res) => {
  try {
    const { mobileNumber, password } = req.body;

    // Check if admin exists
    const admin = await Admin.findOne({ mobileNumber });
    if (!admin) {
      return res.status(400).json({ message: "Admin not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid password" });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "1h" }
    );

    res.status(200).json({
      status: "success",
      token,
      data: {
        fullName: admin.fullName,
        mobileNumber: admin.mobileNumber,
        role: "admin"
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
