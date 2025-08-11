import mongoose from "mongoose";
import User from "./User.js"; 

const rentFlatSchema = new mongoose.Schema({
   userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  location: { 
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  contact: {
    type: mongoose.Schema.Types.Number,
    required: [true, 'Mobile number is required.'],
    ref: 'User',
    trim: true,
    match: [/^[0-9]{10}$/, 'Please fill a valid 10-digit mobile number.']
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
});

const RentFlat = mongoose.model("RentFlat", rentFlatSchema);

export default RentFlat;
