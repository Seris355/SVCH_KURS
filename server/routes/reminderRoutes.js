const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { verifyToken, requireParticipant } = require('../middleware/authMiddleware');

router.get(
  '/upcoming',
  verifyToken,
  requireParticipant,
  reminderController.getUpcomingReminders
);

module.exports = router;
