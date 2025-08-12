import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import rentRoutes from "./routes/rentRoutes.js";
import sellRoutes from "./routes/sellRoutes.js"; 
// import cookieParser from "cookie-parser";

dotenv.config();
const app = express();  // Initialize Express app

app.use(cors());
app.use(express.json());
// app.use(cookieParser()); // Optional if you're handling cookies

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/rentflats', rentRoutes);
app.use('/api/sellflats', sellRoutes); // ✅ Now active

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});