import express from "express";
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required.'],
        trim: true, 
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required.'],
        unique: true, 
        trim: true,
        match: [/^[0-9]{10}$/, 'Please fill a valid 10-digit mobile number.'],
    },
    password: {
        type: String,
        required: [true, 'Password is required.'],
        minlength: [6, 'Password must be at least 6 characters long.'],
    },
    registrationDate: {
        type: Date,
        default: Date.now,
    },
});

// Create and export the User model
const User = mongoose.model('User', UserSchema);
export default User;