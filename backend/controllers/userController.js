// userController.js

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
        // --- Basic Validation ---
        if (!fullName || !mobileNumber || !password) {
            return res.status(400).json({ msg: 'Please enter all fields.' });
        }

        // Optional: Check if a user with the same mobile number already exists
        const existingUser = await User.findOne({ mobileNumber });
        if (existingUser) {
            return res.status(400).json({ msg: 'A user with this mobile number already exists.' });
        }

        // Password length check
        if (password.length < 6) {
            return res.status(400).json({ msg: 'Password must be at least 6 characters long.' });
        }
        
        // password hashing
        const salt = await bcrypt.genSalt(10);
        const hashpassword = await bcrypt.hash(password, salt);

        // Store in pending until OTP verified
        pendingUsers[mobileNumber] = { 
            fullName, 
            mobileNumber, 
            password: hashpassword 
        };

        // creating new user directly (you can change this to only save after OTP)
        const newUser = new User({
            fullName,
            mobileNumber,
            password: hashpassword,
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

//Route 2 - Login user existing user 
export const loginUser = async (req, res) => {
    const { mobileNumber, password } = req.body;
    try {
        //Basic validation
        if (!mobileNumber || !password) {
            return res.status(400).json({ msg: 'Please enter all fields.' });
        }

        // Password length check
        if (password.length < 6) {
            return res.status(400).json({
                message: "Password should be at least 6 characters."
            });
        }

        //check the entered mobile number is registered or not.
        const existingUser = await User.findOne({ mobileNumber });
        if (!existingUser) {
            return res.status(400).json({
                message: "Mobile number is not registered."
            });
        } else {
            const isMatch = await bcrypt.compare(password, existingUser.password);
            if (!isMatch) {
                return res.status(400).json({
                    message: "Password does not match."
                });
            }

            // If login is successful, return a token
            res.status(200).json({
                status: 'success',
                message: 'User logged in successfully',
                data: generateAccessToken(existingUser.mobileNumber),
            });
        }

    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ msg: 'Server error. Please try again later.' });
    }
};

//Route 3 - Forgot Password (password reset request)
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

//route 4 - reset password 
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

//Route 5 - verify-otp
export const verifyOtp = async (req, res) => {
    const { mobileNumber, otp, verificationId } = req.body;

    if (!mobileNumber || !otp || !verificationId) {
        return res.status(400).json({ msg: 'Please enter all fields.' });
    }

    try {
        // TODO: integrate Firebase or other OTP verification
        const user = pendingUsers[mobileNumber];
        if (!user) {
            return res.status(400).json({ error: "No pending user found" });
        }

        const token = jwt.sign({ mobileNumber }, "SECRET_KEY", { expiresIn: "1h" });

        delete pendingUsers[mobileNumber]; // Remove from pendingUsers

        res.status(201).json({
            status: 'success',
            message: 'OTP verified, user registered',
            data: {
                fullName: user.fullName,
                contact: user.mobileNumber,
                token
            }
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ msg: 'Server error. Please try again later.' });
    }
};

//Route 6 - logout User
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
