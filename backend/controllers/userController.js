import User from '../models/User.js';
import bcrypt from "bcrypt";
import express from 'express';

const createUser = async (req, res) => {
    const { fullName, mobileNumber, password } = req.body;

    // --- Basic Validation ---
    if (!fullName || !mobileNumber || !password) {
        return res.status(400).json({ msg: 'Please enter all fields.' });
    }

    // Optional: Check if a user with the same mobile number already exists
    const existingUser = await User.findOne({ mobileNumber });
    if (existingUser) {
        return res.status(400).json({ msg: 'A user with this mobile number already exists.' });
    }
    // creating new user.
    const newUser = new User({
        fullName,
        mobileNumber,
        password,
    });
    // password hashing
    const salt = await bcrypt.genSalt(10);
    newUser.password = await bcrypt.hash(password, salt);

    // Save the new user to the database
    const savedUser = await newUser.save();

    // Respond with the saved user data and a 201 (Created) status
    res.status(201).json(savedUser);
    
};

export default createUser;
