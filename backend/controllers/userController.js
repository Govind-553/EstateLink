import User from '../models/User.js';
import bcrypt from "bcrypt";
import express from 'express';
import jwt from "jsonwebtoken";
//import admin from "firebase-admin";
import { generateRefreshToken, generateAccessToken, sendTokenResponse } from './jwtController.js';


//Route 1 - Register user
export const registerUser = async (req, res) => {
    const { fullName, mobileNumber, password } = req.body;
    // Temporary in-memory store for OTP verification
    const pendingUsers = {};



    try{
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
    pendingUsers[mobileNumber] = {fullName: fullName, mobileNumber: mobileNumber, password: hashpassword };

    // creating new user.
    const newUser = new User({
        fullName,
        mobileNumber,
        password: hashpassword,
    });

    // Save the new user to the database
    await newUser.save();

    //Respond with the saved user data
    res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: {
            fullName: newUser.fullName,
            contact: newUser.mobileNumber,
            password: newUser.password,
        }
    });
    return res.json({
    message: "User pending, OTP sent. Please verify",
    mobileNumber: mobileNumber,
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
            return res.status(400).json({
                msg: 'Please enter all fields.'
            });
        }
        
        //mobileNumber length restriction
        if (mobileNumber.length !== 13 || !/^\+91[6-9]\d{9}$/.test(mobileNumber)) {
            return res.status(400).json({
                message: "mobile Number should be of only 10 digit"
            });
        }

        // Password length check
        if (password.length < 6) {
            return res.status(400).json({
                message: "Password should be at least of 6 characters."
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
                    message: "Password do not match."
                });
            }

            // If login is successful, you can return user data or a token
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
    // Extract the mobile number from the request body    
    const { contact } = req.body;
     // Basic validation
        if (!contact) {
            return res.status(400).json({ msg: 'Please enter your mobile number.' });
        }

    try {
        // Check if the user exists
        const existingUser = await User.findOne({ mobileNumber: contact });
        if (!existingUser) {
            return res.status(400).json({ msg: 'Mobile number is not registered.' });
        }

        // Generate a password reset token (you can use a library like jsonwebtoken)
        //const resetToken = existingUser.generateResetToken();

        // Send the reset token to the user's email or mobile number
        // (For simplicity, we'll just return it in the response)
        // Just confirm user exists
        res.status(200).json({
            status: "success",
            message: "User exists. Proceed with OTP verification using Firebase.",
        });

    } catch (error) {
        console.error('Error processing forgot password request:', error);
        res.status(500).json({ msg: 'Server error. Please try again later.' });
    }
};

//route 9 - resetpassword 
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
        //pendingUsers[mobileNumber] = { mobileNumber: mobileNumber };

        // Find user
        const user = await User.findOne({ mobileNumber: contact });
        if (!user) {
            return res.status(400).json({ msg: "User not found." });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Save new password
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

    // Basic validation
    if (!mobileNumber || !otp || !verificationId) {
        return res.status(400).json({ msg: 'Please enter all fields.' });
    }

    try {

        const decodedToken = await admin.auth().verifyIdToken(verificationId);

        // Verify the OTP
        if (!decodedToken) {
          return res.status(400).json({ error: "Invalid OTP" });
        }

        // Move from pending to registered users
        const user = pendingUsers[mobileNumber];
        if (!user) {
          return res.status(400).json({ error: "No pending user found" });
        }

        // Generate JWT for login session
        const token = jwt.sign({ mobileNumber }, "SECRET_KEY", { expiresIn: "1h" });

        // If OTP is valid, create the user
        const newUser = new User({
            fullName: user.fullName,
            mobileNumber: user.mobileNumber,
            password: user.password,
        });

        await newUser.save();
        delete pendingUsers[mobileNumber]; // Remove from pendingUsers

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            data: {
                fullName: newUser.fullName,
                contact: newUser.mobileNumber,
            }
        });
    } catch (error) {
        console.error('Error verifying OTP:', error);
        res.status(500).json({ msg: 'Server error. Please try again later.' });
    }
};

//Route 8 - logout User
// logout.controller.js
export const logout = async (req, res) => {
    try {
        // Clear the refreshToken cookie
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "Strict",
            path: "/" // ensures cookie is cleared site-wide
        });

        res.status(200).json({
            message: "Logged Out Successfully - Come Back Soon!"
        });
    } catch (error) {
        console.error("Logout Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
