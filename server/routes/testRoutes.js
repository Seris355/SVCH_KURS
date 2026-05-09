const express = require('express');
const router = express.Router();
const testController = require('../controllers/testController');
const testQuestionsController = require('../controllers/testQuestionsController');
const { verifyToken, requireAdmin, requireParticipant } = require('../middleware/authMiddleware');


router.get('/', testController.getAllTests);


router.post('/:id/questions', verifyToken, requireAdmin, testQuestionsController.createQuestion);


router.put('/questions/:questionId', verifyToken, requireAdmin, testQuestionsController.updateQuestion);


router.delete('/questions/:questionId', verifyToken, requireAdmin, testQuestionsController.deleteQuestion);


router.post('/questions/:questionId/answers', verifyToken, requireAdmin, testQuestionsController.createAnswer);


router.put('/answers/:answerId', verifyToken, requireAdmin, testQuestionsController.updateAnswer);


router.delete('/answers/:answerId', verifyToken, requireAdmin, testQuestionsController.deleteAnswer);


router.get('/:id/take', verifyToken, requireParticipant, testController.getTestForTaking);


router.post('/:id/submit', verifyToken, requireParticipant, testController.submitTest);


router.get('/:id', verifyToken, requireAdmin, testController.getTestById);


router.post('/', verifyToken, requireAdmin, testController.createTest);


router.put('/:id', verifyToken, requireAdmin, testController.updateTest);


router.delete('/:id', verifyToken, requireAdmin, testController.deleteTest);

module.exports = router;
