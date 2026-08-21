// One-time script to create your admin account.
// Run with: npm run seed:admin
require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

(async () => {
  await connectDB();

  const name = process.env.ADMIN_NAME || 'Admin';
  const email = (process.env.ADMIN_EMAIL || 'admin@example.com').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin already exists for ${email}. Nothing to do.`);
    process.exit(0);
  }

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  await User.create({ name, email, password: hashed, role: 'admin', status: 'approved' });

  console.log(`Admin account created!`);
  console.log(`  email:    ${email}`);
  console.log(`  password: ${password}`);
  console.log(`Log in at /login with role = admin.`);
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
