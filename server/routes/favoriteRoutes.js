const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favoriteController');
const { verifyToken, requireParticipant } = require('../middleware/authMiddleware');


router.get('/', verifyToken, requireParticipant, favoriteController.getMyFavorites);


router.post('/:masterClassId', verifyToken, requireParticipant, favoriteController.addFavorite);


router.delete('/:masterClassId', verifyToken, requireParticipant, favoriteController.removeFavorite);

module.exports = router;
