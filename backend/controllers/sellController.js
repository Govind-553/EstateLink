import SellFlat from "../models/sellflats.js";
import User from "../models/User.js";

// Route 1: Create a new sell listing
export const createSellListing = async (req, res) => {
  const userId = req.userId;
  const mobileNumber = req.mobileNumber;
  const { contact, location, price } = req.body || {};

  try {
    if (!contact || !location || !price) {
      return res.status(400).json({ message: "Contact, location, and price are required." });
    }

    const user = await User.findOne({ mobileNumber: contact });
    if (!user) {
      return res.status(404).json({ message: "User with this mobile number not found." });
    }

    const newListing = new SellFlat({
      location,
      price,
      contact: user.mobileNumber,
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

// Route 2: Get all sell listings
export const getAllSellListings = async (req, res) => {
  const mobileNumber = req.mobileNumber;

  try {
    if (!mobileNumber) {
      return res.status(400).json({ message: "Mobile number is required." });
    }

    const listings = await SellFlat.find();

    res.status(200).json({
      message: "All the flats for sale are listed below.",
      count: listings.length,
      sellFlatsList: listings,
    });
  } catch (error) {
    console.error("Error fetching sell listings:", error.message);
    res.status(500).json({ message: "Server error while fetching listings." });
  }
};

// Route 3: Get listings by contact (supports both GET and POST)
export const getSellListingsByContact = async (req, res) => {
  const contact = Number(req.query?.contact || req.body?.contact);

  try {
    if (!contact) {
      return res.status(400).json({ message: "Contact number is required." });
    }

    const user = await User.findOne({ mobileNumber: contact });
    if (!user) {
      return res.status(404).json({ message: "This contact is not registered." });
    }

    const listings = await SellFlat.find({ contact });
    if (!listings || listings.length === 0) {
      return res.status(404).json({ message: "No listings found for this contact." });
    }

    res.status(200).json({
      message: "All the flats for sale by this agent are listed below.",
      listings,
    });
  } catch (error) {
    console.error("Error fetching listings by contact:", error.message);
    res.status(500).json({ message: "Server error while fetching listings." });
  }
};

// Route 4: Update listings by contact
export const updateSellListingByContact = async (req, res) => {
  const contact = req.mobileNumber;
  const { location, price } = req.body || {};

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
        modifiedCount: result.modifiedCount,
      });
    } else {
      res.status(404).json({ message: "No sell listings found for the given contact." });
    }
  } catch (error) {
    console.error("Error updating sell listings:", error.message);
    res.status(500).json({ message: "Server error while updating listings." });
  }
};

// Route 5: Delete listings by contact
export const deleteSellListingByContact = async (req, res) => {
  const { SellFlatId, contact } = req.body || {};
  const mobileNumber = req.mobileNumber;

  try {
    if (!SellFlatId || !contact) {
      return res.status(400).json({ message: "SellFlatId and contact are required." });
    }

    const result = await SellFlat.findOneAndDelete({
      _id: SellFlatId,
      contact: Number(contact),
    });

    if (result) {
      return res.status(200).json({
        message: `Deleted listing with ID ${SellFlatId} for contact ${contact}.`,
      });
    } else {
      return res.status(404).json({ message: "No listing found for the given ID and contact." });
    }
  } catch (error) {
    console.error("Error deleting listings:", error.message);
    res.status(500).json({ message: "Server error while deleting listings." });
  }
};