const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  studentID: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  grade: {
    type: String,
    required: true,
    trim: true
  },
  studentType: {
    type: String,
    enum: ["Regular", "Temporary"],
    required: true,
    default: "Regular"
  },
  parentName: {
    type: String,
    required: true,
    trim: true
  },
  parentPhone: {
    type: String,
    required: true,
    trim: true
  },
  emergencyContact: {
    type: String,
    required: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  status: {
    type: String,
    enum: ["Active", "Inactive", "Suspended"],
    default: "Active"
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
studentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Student", studentSchema);