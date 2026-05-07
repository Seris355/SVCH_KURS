const { ContactRequest, Participant } = require('../models');
const { Op } = require('sequelize');

exports.createContactRequest = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedEmail = typeof email === 'string' ? email.trim() : '';
    const trimmedMessage = typeof message === 'string' ? message.trim() : '';

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return res.status(400).json({
        success: false,
        message: 'Заполните имя, e-mail и текст сообщения',
      });
    }

    let participantId = null;
    if (req.user && req.user.role === 'participant') {
      participantId = req.user.id;
    }

    const row = await ContactRequest.create({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
      participantId,
    });

    res.status(201).json({
      success: true,
      message: 'Сообщение отправлено',
      data: { id: row.id },
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      let errorMessages = error.errors ? error.errors.map((e) => e.message).join(', ') : error.message;
      errorMessages = errorMessages.replace(/^Validation error:\s*/i, '');
      return res.status(400).json({
        success: false,
        message: errorMessages,
        error: errorMessages,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Не удалось сохранить обращение',
      error: error.message,
    });
  }
};

exports.getAllContactRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortOrder = 'DESC',
      isRead: isReadFilter,
      search,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (isReadFilter === 'true') {
      where.isRead = true;
    } else if (isReadFilter === 'false') {
      where.isRead = false;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { message: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const orderDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await ContactRequest.findAndCountAll({
      where,
      include: [
        {
          model: Participant,
          as: 'participant',
          attributes: ['id', 'fullName', 'email'],
          required: false,
        },
      ],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', orderDir]],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении обращений',
      error: error.message,
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const row = await ContactRequest.findByPk(id);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Обращение не найдено',
      });
    }

    await row.update({ isRead: true });

    res.json({
      success: true,
      message: 'Отмечено как прочитанное',
      data: row,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении обращения',
      error: error.message,
    });
  }
};
