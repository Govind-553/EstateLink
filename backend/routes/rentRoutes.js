import express from "express";
import createRentListing from "../controllers/rentController.js";
const router = express.Router();

//Route 1 - Create a new rent listing
router.post("/create/:contact", createRentListing);

//Route 2 - Get all rent listings.
router.get("/all", (req, res) => {
    const { contact } = req.params;

    res.status(200).json({message: "All the list of flats are listed bellow."});
});

//Route 3 - get specific rent listing by contact
router.get("/by-contact/:contact", (req, res) => {
    const {contact} = req.params;

    res.status(200).json({mesage: "All the flats of the specific agent is listed bollow."})
});

//Route 4 - update the list by contact details.( Location and price) ----- optional

//Route 5 - Delete flats through contact.
export default router;