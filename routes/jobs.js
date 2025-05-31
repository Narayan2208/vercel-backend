const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const { auth, checkRole } = require("../middleware/auth");
const Application = require("../models/Application");
const mongoose = require("mongoose");

// Create a new job
router.post("/", auth, checkRole(["employer"]), async (req, res) => {
  try {
    const job = new Job({
      ...req.body,
      employer: req.user._id,
    });

    await job.save();
    res.status(201).json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all active jobs
router.get("/", auth, async (req, res) => {
  try {
    const jobs = await Job.find({ status: "active" })
      .populate("employer", "name company")
      .sort({ createdAt: -1 });

    // If user is authenticated, fetch their applications and merge with jobs
    if (req.user) {
      const applications = await Application.find({
        applicant: req.user._id,
        job: { $in: jobs.map((job) => job._id) },
      });

      const appliedJobIds = new Set(
        applications.map((app) => app.job.toString())
      );

      // Add application status to each job
      const jobsWithStatus = jobs.map((job) => ({
        ...job.toObject(),
        isApplied: appliedJobIds.has(job._id.toString()),
        applicationStatus: appliedJobIds.has(job._id.toString())
          ? "pending"
          : null,
      }));

      return res.json(jobsWithStatus);
    }

    res.json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get jobs by employer
router.get("/employer/:employerId", async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.params.employerId }).sort({
      createdAt: -1,
    });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Track job view
router.post("/:id/view", auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Initialize views and uniqueViews if they don't exist
    if (typeof job.views !== "number") job.views = 0;
    if (typeof job.uniqueViews !== "number") job.uniqueViews = 0;
    if (!Array.isArray(job.viewHistory)) job.viewHistory = [];

    // Increment total views
    job.views += 1;

    // Check if this is a unique view from this user
    const hasViewed = job.viewHistory.some(
      (view) => view.userId.toString() === req.user._id.toString()
    );

    if (!hasViewed) {
      job.uniqueViews += 1;
      job.viewHistory.push({
        userId: req.user._id,
        viewedAt: new Date(),
      });
    }

    await job.save();
    res.json({
      message: "View tracked successfully",
      views: job.views,
      uniqueViews: job.uniqueViews,
    });
  } catch (error) {
    console.error("Error tracking job view:", error);
    res.status(500).json({ message: "Error tracking view" });
  }
});

// Get a single job
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate(
      "employer",
      "name company"
    );
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // If user is authenticated, track the view
    if (req.user) {
      try {
        // Increment total views
        job.views += 1;

        // Check if this is a unique view from this user
        const hasViewed = job.viewHistory.some(
          (view) => view.userId.toString() === req.user._id.toString()
        );

        if (!hasViewed) {
          job.uniqueViews += 1;
          job.viewHistory.push({
            userId: req.user._id,
            viewedAt: new Date(),
          });
        }

        await job.save();
      } catch (error) {
        console.error("Error tracking view:", error);
      }
    }

    // Get application count
    const applicationCount = await Application.countDocuments({ job: job._id });

    // Return job with stats
    res.json({
      ...job.toObject(),
      stats: {
        views: job.views || 0,
        uniqueViews: job.uniqueViews || 0,
        applications: applicationCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a job
router.patch("/:id", auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if user is the employer who posted the job
    if (job.employer.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this job" });
    }

    Object.assign(job, req.body);
    await job.save();
    res.json(job);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a job
router.delete("/:id", auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if user is the employer who posted the job
    if (job.employer.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this job" });
    }

    await job.remove();
    res.json({ message: "Job deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Apply for a job
router.post("/:id/apply", auth, async (req, res) => {
  try {
    const jobId = req.params.id;
    const userId = req.user._id;
    const { coverLetter } = req.body;

    console.log("Received application request:", {
      jobId,
      userId,
      coverLetter: coverLetter ? "provided" : "not provided",
      headers: req.headers,
      params: req.params,
      body: req.body,
    });

    // Validate jobId format
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      console.log("Invalid job ID format:", jobId);
      return res.status(400).json({ message: "Invalid job ID format" });
    }

    // Check if job exists
    const job = await Job.findById(jobId);
    console.log("Job lookup result:", job ? "found" : "not found");

    if (!job) {
      console.log("Job not found:", jobId);
      return res.status(404).json({ message: "Job not found" });
    }

    // Check if user has already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: userId,
    });

    if (existingApplication) {
      console.log("Duplicate application found:", {
        jobId,
        userId,
        applicationId: existingApplication._id,
      });
      return res
        .status(400)
        .json({ message: "You have already applied for this job" });
    }

    // Create new application
    const application = new Application({
      job: jobId,
      applicant: userId,
      employer: job.employer,
      coverLetter,
      status: "pending",
    });

    await application.save();
    console.log("Application created successfully:", {
      applicationId: application._id,
      jobId,
      userId,
      employerId: job.employer,
    });

    res.status(201).json({
      message: "Application submitted successfully",
      application,
    });
  } catch (error) {
    console.error("Error in job application:", {
      error: error.message,
      stack: error.stack,
      jobId: req.params.id,
      userId: req.user?._id,
      body: req.body,
    });
    res.status(500).json({ message: "Error submitting application" });
  }
});

module.exports = router;
