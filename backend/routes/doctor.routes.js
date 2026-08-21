const express = require('express');
const router = express.Router();
const { protect, allow } = require('../middleware/auth');
const ctrl = require('../controllers/doctor.controller');

router.use(protect, allow('doctor'));

router.get('/profile', ctrl.getMyProfile);
router.post('/profile', ctrl.createProfile);
router.put('/profile', ctrl.updateProfile);

router.post('/request-hospital', ctrl.requestHospital);
router.put('/live', ctrl.updateLive);

module.exports = router;
