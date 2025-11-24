// paymentRoutes.js
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

    // Build customer details (Razorpay accepts customer object)
    const customerDetails = {
      name: user.fullName || undefined,
      contact: String(user.mobileNumber || mobileNumber),
      email: user.email || undefined
    };

    // Create subscription using Razorpay Plan ID
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID,
      customer_notify: 1,
      total_count: 12,
      // Pass customer details to associate the subscription with a Razorpay customer
      customer: customerDetails
      // Razorpay will return subscription.id (short_url available in response).
    });

    // Update the user with the new subscription ID (status will be updated via webhook)
    await User.findOneAndUpdate(
      { mobileNumber: mobileNumber },
      {
        subscriptionId: subscription.id,
        // keep subscriptionActive/Expiry in webhook to avoid race conditions
        subscriptionStatus: "Inactive"
      }
    );

    res.json({
      status: "success",
      message: "✅ Subscription created. Please complete payment.",
      subscriptionId: subscription.id,
      short_url: subscription.short_url || null,
      subscription
    });
  } catch (error) {
    console.error("Error in create-subscription:", error);
    res.status(500).json({
      status: "failed",
      message: "Server error",
      error: error.message
    });
  }
});

export default router;
