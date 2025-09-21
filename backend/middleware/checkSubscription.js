// middleware/checkSubscription.js
const User = require("../models/User");

async function checkSubscription(req, res, next) {
  const user = await User.findById(req.user.id);

  const trialPeriod = 7; // days
  const today = new Date();
  const diffDays = Math.floor((today - user.registrationDate) / (1000 * 60 * 60 * 24));

  if (diffDays > trialPeriod && !user.subscriptionActive) {
    return res.status(403).json({
      success: false,
      message: "Please subscribe to continue.",
    });
  }

  next();
}

module.exports = checkSubscription;
