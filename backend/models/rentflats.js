import mongoose from 'mongoose';

const RentFlatSchema = new mongoose.Schema({
    // userName is required by the form, so it should be required here too.
    userName: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    propertyType: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    // Contact should be a String to preserve formatting and leading zeros.
    // The regex validation already ensures it contains only 10 digits.
    contact: {
        type: String,
        required: [true, 'Mobile number is required.'],
        trim: true,
        match: [/^[0-9]{10}$/, 'Please fill a valid 10-digit mobile number.'],
        unique: true // Ensures no duplicate contact numbers
    },
    date: {
        type: Date,
        required: true
    },
    // ✅ THE FIX: Replaced 'ownershipType' with 'tenantType'.
    // This now matches your rent form and controller.
    tenantType: {
        type: String,
        required: true,
        enum: ['Any', 'Family', 'Bachelors'] // Ensures only these values are accepted
    },
}, { 
    // This is a cleaner way to automatically add `createdAt` and `updatedAt` fields.
    timestamps: true 
});

const RentFlat = mongoose.model('RentFlat', RentFlatSchema);

export default RentFlat;
