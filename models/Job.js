const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    required: true,
    enum: ["full-time", "part-time", "contract", "internship"],
  },
  description: {
    type: String,
    required: true,
  },
  requirements: {
    type: String,
    required: true,
  },
  salary: {
    type: String,
    required: true,
  },
  experience: {
    type: String,
    required: true,
    enum: ["entry", "mid", "senior", "lead", "manager"],
  },
  skills: {
    type: String,
    required: true,
  },
  employer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "closed", "draft"],
    default: "active",
  },
  views: {
    type: Number,
    default: 0,
  },
  uniqueViews: {
    type: Number,
    default: 0,
  },
  viewHistory: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      viewedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  analyticsData: {
    viewsByDate: [
      {
        date: { type: Date },
        count: { type: Number, default: 0 },
      },
    ],
    applicationsByDate: [
      {
        date: { type: Date },
        count: { type: Number, default: 0 },
      },
    ],
    applicationsByStatus: [
      {
        status: { type: String },
        count: { type: Number, default: 0 },
      },
    ],
    timeOfDayData: [
      {
        hour: { type: Number },
        views: { type: Number, default: 0 },
      },
    ],
    sourceBreakdown: [
      {
        source: { type: String },
        count: { type: Number, default: 0 },
      },
    ],
  },
});

// Update the updatedAt timestamp before saving
jobSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Job", jobSchema);
