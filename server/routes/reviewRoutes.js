const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { verifyToken, requireParticipant } = require('../middleware/authMiddleware');

router.post('/', verifyToken, requireParticipant, reviewController.createReview);

module.exports = router;
