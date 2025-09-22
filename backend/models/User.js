import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Full name is required.'],
    trim: true,
  },
  mobileNumber: {
    type: Number,
    required: [true, 'Mobile number is required.'],
    unique: true,
    trim: true,
    match: [/^91[0-9]{10}$/, 'Please fill a valid 10-digit mobile number.'],
  },
  password: {
    type: String,
    required: [true, 'Password is required.'],
    minlength: [6, 'Password must be at least 6 characters long.'],
  },
  status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Inactive',
  },
  type: {
      type: String,
      enum: ['Owner', 'Agent'],
      default: 'Agent',
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  subscriptionActive: {
    type: Boolean,
    default: true,
  },
  subscriptionId: {
    type: String,
    default: null,
  },
});

const User = mongoose.model('User', UserSchema);
export default User;
