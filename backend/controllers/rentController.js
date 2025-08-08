import express from "express";
import RentFlat from "../models/rentflats.js";
import User from "../models/User.js";

const router = express.Router();


// Route 1 - Create a new rent listing
router.post("/create/:contact", async (req, res) => {
    const { contact } = req.params;
    const rentData = req.body;
    
    try {
        if (!contact || !rentData) {
            return res.status(400).json({ message: "Missing contact or rent data." });
        }

        const user = await User.findOne({ mobileNumber: contact });
        if (!user) {
            return res.status(404).json({ message: "User with this contact not found." });
        }

        const { location, price, description } = rentData;
        if (!location || !price) {
            return res.status(400).json({ message: "Location and price are required." });
        }

        const newListing = new RentFlat({
            ...rentData,
            contact,
            userId: user._id,
        });

        const savedListing = await newListing.save();

        res.status(201).json({
            message: "New flat for rent is listed successfully.",
            listing: savedListing,
        });

    } catch (error) {
        console.error("Error creating rent listing:", error.message);
        res.status(500).json({ message: "Server error while creating rent listing." });
    }
});


// Route 2 - Get all rent listings
router.get("/all", async (req, res) => {
    try {
        const listings = await RentFlat.find();
        res.status(200).json({
            message: "All the flats are listed below.",
            listings
        });
    } catch (error) {
        console.error("Error fetching listings:", error.message);
        res.status(500).json({ message: "Server error while fetching listings." });
    }
});


// Route 3 - Get specific rent listings by contact
router.get("/by-contact/:contact", async (req, res) => {
    const { contact } = req.params;

    try {
        const listings = await RentFlat.find({ contact });

        res.status(200).json({
            message: "All the flats of the specific agent are listed below.",
            listings
        });

    } catch (error) {
        console.error("Error fetching listings by contact:", error.message);
        res.status(500).json({ message: "Server error while fetching listings." });
    }
});


// // Route 4 - Update listings by contact (update location and price)
// router.put("/update/:contact", async (req, res) => {
//     const { contact } = req.params;
//     const { location, price } = req.body;

//     try {
//         const update = {};
//         if (location) update.location = location;
//         if (price) update.price = price;

//         const result = await RentFlat.updateMany(
//             { contact },
//             { $set: update }
//         );

//         if (result.modifiedCount > 0) {
//             res.status(200).json({ message: "Listings updated successfully." });
//         } else {
//             res.status(404).json({ message: "No listings found for the given contact." });
//         }
//     } catch (error) {
//         console.error("Error updating listings:", error.message);
//         res.status(500).json({ message: "Server error while updating listings." });
//     }
// });


// Route 5 - Delete listings by contact
router.delete("/delete/:contact", async (req, res) => {
    const { contact } = req.params;

    try {
        const result = await RentFlat.deleteMany({ contact });

        if (result.deletedCount > 0) {
            res.status(200).json({ message: "Listings deleted successfully." });
        } else {
            res.status(404).json({ message: "No listings found for the given contact." });
        }
    } catch (error) {
        console.error("Error deleting listings:", error.message);
        res.status(500).json({ message: "Server error while deleting listings." });
    }
});

export default router;
