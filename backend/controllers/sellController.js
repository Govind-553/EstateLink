import express from "express";

const router = express.Router();

// Mock DB (in-memory)
const sellListings = [];

// Route 1 - Create a new sell listing
router.post("/create/:contact", (req, res) => {
    const { contact } = req.params;
    const sellData = req.body;

    const newListing = { contact, ...sellData };
    sellListings.push(newListing);

    res.status(201).json({ message: "New flat for sale is listed.", listing: newListing });
});

// Route 2 - Get all sell listings
router.get("/all", (req, res) => {
    res.status(200).json({ message: "All the flats for sale are listed below.", listings: sellListings });
});

// Route 3 - Get specific sell listings by contact
router.get("/by-contact/:contact", (req, res) => {
    const { contact } = req.params;

    const filtered = sellListings.filter(listing => listing.contact === contact);

    res.status(200).json({
        message: "All the flats of the specific seller are listed below.",
        listings: filtered
    });
});

// Route 4 - Update a listing by contact (e.g., update location and price)
// Uncomment if needed
// router.put("/update/:contact", (req, res) => {
//     const { contact } = req.params;
//     const { location, price } = req.body;

//     let updated = false;
//     sellListings.forEach(listing => {
//         if (listing.contact === contact) {
//             if (location) listing.location = location;
//             if (price) listing.price = price;
//             updated = true;
//         }
//     });

//     if (updated) {
//         res.status(200).json({ message: "Listings updated successfully." });
//     } else {
//         res.status(404).json({ message: "No listings found for the given contact." });
//     }
// });

// Route 5 - Delete listings by contact
router.delete("/delete/:contact", (req, res) => {
    const { contact } = req.params;
    const initialLength = sellListings.length;

    const filtered = sellListings.filter(listing => listing.contact !== contact);
    sellListings.length = 0;
    sellListings.push(...filtered);

    if (filtered.length < initialLength) {
        res.status(200).json({ message: "Listings deleted successfully." });
    } else {
        res.status(404).json({ message: "No listings found for the given contact." });
    }
});

export default router;
