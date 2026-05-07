const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const { verifyToken, requireAdmin, requireParticipant } = require('../middleware/authMiddleware');


router.get('/', testController.getAllTests);


router.get('/:id/take', verifyToken, requireParticipant, testController.getTestForTaking);


router.post('/:id/submit', verifyToken, requireParticipant, testController.submitTest);


router.get('/:id', verifyToken, requireAdmin, testController.getTestById);


router.post('/', verifyToken, requireAdmin, testController.createTest);


router.put('/:id', verifyToken, requireAdmin, testController.updateTest);


router.delete('/:id', verifyToken, requireAdmin, testController.deleteTest);

module.exports = router;
