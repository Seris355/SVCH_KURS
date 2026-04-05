const express = require('express');
const router = express.Router();
const masterClassController = require('../controllers/masterClassController');
const { verifyToken, requireAdmin, requireParticipant } = require('../middleware/authMiddleware');


router.get('/', masterClassController.getAllMasterClasses);
router.get('/my-classes', verifyToken, requireParticipant, masterClassController.getParticipantMasterClasses);
router.get('/:id/exists', masterClassController.checkMasterClassExists);
router.get('/:id', masterClassController.getMasterClassById);
router.post('/', verifyToken, requireAdmin, masterClassController.createMasterClass);
router.post('/:id/enroll', verifyToken, requireParticipant, masterClassController.enrollParticipant);
router.put('/:id', verifyToken, requireAdmin, masterClassController.updateMasterClass);
router.delete('/:id', verifyToken, requireAdmin, masterClassController.deleteMasterClass);
module.exports = router;

