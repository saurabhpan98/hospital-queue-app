const Hospital = require('../models/Hospital');
const DoctorProfile = require('../models/DoctorProfile');
const { notifyUser, notifyAdmins } = require('../utils/notify');

// Guard used inline: owner must be admin-approved before touching hospitals
const ensureApprovedOwner = (req, res) => {
  if (req.user.status !== 'approved') {
    res.status(403).json({
      message:
        'Your owner account is not yet approved by the admin. Please wait for authorization.',
    });
    return false;
  }
  return true;
};

const myHospitals = async (req, res) => {
  const hospitals = await Hospital.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.json(hospitals);
};

const addHospital = async (req, res) => {
  if (!ensureApprovedOwner(req, res)) return;

  const { name, address, city, phone, specialties } = req.body;
  if (!name || !city) {
    return res.status(400).json({ message: 'Hospital name and city are required' });
  }

  const hospital = await Hospital.create({
    owner: req.user._id,
    name,
    address,
    city,
    phone,
    specialties: Array.isArray(specialties)
      ? specialties
      : (specialties || '').split(',').map((s) => s.trim()).filter(Boolean),
    subscriptionStatus: 'unpaid',
  });

  res.status(201).json(hospital);
};

// Owner can edit their hospital's details at any time
const editHospital = async (req, res) => {
  const { id } = req.params;
  const hospital = await Hospital.findOne({ _id: id, owner: req.user._id });
  if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

  const editable = ['name', 'address', 'city', 'phone'];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) hospital[field] = req.body[field];
  });
  if (req.body.specialties !== undefined) {
    hospital.specialties = Array.isArray(req.body.specialties)
      ? req.body.specialties
      : (req.body.specialties || '').split(',').map((s) => s.trim()).filter(Boolean);
  }

  await hospital.save();
  res.json(hospital);
};

// Owner submits a monthly payment request (Rs 2000/hospital) for admin review.
// Can be called again after a rejection, with an edited reference, to resubmit.
const submitPayment = async (req, res) => {
  const { id } = req.params;
  const { paymentReference } = req.body;

  const hospital = await Hospital.findOne({ _id: id, owner: req.user._id });
  if (!hospital) return res.status(404).json({ message: 'Hospital not found' });
  if (hospital.subscriptionStatus === 'active') {
    return res.status(400).json({ message: 'Subscription is already active' });
  }
  if (hospital.paymentStatus === 'pending') {
    return res.status(400).json({ message: 'A payment request is already awaiting review' });
  }

  hospital.paymentStatus = 'pending';
  hospital.paymentReference = paymentReference || '';
  hospital.paymentRejectionReason = '';
  await hospital.save();

  await notifyAdmins(
    `${req.user.name} submitted a Rs ${hospital.feeAmount} payment request for "${hospital.name}"`,
    'payment_request',
    hospital._id
  );

  res.json({ message: 'Payment request submitted for admin review', hospital });
};

// Doctors who requested to join one of this owner's hospitals
const doctorRequests = async (req, res) => {
  const hospitals = await Hospital.find({ owner: req.user._id }).select('_id');
  const hospitalIds = hospitals.map((h) => h._id);

  const pending = await DoctorProfile.find({
    requestedHospital: { $in: hospitalIds },
    requestStatus: 'pending',
  })
    .populate('user', 'name email phone')
    .populate('requestedHospital', 'name city');

  res.json(pending);
};

// All doctors already confirmed at this owner's hospitals
const myDoctors = async (req, res) => {
  const hospitals = await Hospital.find({ owner: req.user._id }).select('_id');
  const hospitalIds = hospitals.map((h) => h._id);

  const doctors = await DoctorProfile.find({
    hospital: { $in: hospitalIds },
    requestStatus: 'approved',
  })
    .populate('user', 'name email phone')
    .populate('hospital', 'name city');

  res.json(doctors);
};

const respondToDoctorRequest = async (req, res) => {
  const { id } = req.params; // doctorProfile id
  const { decision } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ message: 'decision must be approved or rejected' });
  }

  const profile = await DoctorProfile.findById(id).populate('requestedHospital');
  if (!profile) return res.status(404).json({ message: 'Doctor profile not found' });

  if (!profile.requestedHospital || String(profile.requestedHospital.owner) !== String(req.user._id)) {
    return res.status(403).json({ message: 'This request does not belong to one of your hospitals' });
  }

  profile.requestStatus = decision;
  if (decision === 'approved') {
    profile.hospital = profile.requestedHospital._id;
  } else {
    profile.hospital = null;
  }
  await profile.save();

  await notifyUser(
    profile.user,
    decision === 'approved'
      ? `You're approved! You can now set your live queue at ${profile.requestedHospital.name}.`
      : `Your request to join ${profile.requestedHospital.name} was declined. You can request another hospital, or resubmit.`,
    'doctor_request_status',
    profile._id
  );

  res.json({ message: `Doctor request ${decision}`, profile });
};

// Owner account was rejected by admin -> edit details and resubmit for review
const resubmit = async (req, res) => {
  if (req.user.status !== 'rejected') {
    return res.status(400).json({ message: 'Only a rejected account can be resubmitted' });
  }
  const { name, phone } = req.body;
  if (name) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  req.user.status = 'pending';
  await req.user.save();

  await notifyAdmins(`${req.user.name} resubmitted their owner approval request`, 'owner_resubmit', req.user._id);

  res.json({ message: 'Resubmitted for admin review', user: req.user });
};

module.exports = {
  myHospitals,
  addHospital,
  editHospital,
  submitPayment,
  doctorRequests,
  myDoctors,
  respondToDoctorRequest,
  resubmit,
};
