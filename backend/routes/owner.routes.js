const express = require('express');
const router = express.Router();
const { protect, allow } = require('../middleware/auth');
const ctrl = require('../controllers/owner.controller');

router.use(protect, allow('owner'));

router.get('/hospitals', ctrl.myHospitals);
router.post('/hospitals', ctrl.addHospital);
router.put('/hospitals/:id', ctrl.editHospital);
router.put('/hospitals/:id/submit-payment', ctrl.submitPayment);

router.get('/doctor-requests', ctrl.doctorRequests);
router.get('/doctors', ctrl.myDoctors);
router.put('/doctor-requests/:id', ctrl.respondToDoctorRequest);

router.put('/resubmit', ctrl.resubmit);

module.exports = router;
