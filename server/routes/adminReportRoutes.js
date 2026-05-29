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
  '/schedules/:scheduleId/participants/pdf',
  verifyToken,
  requireAdmin,
  adminReportsController.exportScheduleParticipantsPdf
);

router.get(
  '/payments/period',
  verifyToken,
  requireAdmin,
  adminReportsController.paymentsFinanceReport
);

router.get(
  '/payments/period/pdf',
  verifyToken,
  requireAdmin,
  adminReportsController.exportPaymentsFinancePdf
);

module.exports = router;
