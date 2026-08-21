const Hospital = require('../models/Hospital');
const DoctorProfile = require('../models/DoctorProfile');

// GET /api/public/hospitals?search=&city=
const searchHospitals = async (req, res) => {
  const { search, city } = req.query;
  const filter = { subscriptionStatus: 'active' };
  if (city) filter.city = new RegExp(city, 'i');
  if (search) filter.name = new RegExp(search, 'i');

  const hospitals = await Hospital.find(filter).select(
    'name city address phone specialties createdAt'
  );

  // attach doctor count + how many are live right now
  const withCounts = await Promise.all(
    hospitals.map(async (h) => {
      const [doctorCount, liveCount] = await Promise.all([
        DoctorProfile.countDocuments({ hospital: h._id, requestStatus: 'approved' }),
        DoctorProfile.countDocuments({
          hospital: h._id,
          requestStatus: 'approved',
          'live.isActive': true,
        }),
      ]);
      return { ...h.toObject(), doctorCount, liveCount };
    })
  );

  res.json(withCounts);
};

// GET /api/public/hospitals/:id
const getHospital = async (req, res) => {
  const hospital = await Hospital.findOne({ _id: req.params.id, subscriptionStatus: 'active' });
  if (!hospital) return res.status(404).json({ message: 'Hospital not found' });

  const doctors = await DoctorProfile.find({
    hospital: hospital._id,
    requestStatus: 'approved',
  }).select('name specialization qualification experienceYears consultationFee avgConsultMinutes live bio');

  res.json({ hospital, doctors });
};

// GET /api/public/doctors/search?query=&specialization=
const searchDoctors = async (req, res) => {
  const { query, specialization } = req.query;
  const filter = { requestStatus: 'approved' };
  if (specialization) filter.specialization = new RegExp(specialization, 'i');
  if (query) filter.name = new RegExp(query, 'i');

  const doctors = await DoctorProfile.find(filter)
    .populate('hospital', 'name city subscriptionStatus')
    .select('name specialization qualification experienceYears consultationFee avgConsultMinutes live hospital');

  // only show doctors whose hospital subscription is currently active
  const activeOnly = doctors.filter((d) => d.hospital && d.hospital.subscriptionStatus === 'active');

  res.json(activeOnly);
};

// GET /api/public/doctors/:id — used for live polling on the doctor detail view
const getDoctor = async (req, res) => {
  const doctor = await DoctorProfile.findOne({ _id: req.params.id, requestStatus: 'approved' }).populate(
    'hospital',
    'name city address phone subscriptionStatus'
  );
  if (!doctor || !doctor.hospital || doctor.hospital.subscriptionStatus !== 'active') {
    return res.status(404).json({ message: 'Doctor not found' });
  }
  res.json(doctor);
};

module.exports = { searchHospitals, getHospital, searchDoctors, getDoctor };
