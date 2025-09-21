import User from '../models/User.js';
import bcrypt from "bcrypt";
import express from 'express';
import jwt from "jsonwebtoken";
import { generateRefreshToken, generateAccessToken, sendTokenResponse } from './jwtController.js';

// ---- Global in-memory pending user store ----
const pendingUsers = {};  

//Route 1 - Register user
export const registerUser = async (req, res) => {
    const { fullName, mobileNumber, password } = req.body;

    try {
        if (!fullName || !mobileNumber || !password) {
            return res.status(400).json({ msg: 'Please enter all fields.' });
        }

        const existingUser = await User.findOne({ mobileNumber });
        if (existingUser) {
            return res.status(400).json({ msg: 'A user with this mobile number already exists.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters long.' });
        }
        
        const salt = await bcrypt.genSalt(10);
        const hashpassword = await bcrypt.hash(password, salt);

        pendingUsers[mobileNumber] = { 
            fullName, 
            mobileNumber, 
            password: hashpassword 
        };

        const newUser = new User({
            fullName,
            mobileNumber,
            password: hashpassword,
            subscriptionActive: true, // ✅ Give trial by default
            subscriptionExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // ✅ 7 days free
        });

        await newUser.save();

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully (OTP pending)',
            data: {
                fullName: newUser.fullName,
                contact: newUser.mobileNumber
            }
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ msg: 'Server error. Please try again later.' });
    }  
};

//Route 2 - Login user 
export const loginUser = async (req, res) => {
    const { mobileNumber, password } = req.body;
    try {
        if (!mobileNumber || !password) {
            return res.status(400).json({ msg: 'Please enter all fields.' });
        }

        if (password.length < 6) {
            return res.status(400).json({
                message: "Password should be at least 6 characters."
            });
        }

        const existingUser = await User.findOne({ mobileNumber });
        if (!existingUser) {
            return res.status(400).json({
                message: "Mobile number is not registered."
            });
        } 

        const isMatch = await bcrypt.compare(password, existingUser.password);
        if (!isMatch) {
            return res.status(400).json({
                message: "Password does not match."
            });
        }

        // ✅ Check subscription validity
        let subscriptionActive = existingUser.subscriptionActive;
        if (existingUser.subscriptionExpiry && existingUser.subscriptionExpiry < new Date()) {
            subscriptionActive = false;
            existingUser.subscriptionActive = false;
            await existingUser.save();
        }

        if (!subscriptionActive) {
            return res.status(403).json({
                message: "Your trial/subscription has expired. Please subscribe to continue.",
                subscriptionActive: false
            });
        }

        // If login is successful
        res.status(200).json({
            status: 'success',
            message: 'User logged in successfully',
            userId: existingUser._id,
            subscriptionActive: existingUser.subscriptionActive,
            subscriptionExpiry: existingUser.subscriptionExpiry,
            token: generateAccessToken(existingUser.mobileNumber),
        });

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ msg: 'Server error. Please try again later.' });
    }
};

//Route 3 - Forgot Password
export const forgotPassword = async (req, res) => {
    const { contact } = req.body;

    if (!contact) {
        return res.status(400).json({ msg: 'Please enter your mobile number.' });
    }

    try {
        const existingUser = await User.findOne({ mobileNumber: contact });
        if (!existingUser) {
            return res.status(400).json({ msg: 'Mobile number is not registered.' });
        }

        res.status(200).json({
            status: "success",
            message: "User exists. Proceed with OTP verification using Firebase.",
        });

    } catch (error) {
        console.error('Error processing forgot password request:', error);
        res.status(500).json({ msg: 'Server error. Please try again later.' });
    }
};

//Route 4 - reset password 
export const resetPassword = async (req, res) => {
    const { contact, confirmPassword, newPassword } = req.body;

    if (!contact || !confirmPassword || !newPassword) {
        return res.status(400).json({ msg: "Mobile number, confirm password and new password are required." });
    }

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ msg: "Passwords do not match." });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ msg: "Password must be at least 6 characters long." });
    }   
     
    try {
        const user = await User.findOne({ mobileNumber: contact });
        if (!user) {
            return res.status(400).json({ msg: "User not found." });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            status: "success",
            message: "Password updated successfully. Please log in again.",
        });

    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ msg: "Server error. Please try again later." });
    }
};

// Route 5 - Admin Login
export const adminLogin = async (req, res) => {
    const { mobileNumber, password } = req.body;
    try {
        const user = await User.findOne({ mobileNumber });
        if (!user) {
          return res.status(400).json({ message: "Admin not found" });
        }
    
        const adminNumber = process.env.ADMIN_NUMBER;
        const phoneNumber = user.mobileNumber;
        if (String(phoneNumber) !== String(adminNumber)) {
          return res.status(403).json({
            message:"Access denied, only admin can access."
          })
        }
    
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return res.status(400).json({ message: "Invalid password" });
        }
    
        res.status(200).json({
            status: 'success',
            message: 'Admin logged in successfully',
            token: generateAccessToken(user.mobileNumber),
            data: {
                fullName:user.fullName,
                mobileNumber: user.mobileNumber
            }
        });
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Server error: " + error.message });
    }
}

//Route 7 - Get All Users
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

//Route 9 - logout User
export const logout = async (req, res) => {
    try {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            path: "/"
        });

        res.status(200).json({
            message: "Logged Out Successfully - Come Back Soon!"
        });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
