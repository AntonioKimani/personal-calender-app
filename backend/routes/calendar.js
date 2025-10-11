import express from "express";
const router = express.Router();

// Temporary route for testing
router.get("/", (req, res) => {
  res.json({ message: "Calendar route working!" });
});

export default router;
