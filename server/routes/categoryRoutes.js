const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

router.get('/', categoryController.getAllCategories);

router.get('/:id', categoryController.getCategoryById);

router.post('/', verifyToken, requireAdmin, categoryController.createCategory);

router.put('/:id', verifyToken, requireAdmin, categoryController.updateCategory);

router.delete('/:id', verifyToken, requireAdmin, categoryController.deleteCategory);

module.exports = router;
