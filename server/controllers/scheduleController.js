const { Schedule, MasterClass, Location } = require('../models');
const { Op } = require('sequelize');

exports.getAllSchedules = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'startDate',
      sortOrder = 'ASC',
      masterClassId,
      locationId,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (masterClassId) where.masterClassId = masterClassId;
    if (locationId) where.locationId = locationId;

    const allowedSortFields = ['id', 'startDate', 'endDate', 'maxParticipants'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'startDate';

    const { count, rows } = await Schedule.findAndCountAll({
      where,
      include: [
        { model: MasterClass, as: 'masterClass', attributes: ['id', 'name', 'price'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'address', 'capacity'] },
      ],
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
      message: 'Ошибка при получении расписания',
      error: error.message,
    });
  }
};

exports.getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByPk(id, {
      include: [
        { model: MasterClass, as: 'masterClass', attributes: ['id', 'name', 'price'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'address', 'capacity'] },
      ],
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Сеанс расписания не найден',
      });
    }

    res.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении сеанса расписания',
      error: error.message,
    });
  }
};

exports.createSchedule = async (req, res) => {
  try {
    const { masterClassId, locationId, startDate, endDate, maxParticipants } = req.body;

    const masterClass = await MasterClass.findByPk(masterClassId);
    if (!masterClass) {
      return res.status(404).json({
        success: false,
        message: 'Мастер-класс не найден',
      });
    }

    const location = await Location.findByPk(locationId);
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Место проведения не найдено',
      });
    }

    if (maxParticipants > location.capacity) {
      return res.status(400).json({
        success: false,
        message: `Максимум участников (${maxParticipants}) превышает вместимость зала (${location.capacity})`,
      });
    }

    const schedule = await Schedule.create({ masterClassId, locationId, startDate, endDate, maxParticipants });

    const result = await Schedule.findByPk(schedule.id, {
      include: [
        { model: MasterClass, as: 'masterClass', attributes: ['id', 'name', 'price'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'address', 'capacity'] },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Сеанс расписания успешно создан',
      data: result,
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
      message: 'Ошибка при создании сеанса расписания',
      error: error.message,
    });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { masterClassId, locationId, startDate, endDate, maxParticipants } = req.body;

    const schedule = await Schedule.findByPk(id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Сеанс расписания не найден',
      });
    }

    const targetLocationId = locationId || schedule.locationId;
    const location = await Location.findByPk(targetLocationId);

    if (maxParticipants && location && maxParticipants > location.capacity) {
      return res.status(400).json({
        success: false,
        message: `Максимум участников (${maxParticipants}) превышает вместимость зала (${location.capacity})`,
      });
    }

    await schedule.update({ masterClassId, locationId, startDate, endDate, maxParticipants });

    const result = await Schedule.findByPk(id, {
      include: [
        { model: MasterClass, as: 'masterClass', attributes: ['id', 'name', 'price'] },
        { model: Location, as: 'location', attributes: ['id', 'name', 'address', 'capacity'] },
      ],
    });

    res.json({
      success: true,
      message: 'Сеанс расписания успешно обновлён',
      data: result,
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
      message: 'Ошибка при обновлении сеанса расписания',
      error: error.message,
    });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByPk(id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Сеанс расписания не найден',
      });
    }

    const { Payment } = require('../models');
    const paymentsCount = await Payment.count({ where: { scheduleId: id } });

    if (paymentsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Невозможно удалить сеанс. К нему привязано ${paymentsCount} записей об оплате.`,
      });
    }

    await schedule.destroy();

    res.json({
      success: true,
      message: 'Сеанс расписания успешно удалён',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении сеанса расписания',
      error: error.message,
    });
  }
};
