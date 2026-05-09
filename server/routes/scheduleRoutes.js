const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const scheduleGroupController = require('../controllers/scheduleGroupController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', scheduleController.getAllSchedules);

router.get('/:id/group', verifyToken, requireAdmin, scheduleGroupController.getScheduleGroup);

router.post(
  '/:id/participants',
  verifyToken,
  requireAdmin,
  scheduleGroupController.addParticipantToSchedule
);

router.delete(
  '/:id/participants/:participantId',
  verifyToken,
  requireAdmin,
  scheduleGroupController.removeParticipantFromSchedule
);

router.get('/:id', scheduleController.getScheduleById);

router.post('/', verifyToken, requireAdmin, scheduleController.createSchedule);

router.put('/:id', verifyToken, requireAdmin, scheduleController.updateSchedule);

router.delete('/:id', verifyToken, requireAdmin, scheduleController.deleteSchedule);

module.exports = router;
