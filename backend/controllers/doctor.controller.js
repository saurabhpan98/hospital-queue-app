const DoctorProfile = require('../models/DoctorProfile');
const Hospital = require('../models/Hospital');
const { notifyUser } = require('../utils/notify');

const getMyProfile = async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.user._id })
    .populate('hospital', 'name city subscriptionStatus')
    .populate('requestedHospital', 'name city');
  res.json(profile); // null if not created yet - frontend handles that
};

const createProfile = async (req, res) => {
  const existing = await DoctorProfile.findOne({ user: req.user._id });
  if (existing) {
    return res.status(409).json({ message: 'Profile already exists, use update instead' });
  }

  const { name, specialization, qualification, experienceYears, consultationFee, avgConsultMinutes, bio } =
    req.body;

  if (!name || !specialization) {
    return res.status(400).json({ message: 'Name and specialization are required' });
  }

  const profile = await DoctorProfile.create({
    user: req.user._id,
    name,
    specialization,
    qualification,
    experienceYears,
    consultationFee,
    avgConsultMinutes,
    bio,
  });

  res.status(201).json(profile);
};

// Doctor can edit their profile any time - including after being approved,
// so changes (e.g. fee, bio) reflect immediately for patients.
const updateProfile = async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.user._id });
  if (!profile) return res.status(404).json({ message: 'Profile not found' });

  const editable = [
    'name',
    'specialization',
    'qualification',
    'experienceYears',
    'consultationFee',
    'avgConsultMinutes',
    'bio',
  ];
  editable.forEach((field) => {
    if (req.body[field] !== undefined) profile[field] = req.body[field];
  });

  await profile.save();
  res.json(profile);
};

// Doctor sends a request to join a hospital (owner must approve).
// Also doubles as the "resubmit" action: if a previous request was rejected,
// calling this again (same or different hospital) puts it back to pending.
const requestHospital = async (req, res) => {
  const { hospitalId } = req.body;
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

  const profile = await DoctorProfile.findOne({ user: req.user._id });
  if (!profile) return res.status(404).json({ message: 'Create your doctor profile first' });

  if (profile.requestStatus === 'approved' && profile.hospital) {
    return res.status(400).json({ message: 'You are already affiliated with a hospital' });
  }

  profile.requestedHospital = hospitalId;
  profile.requestStatus = 'pending';
  profile.hospital = null;
  await profile.save();

  await notifyUser(
    hospital.owner,
    `Dr. ${profile.name} (${profile.specialization}) requested to join ${hospital.name}.`,
    'doctor_request',
    profile._id
  );

  res.json({ message: 'Request sent to hospital owner', profile });
};

// Doctor controls their own live token/queue
const updateLive = async (req, res) => {
  const profile = await DoctorProfile.findOne({ user: req.user._id });
  if (!profile) return res.status(404).json({ message: 'Profile not found' });

  if (profile.requestStatus !== 'approved' || !profile.hospital) {
    return res.status(403).json({ message: 'You must be approved by a hospital before setting live status' });
  }

  const { currentToken, delayMinutes, isActive, incrementToken } = req.body;

  if (incrementToken) {
    profile.live.currentToken += 1;
    profile.live.totalTokensToday += 1;
  }
  if (currentToken !== undefined) profile.live.currentToken = currentToken;
  if (delayMinutes !== undefined) profile.live.delayMinutes = delayMinutes;
  if (isActive !== undefined) profile.live.isActive = isActive;
  profile.live.lastUpdated = new Date();

  await profile.save();
  res.json(profile);
};

module.exports = { getMyProfile, createProfile, updateProfile, requestHospital, updateLive };
