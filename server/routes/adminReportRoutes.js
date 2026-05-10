const express = require('express');
const router = express.Router();
const adminReportsController = require('../controllers/adminReportsController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get(
  '/schedules/:scheduleId/participants',
  verifyToken,
  requireAdmin,
  adminReportsController.scheduleParticipantsReport
);

router.get(
  '/payments/period',
  verifyToken,
  requireAdmin,
  adminReportsController.paymentsFinanceReport
);

module.exports = router;
