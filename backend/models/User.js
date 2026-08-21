const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['admin', 'owner', 'doctor'], required: true },
    // Owners need admin approval before they can add hospitals.
    // Doctors don't need admin approval (they get approved by a hospital owner instead),
    // so their account status starts approved.
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: function () {
        return this.role === 'owner' ? 'pending' : 'approved';
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
