import RentFlat from "../models/rentflats.js";

// Helper function to sanitize and parse the price string
const parsePrice = (priceString) => {
    if (typeof priceString !== 'string') return null;
    const numericString = priceString.replace(/[^0-9.]/g, '');
    return parseFloat(numericString);
};

// Helper function to clean the mobile number string
const cleanMobileNumber = (mobileString) => {
    if (typeof mobileString !== 'string') return '';
    return mobileString.replace(/\D/g, '');
};

// Route 1: Create a new rent listing
export const createRentListing = async (req, res) => {
    // ✅ CORRECTED: Destructure tenantType instead of ownershipType
    const { contact, location, propertyType, price, name, date, tenantType } = req.body || {};

    try {
        // ✅ CORRECTED: Validate for tenantType
        if (!contact || !location || !propertyType || !price || !name || !date || !tenantType) {
            return res.status(400).json({ message: "All required fields must be provided." });
        }
        
        const sanitizedContact = cleanMobileNumber(contact);

        const newListing = new RentFlat({
            location,
            propertyType,
            price: parsePrice(price),
            contact: sanitizedContact,
            userName: name,
            date,
            tenantType // ✅ CORRECTED: Save tenantType
        });

        const savedListing = await newListing.save();

        res.status(201).json({
            message: "New flat for rent is listed successfully.",
            listing: savedListing,
        });

    } catch (error) {
         // ✅ MODIFIED: Check for the specific duplicate key error
        if (error.code === 11000) {
            // Check if the duplicate key error is for the 'contact' field
            if (error.keyPattern && error.keyPattern.contact) {
                return res.status(409).json({ 
                    message: "This contact number is already associated with an existing listing. Please use a different number." 
                });
            }
        }

        console.error("Error creating rent listing:", error.message);
        res.status(500).json({ message: "Server error while creating rent listing." });
    }
};

// New Route: Get user details by mobile number
export const getUserByMobileNumber = async (req, res) => {
    try {
        const mobileNumber = req.params.mobileNumber;
        const user = await User.findOne({ mobileNumber: mobileNumber });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({
            message: "User found.",
            user: {
                fullName: user.fullName,
                mobileNumber: user.mobileNumber
            }
        });

    } catch (error) {
        console.error("Error fetching user by mobile number:", error.message);
        res.status(500).json({ message: "Server error." });
    }
};

// Route 2: Get all rent listings
export const getAllRentListings = async (req, res) => {
    try {
        const listings = await RentFlat.find().lean();
        
        const formattedListings = listings.map(listing => {
            const formattedPrice = (typeof listing.price === 'number' && !isNaN(listing.price))
                ? `₹${new Intl.NumberFormat('en-IN').format(listing.price)}`
                : "N/A";

            return {
                ...listing,
                id: listing._id.toString(),
                price: formattedPrice
            };
        });
        
        res.status(200).json({
            message: "All the flats for rent are listed below.",
            count: formattedListings.length,
            rentFlatsList: formattedListings,
        });
    } catch (error) {
        console.error("Error fetching listings:", error.message);
        res.status(500).json({ message: "Server error while fetching listings." });
    }
};

// Route 3: Update a rent listing by its ID
export const updateRentListingById = async (req, res) => {
    const { id } = req.params; 
    // ✅ CORRECTED: Destructure tenantType
    const { location, propertyType, price, name, contact, date, tenantType } = req.body || {};

    try {
        const update = {
            location,
            propertyType,
            price: parsePrice(price),
            userName: name,
            contact: cleanMobileNumber(contact),
            date,
            tenantType // ✅ CORRECTED: Update tenantType
        };

        const result = await RentFlat.findByIdAndUpdate(id, { $set: update }, { new: true });

        if (result) {
            res.status(200).json({
                message: `Rent listing with ID ${id} updated successfully.`,
                updatedListing: result,
            });
        } else {
            res.status(404).json({ message: "No rent listing found for the given ID." });
        }
    } catch (error) {
        console.error("Error updating rent listing:", error.message);
        res.status(500).json({ message: "Server error while updating listing." });
    }
};

// Route 4: Delete a rent listing by its ID
export const deleteRentListingById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await RentFlat.findByIdAndDelete(id);

        if (result) {
            return res.status(200).json({
                message: `Deleted listing with ID ${id}.`,
            });
        } else {
            return res.status(404).json({ message: "No listing found for the given ID." });
        }
    } catch (error) {
        console.error("Error deleting listings:", error.message);
        res.status(500).json({ message: "Server error while deleting listings." });
    }
};
