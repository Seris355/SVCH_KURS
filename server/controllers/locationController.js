const { Location } = require('../models');
const { Op } = require('sequelize');

exports.getAllLocations = async (req, res) => {
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
        { address: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const allowedSortFields = ['id', 'name', 'capacity'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'id';

    const { count, rows } = await Location.findAndCountAll({
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
      message: 'Ошибка при получении списка мест проведения',
      error: error.message,
    });
  }
};

exports.getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await Location.findByPk(id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Место проведения не найдено',
      });
    }

    res.json({
      success: true,
      data: location,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении места проведения',
      error: error.message,
    });
  }
};

exports.createLocation = async (req, res) => {
  try {
    const { name, address, capacity } = req.body;

    const location = await Location.create({ name, address, capacity });

    res.status(201).json({
      success: true,
      message: 'Место проведения успешно создано',
      data: location,
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

    res.status(400).json({
      success: false,
      message: 'Ошибка при создании места проведения',
      error: error.message,
    });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, capacity } = req.body;

    const location = await Location.findByPk(id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Место проведения не найдено',
      });
    }

    await location.update({ name, address, capacity });

    res.json({
      success: true,
      message: 'Место проведения успешно обновлено',
      data: location,
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

    res.status(400).json({
      success: false,
      message: 'Ошибка при обновлении места проведения',
      error: error.message,
    });
  }
};

exports.deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await Location.findByPk(id);

    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Место проведения не найдено',
      });
    }

    const { Schedule } = require('../models');
    const schedulesCount = await Schedule.count({ where: { locationId: id } });

    if (schedulesCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Невозможно удалить место проведения. К нему привязано ${schedulesCount} сеансов расписания.`,
      });
    }

    await location.destroy();

    res.json({
      success: true,
      message: 'Место проведения успешно удалено',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении места проведения',
      error: error.message,
    });
  }
};
