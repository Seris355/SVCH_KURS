const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', locationController.getAllLocations);

router.get('/:id', locationController.getLocationById);

router.post('/', verifyToken, requireAdmin, locationController.createLocation);

router.put('/:id', verifyToken, requireAdmin, locationController.updateLocation);

router.delete('/:id', verifyToken, requireAdmin, locationController.deleteLocation);

module.exports = router;
