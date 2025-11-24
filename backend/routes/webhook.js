// webhook.js
import express from "express";
import crypto from "crypto";
import User from "../models/User.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Helper: add one calendar month to a given date
const addOneMonth = (date) => {
  const d = new Date(date);
  const day = d.getDate();
  d.setMonth(d.getMonth() + 1);
  // handle months with fewer days
  if (d.getDate() < day) {
    d.setDate(0);
  }
  return d;
};

router.post(
  "/razorpay-webhook",
  express.json({ type: "application/json" }),
  async (req, res) => {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
      if (!secret) {
        console.warn("Razorpay webhook secret is not configured in environment.");
      }

      // Validate signature
      const shasum = crypto.createHmac("sha256", secret || "");
      shasum.update(JSON.stringify(req.body));
      const digest = shasum.digest("hex");

      if (digest !== req.headers["x-razorpay-signature"]) {
        console.warn("Invalid Razorpay webhook signature");
        return res.status(400).json({ status: "failed", message: "Invalid signature" });
      }

      const event = req.body.event;
      const payload = req.body.payload || {};

      // SUBSCRIPTION ACTIVATED
      if (event === "subscription.activated") {
        const subscriptionEntity = payload.subscription?.entity;
        if (!subscriptionEntity) {
          console.warn("subscription.activated: no entity in payload");
        } else {
          const subscriptionId = subscriptionEntity.id;

          const user = await User.findOne({ subscriptionId });
          if (user) {
            const now = new Date();

            // If user already has a future subscriptionExpiry (e.g., registration set 7-day trial),
            // extend from that date; otherwise, extend from now.
            let baseDate = now;
            if (user.subscriptionExpiry && new Date(user.subscriptionExpiry) > now) {
              baseDate = new Date(user.subscriptionExpiry);
            }

            const newExpiry = addOneMonth(baseDate);

            user.subscriptionActive = true;
            user.subscriptionStatus = "Active";
            user.subscriptionExpiry = newExpiry;

            // If Razorpay sent customer email/contact, store if missing
            const cust = subscriptionEntity.customer_details || {};
            if (cust.email && !user.email) user.email = cust.email;
            if (cust.contact && !user.mobileNumber) user.mobileNumber = cust.contact;

            await user.save();
            console.log(`✅ subscription.activated -> user ${user.mobileNumber} expiry set to ${user.subscriptionExpiry}`);
          } else {
            console.warn(`subscription.activated -> no user found with subscriptionId ${subscriptionId}`);
          }
        }
      }

      // INVOICE PAID (recurring monthly charge)
      if (event === "invoice.paid") {
        const invoiceEntity = payload.invoice?.entity;
        if (invoiceEntity && invoiceEntity.subscription_id) {
          const subscriptionId = invoiceEntity.subscription_id;
          const user = await User.findOne({ subscriptionId });

          if (user) {
            const now = new Date();
            // extend from existing expiry if in future, else from now
            const baseDate = user.subscriptionExpiry && new Date(user.subscriptionExpiry) > now
              ? new Date(user.subscriptionExpiry)
              : now;

            const newExpiry = addOneMonth(baseDate);

            user.subscriptionActive = true;
            user.subscriptionStatus = "Active";
            user.subscriptionExpiry = newExpiry;

            // capture email if present in invoice
            if (invoiceEntity.customer_email && !user.email) user.email = invoiceEntity.customer_email;

            await user.save();
            console.log(`📅 invoice.paid -> extended ${user.mobileNumber} to ${user.subscriptionExpiry}`);
          } else {
            console.warn(`invoice.paid -> no user found with subscriptionId ${subscriptionId}`);
          }
        }
      }

      // Subscription canceled/paused/halted
      if (event === "subscription.cancelled" || event === "subscription.halted" || event === "subscription.paused") {
        const subscriptionEntity = payload.subscription?.entity;
        if (subscriptionEntity) {
          const subscriptionId = subscriptionEntity.id;
          await User.findOneAndUpdate(
            { subscriptionId },
            { subscriptionActive: false, subscriptionStatus: "Inactive" }
          );
          console.log(`❌ Subscription ${subscriptionId} set to Inactive`);
        }
      }

      // reply OK to the webhook 
      return res.json({ status: "ok" });
    } catch (error) {
      console.error("Error in webhook:", error);
      return res.status(500).json({ status: "failed", message: "Server error", error: error.message });
    }
  }
);

export default router;
