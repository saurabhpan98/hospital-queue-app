const mongoose = require('mongoose');

const doctorProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    qualification: { type: String, trim: true },
    experienceYears: { type: Number, default: 0 },
    consultationFee: { type: Number, default: 0 },
    avgConsultMinutes: { type: Number, default: 10 },
    bio: { type: String, trim: true, maxlength: 500 },

    // Hospital affiliation workflow
    requestedHospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
    hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', default: null },
    requestStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },

    // Live queue state, controlled by the doctor
    live: {
      currentToken: { type: Number, default: 0 },
      totalTokensToday: { type: Number, default: 0 },
      delayMinutes: { type: Number, default: 0 },
      isActive: { type: Boolean, default: false },
      lastUpdated: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

doctorProfileSchema.index({ name: 'text', specialization: 'text' });

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
