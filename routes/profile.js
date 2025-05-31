const express = require("express");
const { auth } = require("../middleware/auth");
const User = require("../models/User");
const router = express.Router();

// Get user profile
router.get("/", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: error.message });
  }
});

// Update user profile
router.put("/", auth, async (req, res) => {
  try {
    const {
      fullName,
      email,
      phone,
      location,
      bio,
      skills,
      experience,
      education,
      certifications,
      socialLinks,
    } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user fields
    user.fullName = fullName || user.fullName;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.location = location || user.location;
    user.bio = bio || user.bio;
    user.skills = skills || user.skills;
    user.experience = experience || user.experience;
    user.education = education || user.education;
    user.certifications = certifications || user.certifications;
    user.socialLinks = socialLinks || user.socialLinks;

    await user.save();
    res.json(user);
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
