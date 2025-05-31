const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    employer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    coverLetter: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "accepted", "rejected"],
      default: "pending",
    },
    notes: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index to ensure a user can only apply once to a job
applicationSchema.index({ job: 1, applicant: 1 }, { unique: true });

const Application = mongoose.model("Application", applicationSchema);

module.exports = Application;
