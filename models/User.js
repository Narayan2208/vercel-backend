const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["jobseeker", "employer"],
      default: "jobseeker",
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    experience: [
      {
        company: {
          type: String,
          required: true,
          trim: true,
        },
        position: {
          type: String,
          required: true,
          trim: true,
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
        },
        description: {
          type: String,
          trim: true,
        },
      },
    ],
    education: [
      {
        institution: {
          type: String,
          required: true,
          trim: true,
        },
        degree: {
          type: String,
          required: true,
          trim: true,
        },
        field: {
          type: String,
          required: true,
          trim: true,
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
        },
        description: {
          type: String,
          trim: true,
        },
      },
    ],
    certifications: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        issuer: {
          type: String,
          required: true,
          trim: true,
        },
        date: {
          type: Date,
          required: true,
        },
        description: {
          type: String,
          trim: true,
        },
      },
    ],
    socialLinks: {
      linkedin: {
        type: String,
        trim: true,
      },
      github: {
        type: String,
        trim: true,
      },
      portfolio: {
        type: String,
        trim: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 8);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
