const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { verifyToken, requireAdmin, optionalAttachUser } = require('../middleware/authMiddleware');


router.post('/', optionalAttachUser, contactController.createContactRequest);


router.get('/', verifyToken, requireAdmin, contactController.getAllContactRequests);


router.put('/:id/read', verifyToken, requireAdmin, contactController.markAsRead);

module.exports = router;
