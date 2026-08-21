const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/public.controller');

router.get('/hospitals', ctrl.searchHospitals);
router.get('/hospitals/:id', ctrl.getHospital);
router.get('/doctors/search', ctrl.searchDoctors);
router.get('/doctors/:id', ctrl.getDoctor);

module.exports = router;
