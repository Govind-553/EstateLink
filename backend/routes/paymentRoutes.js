import express from "express";
import razorpay from "../config/razorpay.js";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Route to create a new subscription
router.post("/create-subscription", async (req, res) => {
  try {
    const { mobileNumber } = req.body;

    if (!mobileNumber) {
      return res.status(400).json({ status: "failed", message: "Mobile number is required" });
    }

    // Find the user by mobile number
    const user = await User.findOne({ mobileNumber: mobileNumber });

    if (!user) {
      return res.status(404).json({ status: "failed", message: "User not found" });
    }

    // Create subscription using Razorpay Plan ID
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 12,
    });

    // Update the user with the new subscription ID
    await User.findOneAndUpdate(
      { mobileNumber: mobileNumber },
      {
        subscriptionId: subscription.id,
        subscriptionActive: true,
        subscriptionStatus: "Active"
      }
    );

    res.json({
      status: "success",
      message: "Subscription created",
      subscriptionId: subscription.id,
      subscription,
    });
  } catch (error) {
    console.error("Error in create-subscription:", error.message);
    res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
});

export default router;
