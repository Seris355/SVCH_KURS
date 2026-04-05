const express = require('express');
const router = express.Router();
const instructorController = require('../controllers/instructorController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');


router.get('/', instructorController.getAllInstructors);


router.get('/:id/exists', instructorController.checkInstructorExists);


router.get('/:id', instructorController.getInstructorById);


router.post('/', verifyToken, requireAdmin, instructorController.createInstructor);


router.put('/:id', verifyToken, requireAdmin, instructorController.updateInstructor);


router.delete('/:id', verifyToken, requireAdmin, instructorController.deleteInstructor);

module.exports = router;

