const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const { auth, checkRole } = require("../middleware/auth");
const User = require("../models/User");
const Application = require("../models/Application");
const { startOfDay, subDays } = require("date-fns");

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

// Get recent applications for employer
router.get(
  "/recent-applications",
  auth,
  checkRole(["employer"]),
  async (req, res) => {
    try {
      const applications = await Application.find({ employer: req.user._id })
        .populate("applicant", "fullName email location")
        .populate("job", "title company")
        .sort({ createdAt: -1 })
        .limit(4); // Limit to 4 most recent applications

      const formattedApplications = applications.map((app) => ({
        id: app._id,
        name: app.applicant?.fullName || "Anonymous",
        email: app.applicant?.email || "No email provided",
        position: app.job?.title || "Position not specified",
        location: app.applicant?.location || "Location not specified",
        applied: app.createdAt,
        status: app.status || "pending",
      }));

      res.json(formattedApplications);
    } catch (error) {
      console.error("Error fetching recent applications:", error);
      res.status(500).json({ message: "Error fetching recent applications" });
    }
  }
);

// Get filtered jobs for employer
router.get(
  "/filtered-jobs",
  auth,
  checkRole(["employer"]),
  async (req, res) => {
    try {
      const { search, status, type, experience } = req.query;
      const query = { employer: req.user._id };

      if (status) query.status = status;
      if (type) query.type = type;
      if (experience) query.experience = experience;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: "i" } },
          { company: { $regex: search, $options: "i" } },
          { location: { $regex: search, $options: "i" } },
        ];
      }

      const jobs = await Job.find(query)
        .sort({ createdAt: -1 })
        .populate("employer", "name company");

      res.json(jobs);
    } catch (error) {
      console.error("Error fetching filtered jobs:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

// Ensure this route path matches frontend request
router.get(
  "/jobs/:id/analytics",
  auth,
  checkRole(["employer"]),
  async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);

      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }

      const applications = await Application.find({ job: job._id });

      // Calculate conversion rate as a number, not string
      const conversionRate = job.views
        ? Number((applications.length / job.views) * 100)
        : 0;

      const analyticsData = {
        job: {
          _id: job._id,
          title: job.title,
          company: job.company,
          location: job.location,
          type: job.type,
          salary: job.salary,
          experience: job.experience,
          createdAt: job.createdAt,
          status: job.status,
        },
        stats: {
          views: job.views || 0,
          uniqueViews: job.uniqueViews || 0,
          applications: applications.length,
          viewsByDate: [],
          applicationsByStatus: [
            {
              status: "pending",
              count: applications.filter((a) => a.status === "pending").length,
            },
            {
              status: "reviewed",
              count: applications.filter((a) => a.status === "reviewed").length,
            },
            {
              status: "accepted",
              count: applications.filter((a) => a.status === "accepted").length,
            },
            {
              status: "rejected",
              count: applications.filter((a) => a.status === "rejected").length,
            },
          ],
          conversionRate: conversionRate, // Send as number
          averageResponseTime: 24,
        },
      };

      res.json(analyticsData);
    } catch (error) {
      console.error("Analytics error:", error);
      res.status(500).json({ message: "Error fetching analytics data" });
    }
  }
);

module.exports = router;

// Add these helper functions at the top
const generateTimeSeriesData = (days) => {
  const data = [];
  for (let i = days; i >= 0; i--) {
    data.push({
      date: subDays(new Date(), i),
      count: 0,
    });
  }
  return data;
};
