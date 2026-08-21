const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: [
        'owner_status',
        'owner_resubmit',
        'payment_request',
        'payment_status',
        'doctor_request',
        'doctor_request_status',
        'general',
      ],
      default: 'general',
    },
    relatedId: { type: mongoose.Schema.Types.ObjectId, default: null },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
