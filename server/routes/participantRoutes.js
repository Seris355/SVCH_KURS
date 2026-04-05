const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');


router.get('/', verifyToken, requireAdmin, participantController.getAllParticipants);
router.get('/:id/exists', verifyToken, requireAdmin, participantController.checkParticipantExists);
router.get('/:id', verifyToken, requireAdmin, participantController.getParticipantById);
router.put('/:id/password', verifyToken, requireAdmin, participantController.changePassword);
router.delete('/:id', verifyToken, requireAdmin, participantController.deleteParticipant);
module.exports = router;

