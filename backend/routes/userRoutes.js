// Import required packages
import express from "express";
const router = express.Router(); 
import createUser from "../controllers/userController.js";

// Import the User model
import User from "../models/User.js";

// Route 1 - Create new user
router.post('/create', createUser);

// Route 2 - Get all users
/*
router.get('/all', async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}); */

// Route 3 - Get user by contact
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

export default router;