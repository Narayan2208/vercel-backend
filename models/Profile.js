const mongoose = require("mongoose");

const experienceSchema = new mongoose.Schema({
  title: String,
  company: String,
  location: String,
  start_date: String,
  end_date: String,
  description: String,
});

const educationSchema = new mongoose.Schema({
  school: String,
  degree: String,
  field: String,
  start_date: String,
  end_date: String,
});

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["jobseeker", "employer"],
      required: true,
    },
    avatar_url: String,
    headline: String,
    summary: String,
    experience: [experienceSchema],
    education: [educationSchema],
    skills: [String],
    resume_url: String,
    linkedin_url: String,
    github_url: String,
    portfolio_url: String,
    phone: String,
    location: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Profile", profileSchema);
