// Import required packages
import express from "express";
const router = express.Router(); 
import {registerUser, forgotPassword, loginUser, verifyOtp, }  from "../controllers/userController.js";

// Import the User model
import User from "../models/User.js";

// Route 1 - register new user
router.post('/create', registerUser);

//Route 2 - Login existing User
router.post("/login",loginUser);

//Route 3 - Forgot password
router.post("/forgot", forgotPassword);

//Route 4 - Resend OTP
router.post("/resend-otp", (req, res) => {
    const { mobileNumber } = req.body;
    // Logic to generate and send OTP
});

//Route 5 - Verify OTP
router.post("/verify-otp", verifyOtp);

//Route 7 - Generate the new access token using refressToken.


// Route 6 - Get all users
router.get('/all', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Route 7 - Get user by contact
router.get('/contact/:mobileNumber', async (req, res) => {
    const { mobileNumber } = req.params;
    try {
        const user = await User.findOne({ mobileNumber });
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

//Route 8 - Logout user.
router.post("/logout", (req, res) => {
    // Clear the user's session or token
    req.session.destroy((err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Server Error');
        }
        res.json({ message: "User logged out successfully." });
    });
});

export default router;