const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    specialties: [{ type: String, trim: true }],
    feeAmount: { type: Number, default: 2000 },
    // Driven by admin decision, not owner self-service
    subscriptionStatus: {
      type: String,
      enum: ['unpaid', 'active', 'expired'],
      default: 'unpaid',
    },
    // Owner submits a payment request -> admin approves/rejects it
    paymentStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none',
    },
    paymentReference: { type: String, trim: true, default: '' },
    paymentRejectionReason: { type: String, trim: true, default: '' },
    lastPaidAt: { type: Date, default: null },
    nextDueAt: { type: Date, default: null },
  },
  { timestamps: true }
);

hospitalSchema.index({ name: 'text', city: 'text' });

module.exports = mongoose.model('Hospital', hospitalSchema);
