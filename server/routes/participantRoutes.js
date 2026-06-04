const express = require('express');
const router = express.Router();
const participantController = require('../controllers/participantController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');


router.get('/', verifyToken, requireAdmin, participantController.getAllParticipants);
router.get('/export/pdf', verifyToken, requireAdmin, participantController.exportParticipantsPdf);
router.get('/:id/exists', verifyToken, requireAdmin, participantController.checkParticipantExists);
router.post('/', verifyToken, requireAdmin, participantController.createParticipant);
router.put('/:id', verifyToken, requireAdmin, participantController.updateParticipant);
router.get('/:id', verifyToken, requireAdmin, participantController.getParticipantById);
router.put('/:id/password', verifyToken, requireAdmin, participantController.changePassword);
router.delete('/:id', verifyToken, requireAdmin, participantController.deleteParticipant);
module.exports = router;

