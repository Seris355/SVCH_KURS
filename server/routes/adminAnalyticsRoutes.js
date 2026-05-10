const express = require('express');
const router = express.Router();
const adminAnalyticsController = require('../controllers/adminAnalyticsController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get(
  '/dashboard',
  verifyToken,
  requireAdmin,
  adminAnalyticsController.getDashboard
);

module.exports = router;
