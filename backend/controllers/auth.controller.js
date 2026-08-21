const bcrypt = require('bcryptjs');
const User = require('../models/User');
const DoctorProfile = require('../models/DoctorProfile');
const generateToken = require('../utils/generateToken');

// Public self-registration — only 'owner' and 'doctor' roles allowed here.
// Admin accounts are created via the seed script, never through this endpoint.
const register = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required' });
    }
    if (!['owner', 'doctor'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either "owner" or "doctor"' });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email, password: hashed, phone, role });

    const token = generateToken(user._id, user.role);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    let doctorProfile = null;
    if (user.role === 'doctor') {
      doctorProfile = await DoctorProfile.findOne({ user: user._id });
    }

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      hasDoctorProfile: !!doctorProfile,
    });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

const getMe = async (req, res) => {
  res.json({ user: req.user });
};

// Generic profile edit available to every role (name / phone).
// Role-specific details (hospital fields, doctor specialization etc.) have
// their own dedicated edit endpoints.
const updateProfile = async (req, res) => {
  const { name, phone } = req.body;
  if (name) req.user.name = name;
  if (phone !== undefined) req.user.phone = phone;
  await req.user.save();
  res.json({ user: req.user });
};

module.exports = { register, login, getMe, updateProfile };
