const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { verifyToken, requireAdmin, requireParticipant } = require('../middleware/authMiddleware');


router.get('/my', verifyToken, requireParticipant, paymentController.myPayments);


router.get('/', verifyToken, requireAdmin, paymentController.listPayments);


router.put('/:id/paid', verifyToken, paymentController.markPaid);

module.exports = router;
