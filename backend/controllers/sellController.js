import SellFlat from "../models/sellflats.js";
import User from "../models/User.js";

// Create a new sell listing
export const createSellListing = async (req, res) => {
    const { contact } = req.params;
    let sellData = req.body;
    sellData = { ...sellData, createdAt: new Date() };

    try {
        if (!contact || !sellData) {
            return res.status(400).json({ message: "Missing contact or sell data." });
        }

        const user = await User.findOne({ mobileNumber: contact });
        if (!user) {
            return res.status(404).json({ message: "User with this contact not found." });
        }

        const { location, price } = sellData;
        if (!location || !price) {
            return res.status(400).json({ message: "Location and price are required." });
        }

        const newListing = new SellFlat({
            ...sellData,
            contact,
            userId: user._id,
            userName: user.fullName,
        });

        const savedListing = await newListing.save();

        res.status(201).json({
            message: "New flat for sale is listed successfully.",
            listing: savedListing,
        });

    } catch (error) {
        console.error("Error creating sell listing:", error.message);
        res.status(500).json({ message: "Server error while creating sell listing." });
    }
};

// Get all sell listings
export const getAllSellListings = async (req, res) => {
    try {
        const listings = await SellFlat.find();
        res.status(200).json({
            message: "All the flats for sale are listed below.",
            listings
        });
    } catch (error) {
        console.error("Error fetching sell listings:", error.message);
        res.status(500).json({ message: "Server error while fetching listings." });
    }
};

// Get listings by contact
export const getSellListingsByContact = async (req, res) => {
    const { contact } = req.params;
    try {
        const listings = await SellFlat.find({ contact });
        res.status(200).json({
            message: "All the flats for sale by this agent are listed below.",
            listings
        });
    } catch (error) {
        console.error("Error fetching listings by contact:", error.message);
        res.status(500).json({ message: "Server error while fetching listings." });
    }
};

// Update listings by contact
export const updateSellListingByContact = async (req, res) => {
    const { contact } = req.params;
    const { location, price } = req.body;

    try {
        if (!contact) {
            return res.status(400).json({ message: "Contact is required." });
        }

        const update = {};
        if (location) update.location = location;
        if (price) update.price = price;

        if (Object.keys(update).length === 0) {
            return res.status(400).json({ message: "No fields provided to update." });
        }

        const result = await SellFlat.updateMany({ contact }, { $set: update });

        if (result.modifiedCount > 0) {
            res.status(200).json({
                message: `Sell listings updated successfully for contact ${contact}.`,
                updatedFields: update,
                modifiedCount: result.modifiedCount
            });
        } else {
            res.status(404).json({ message: "No sell listings found for the given contact." });
        }
    } catch (error) {
        console.error("Error updating sell listings:", error.message);
        res.status(500).json({ message: "Server error while updating listings." });
    }
};

// Delete listings by contact
export const deleteSellListingByContact = async (req, res) => {
    const { contact } = req.params;

    try {
        if (!contact) {
            return res.status(400).json({ message: "Contact is required." });
        }

        const result = await SellFlat.deleteMany({ contact });

        if (result.deletedCount > 0) {
            res.status(200).json({
                message: `Deleted ${result.deletedCount} sell listing(s) for contact ${contact}.`
            });
        } else {
            res.status(404).json({ message: "No sell listings found for the given contact." });
        }
    } catch (error) {
        console.error("Error deleting sell listings:", error.message);
        res.status(500).json({ message: "Server error while deleting listings." });
    }
};