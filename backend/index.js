import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.js";
import calendarRoutes from "./routes/calendar.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/calendar", calendarRoutes);

// Simple health check route (optional)
app.get("/api", (req, res) => {
  res.json({ status: "ok", message: "Calendar API running" });
});

// ------------------------------
// ✅ Serve React frontend build
// ------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the React app build
app.use(express.static(path.join(__dirname, "../dist")));

// Catch-all route to handle React routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../dist", "index.html"));
});
// ------------------------------

// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
