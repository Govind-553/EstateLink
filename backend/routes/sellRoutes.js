import express from "express";
import {
    createSellListing,
    getAllSellListings,
    getSellListingsByContact,
    updateSellListingByContact,
    deleteSellListingByContact
} from "../controllers/sellController.js";

const router = express.Router();

router.post("/create/:contact", createSellListing);
// route 1: create sell listing

router.get("/all", getAllSellListings);
// route 2: get all sell listings

router.get("/by-contact/:contact", getSellListingsByContact);
// route 3: get sell listings by contact

router.put("/update/:contact", updateSellListingByContact);
// route 4: update sell listings by contact

router.delete("/delete/:contact", deleteSellListingByContact);
// route 5: delete sell listings by contact

export default router;