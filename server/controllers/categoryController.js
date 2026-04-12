const { Category } = require('../models');
const { Op } = require('sequelize');

exports.getAllCategories = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'ASC',
      search,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const allowedSortFields = ['id', 'name'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'id';

    const { count, rows } = await Category.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[validSortBy, sortOrder.toUpperCase()]],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении списка категорий',
      error: error.message,
    });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена',
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении категории',
      error: error.message,
    });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const category = await Category.create({ name, description });

    res.status(201).json({
      success: true,
      message: 'Категория успешно создана',
      data: category,
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      let errorMessages = error.errors ? error.errors.map(e => e.message).join(', ') : error.message;
      errorMessages = errorMessages.replace(/^Validation error:\s*/i, '');
      return res.status(400).json({
        success: false,
        message: errorMessages,
        error: errorMessages,
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Категория с таким названием уже существует',
        error: 'Категория с таким названием уже существует',
      });
    }

    res.status(400).json({
      success: false,
      message: 'Ошибка при создании категории',
      error: error.message,
    });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена',
      });
    }

    await category.update({ name, description });

    res.json({
      success: true,
      message: 'Категория успешно обновлена',
      data: category,
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      let errorMessages = error.errors ? error.errors.map(e => e.message).join(', ') : error.message;
      errorMessages = errorMessages.replace(/^Validation error:\s*/i, '');
      return res.status(400).json({
        success: false,
        message: errorMessages,
        error: errorMessages,
      });
    }

    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Категория с таким названием уже существует',
        error: 'Категория с таким названием уже существует',
      });
    }

    res.status(400).json({
      success: false,
      message: 'Ошибка при обновлении категории',
      error: error.message,
    });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Категория не найдена',
      });
    }

    const { MasterClassCategory } = require('../models');
    const linkedCount = await MasterClassCategory.count({ where: { categoryId: id } });

    if (linkedCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Невозможно удалить категорию. Она привязана к ${linkedCount} мастер-классам.`,
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Категория успешно удалена',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении категории',
      error: error.message,
    });
  }
};
