const User = require('../models/User');
const Hospital = require('../models/Hospital');
const DoctorProfile = require('../models/DoctorProfile');
const { notifyUser } = require('../utils/notify');

// ---- Owner approval ----

const listOwners = async (req, res) => {
  const { status } = req.query; // optional filter: pending | approved | rejected
  const filter = { role: 'owner' };
  if (status) filter.status = status;
  const owners = await User.find(filter).select('-password').sort({ createdAt: -1 });
  res.json(owners);
};

const setOwnerStatus = async (req, res) => {
  const { id } = req.params;
  const { status, reason } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'status must be approved or rejected' });
  }
  const owner = await User.findOne({ _id: id, role: 'owner' });
  if (!owner) return res.status(404).json({ message: 'Owner not found' });

  owner.status = status;
  await owner.save();

  await notifyUser(
    owner._id,
    status === 'approved'
      ? 'Your hospital owner account was approved! You can now add a hospital.'
      : `Your hospital owner account request was rejected${reason ? `: ${reason}` : ''}. You can edit your details and resubmit.`,
    'owner_status',
    owner._id
  );

  res.json({ message: `Owner ${status}`, owner });
};

// ---- Hospitals overview ----

const listHospitals = async (req, res) => {
  const hospitals = await Hospital.find()
    .populate('owner', 'name email phone')
    .sort({ createdAt: -1 });
  res.json(hospitals);
};

// Admin override — a manual escape hatch (admin "manages everything"), separate
// from the owner-initiated payment-request flow below.
const overrideSubscription = async (req, res) => {
  const { id } = req.params;
  const { subscriptionStatus } = req.body;
  if (!['unpaid', 'active', 'expired'].includes(subscriptionStatus)) {
    return res.status(400).json({ message: 'Invalid subscriptionStatus' });
  }
  const hospital = await Hospital.findById(id);
  if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

  hospital.subscriptionStatus = subscriptionStatus;
  if (subscriptionStatus === 'active') {
    hospital.lastPaidAt = new Date();
    const due = new Date();
    due.setDate(due.getDate() + 30);
    hospital.nextDueAt = due;
  }
  await hospital.save();
  res.json(hospital);
};

// ---- Payment requests (owner submits -> admin reviews) ----

const listPaymentRequests = async (req, res) => {
  const hospitals = await Hospital.find({ paymentStatus: 'pending' })
    .populate('owner', 'name email phone')
    .sort({ updatedAt: -1 });
  res.json(hospitals);
};

const decidePayment = async (req, res) => {
  const { id } = req.params;
  const { decision, reason } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: 'decision must be approved or rejected' });
  }
  const hospital = await Hospital.findById(id);
  if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

  hospital.paymentStatus = decision;
  if (decision === 'approved') {
    hospital.subscriptionStatus = 'active';
    hospital.lastPaidAt = new Date();
    const due = new Date();
    due.setDate(due.getDate() + 30);
    hospital.nextDueAt = due;
    hospital.paymentRejectionReason = '';
  } else {
    hospital.paymentRejectionReason = reason || '';
  }
  await hospital.save();

  await notifyUser(
    hospital.owner,
    decision === 'approved'
      ? `Your payment for "${hospital.name}" was approved. Subscription is active for 30 days.`
      : `Your payment request for "${hospital.name}" was rejected${reason ? `: ${reason}` : ''}. You can edit and resubmit.`,
    'payment_status',
    hospital._id
  );

  res.json(hospital);
};

// ---- Doctors overview ----

const listDoctors = async (req, res) => {
  const doctors = await DoctorProfile.find()
    .populate('user', 'name email phone status')
    .populate('hospital', 'name city')
    .populate('requestedHospital', 'name city')
    .sort({ createdAt: -1 });
  res.json(doctors);
};

// ---- Dashboard stats ----

const stats = async (req, res) => {
  const [pendingOwners, totalHospitals, activeHospitals, totalDoctors, approvedDoctors, pendingPayments] =
    await Promise.all([
      User.countDocuments({ role: 'owner', status: 'pending' }),
      Hospital.countDocuments(),
      Hospital.countDocuments({ subscriptionStatus: 'active' }),
      DoctorProfile.countDocuments(),
      DoctorProfile.countDocuments({ requestStatus: 'approved' }),
      Hospital.countDocuments({ paymentStatus: 'pending' }),
    ]);

  const monthlyRevenue = activeHospitals * 2000;

  res.json({
    pendingOwners,
    totalHospitals,
    activeHospitals,
    totalDoctors,
    approvedDoctors,
    pendingPayments,
    monthlyRevenue,
  });
};

module.exports = {
  listOwners,
  setOwnerStatus,
  listHospitals,
  overrideSubscription,
  listPaymentRequests,
  decidePayment,
  listDoctors,
  stats,
};
