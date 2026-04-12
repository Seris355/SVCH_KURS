const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', scheduleController.getAllSchedules);

router.get('/:id', scheduleController.getScheduleById);

router.post('/', verifyToken, requireAdmin, scheduleController.createSchedule);

router.put('/:id', verifyToken, requireAdmin, scheduleController.updateSchedule);

router.delete('/:id', verifyToken, requireAdmin, scheduleController.deleteSchedule);

module.exports = router;
