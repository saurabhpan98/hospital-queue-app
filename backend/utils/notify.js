const Notification = require('../models/Notification');
const User = require('../models/User');

// Notify a single user (fire-and-forget style, but awaited so callers can rely on ordering)
const notifyUser = async (userId, message, type = 'general', relatedId = null) => {
  try {
    await Notification.create({ user: userId, message, type, relatedId });
  } catch (err) {
    console.error('notifyUser failed:', err.message);
  }
};

// Notify every admin account (there's usually just one, but this stays correct if more exist)
const notifyAdmins = async (message, type = 'general', relatedId = null) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id');
    await Promise.all(admins.map((a) => Notification.create({ user: a._id, message, type, relatedId })));
  } catch (err) {
    console.error('notifyAdmins failed:', err.message);
  }
};

module.exports = { notifyUser, notifyAdmins };
