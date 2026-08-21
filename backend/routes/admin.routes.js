const express = require('express');
const router = express.Router();
const { protect, allow } = require('../middleware/auth');
const ctrl = require('../controllers/admin.controller');

router.use(protect, allow('admin'));

router.get('/owners', ctrl.listOwners);
router.put('/owners/:id/status', ctrl.setOwnerStatus);

router.get('/hospitals', ctrl.listHospitals);
router.put('/hospitals/:id/subscription', ctrl.overrideSubscription);

router.get('/payment-requests', ctrl.listPaymentRequests);
router.put('/payment-requests/:id', ctrl.decidePayment);

router.get('/doctors', ctrl.listDoctors);

router.get('/stats', ctrl.stats);

module.exports = router;
