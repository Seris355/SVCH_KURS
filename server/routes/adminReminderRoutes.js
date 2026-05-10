const express = require('express');
const router = express.Router();
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');
const { runSessionReminderJob } = require('../jobs/sessionReminderJob');
const { smtpConfigured } = require('../utils/mail');

router.post(
  '/run-session-reminders',
  verifyToken,
  requireAdmin,
  async (req, res) => {
    try {
      const data = await runSessionReminderJob();
      res.json({
        success: true,
        message: smtpConfigured() ?
          'Reminder job finished.'
        : 'SMTP not configured — no mails were delivered.',
        data,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message || 'Reminder job failed',
      });
    }
  }
);

router.get(
  '/status',
  verifyToken,
  requireAdmin,
  (req, res) => {
    res.json({
      success: true,
      data: {
        smtpConfigured: smtpConfigured(),
        remindersEnabledEnv: process.env.ENABLE_SESSION_REMINDERS === 'true',
      },
    });
  }
);

module.exports = router;
