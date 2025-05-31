const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const { auth, checkRole } = require("../middleware/auth");
const User = require("../models/User");
const Application = require("../models/Application");

// Get all jobs posted by the employer
router.get("/jobs", auth, checkRole(["employer"]), async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user.id }).sort({
      createdAt: -1,
    }); // Most recent first

    res.json(jobs);
  } catch (error) {
    console.error("Error fetching employer jobs:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new job posting
router.post("/jobs", auth, checkRole(["employer"]), async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      type,
      description,
      requirements,
      salary,
    } = req.body;

    const newJob = new Job({
      employer: req.user.id,
      title,
      company,
      location,
      type,
      description,
      requirements,
      salary,
    });

    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a job posting
router.put("/jobs/:id", auth, checkRole(["employer"]), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Ensure the job belongs to the employer
    if (job.employer.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this job" });
    }

    const updatedJob = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(updatedJob);
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a job posting
router.delete("/jobs/:id", auth, checkRole(["employer"]), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Ensure the job belongs to the employer
    if (job.employer.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this job" });
    }

    await job.remove();
    res.json({ message: "Job removed" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get job applications statistics
router.get(
  "/jobs/:id/stats",
  auth,
  checkRole(["employer"]),
  async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Ensure the job belongs to the employer
      if (job.employer.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to view these stats" });
      }

      // Get application count
      const applicationCount = await Application.countDocuments({
        job: job._id,
      });

      res.json({
        views: job.views || 0,
        applications: applicationCount,
      });
    } catch (error) {
      console.error("Error fetching job stats:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Update job status
router.patch(
  "/jobs/:id/status",
  auth,
  checkRole(["employer"]),
  async (req, res) => {
    try {
      const { status } = req.body;

      if (!["Active", "Paused", "Closed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Ensure the job belongs to the employer
      if (job.employer.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this job" });
      }

      job.status = status;
      await job.save();

      res.json(job);
    } catch (error) {
      console.error("Error updating job status:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Get job applications
router.get(
  "/jobs/:id/applications",
  auth,
  checkRole(["employer"]),
  async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      // Ensure the job belongs to the employer
      if (job.employer.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to view these applications" });
      }

      // Fetch applications with applicant details
      const applications = await Application.find({ job: job._id })
        .populate("applicant", "fullName email location experience")
        .sort({ createdAt: -1 });

      res.json(applications);
    } catch (error) {
      console.error("Error fetching job applications:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
