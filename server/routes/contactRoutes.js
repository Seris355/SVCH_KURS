const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { verifyToken, requireAdmin, requireParticipant, optionalAttachUser } = require('../middleware/authMiddleware');


router.post('/', optionalAttachUser, contactController.createContactRequest);
router.get('/my', verifyToken, requireParticipant, contactController.getMyThread);
router.post('/my/messages', verifyToken, requireParticipant, contactController.sendParticipantMessage);


router.get('/', verifyToken, requireAdmin, contactController.getAllContactRequests);
router.get('/threads/unread-count', verifyToken, requireAdmin, contactController.getUnreadCount);
router.get('/threads', verifyToken, requireAdmin, contactController.getThreads);
router.post('/threads/start', verifyToken, requireAdmin, contactController.startAdminThread);
router.get('/threads/:threadId', verifyToken, requireAdmin, contactController.getAdminThread);
router.post('/threads/:threadId/messages', verifyToken, requireAdmin, contactController.sendAdminMessage);


router.put('/:id/read', verifyToken, requireAdmin, contactController.markAsRead);

module.exports = router;
