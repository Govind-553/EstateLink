import express from "express";
import crypto from "crypto";
import razorpay from "../config/razorpay.js";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

/**
 * Create subscription for a user
 */
router.post("/create-subscription", async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ status: "failed", message: "UserId is required" });
    }

    // Create subscription using Razorpay Plan ID
    const subscription = await razorpay.subscriptions.create({
      plan_id: process.env.RAZORPAY_PLAN_ID, // Replace with your Razorpay Plan ID
      customer_notify: 1,
      total_count: 12,
    });

    // Save subscriptionId in user
    await User.findByIdAndUpdate(userId, {
      subscriptionId: subscription.id,
    });

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

/**
 * Razorpay Webhook - Verify Payment Events
 */
router.post("/razorpay-webhook", express.json({ type: "application/json" }), async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    const shasum = crypto.createHmac("sha256", secret);
    shasum.update(JSON.stringify(req.body));
    const digest = shasum.digest("hex");

    if (digest !== req.headers["x-razorpay-signature"]) {
      return res.status(400).json({ status: "failed", message: "Invalid signature" });
    }

    const event = req.body.event;

    if (event === "subscription.activated") {
      const subscriptionId = req.body.payload.subscription.entity.id;

      await User.findOneAndUpdate(
        { subscriptionId },
        { subscriptionActive: true }
      );

      console.log(`✅ Subscription activated: ${subscriptionId}`);
    }

    if (event === "subscription.cancelled") {
      const subscriptionId = req.body.payload.subscription.entity.id;

      await User.findOneAndUpdate(
        { subscriptionId },
        { subscriptionActive: false }
      );

      console.log(`❌ Subscription cancelled: ${subscriptionId}`);
    }

    res.json({ status: "ok" });
  } catch (error) {
    console.error("Error in webhook:", error.message);
    res.status(500).json({
      status: "failed",
      message: "Server error",
    });
  }
});

export default router;
