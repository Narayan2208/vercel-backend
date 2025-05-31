const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Profile = require("../models/Profile");
const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Create user
    const user = new User({ email, password, name, role });
    await user.save();

    // Create profile
    const profile = new Profile({
      user: user._id,
      email,
      name,
      role,
    });
    await profile.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Logout
router.post("/logout", async (req, res) => {
  try {
    // In a more complex system, you might want to:
    // 1. Add the token to a blacklist
    // 2. Clear any server-side sessions
    // For now, we'll just send a success response
    // The client will handle clearing the token
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error during logout" });
  }
});

module.exports = router;
