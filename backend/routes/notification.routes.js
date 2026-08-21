const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ctrl = require('../controllers/notification.controller');

router.use(protect);

router.get('/', ctrl.list);
router.put('/:id/read', ctrl.markRead);
router.put('/read-all', ctrl.markAllRead);

module.exports = router;
