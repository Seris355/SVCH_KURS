const bcrypt = require('bcrypt');
const { Participant, ParticipantPassword } = require('../models');
const { Op, Sequelize } = require('sequelize');

exports.getAllParticipants = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'ASC',
      search,
      email,
      phone,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (email) {
      where.email = {
        [Op.iLike]: `%${email}%`,
      };
    }

    if (phone) {
      where.phone = {
        [Op.iLike]: `%${phone}%`,
      };
    }

    if (search) {
      where[Op.or] = [
        { fullName: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const allowedSortFields = ['id', 'fullName'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'id';
    const orderBy = [[validSortBy, sortOrder.toUpperCase()]];
    
    const { count, rows } = await Participant.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: orderBy,
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
      message: 'Ошибка при получении списка участников',
      error: error.message,
    });
  }
};

exports.getParticipantById = async (req, res) => {
  try {
    const { id } = req.params;
    const participant = await Participant.findByPk(id);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Участник не найден',
      });
    }

    res.json({
      success: true,
      data: participant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении участника',
      error: error.message,
    });
  }
};

exports.checkParticipantExists = async (req, res) => {
  try {
    const { id } = req.params;
    const participant = await Participant.findByPk(id);

    res.json({
      success: true,
      exists: !!participant,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при проверке существования участника',
      error: error.message,
    });
  }
};

exports.createParticipant = async (req, res) => {
  try {
    const { fullName, email, phone, password } = req.body;

    const participant = await Participant.create({
      fullName,
      email,
      phone,
    });

    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      await ParticipantPassword.create({
        participantId: participant.id,
        passwordHash: passwordHash,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Участник успешно создан',
      data: participant,
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
      let errorMessage = 'Нарушение уникальности данных';
      if (error.errors && error.errors.length > 0) {
        errorMessage = error.errors.map(e => {
          if (e.path === 'email') return 'Email уже используется';
          if (e.path === 'phone') return 'Номер телефона уже используется';
          return e.message;
        }).join(', ');
      } else if (error.message) {
        if (error.message.includes('email')) {
          errorMessage = 'Email уже используется';
        } else if (error.message.includes('phone')) {
          errorMessage = 'Номер телефона уже используется';
        }
      }
      return res.status(400).json({
        success: false,
        message: errorMessage,
        error: errorMessage,
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Ошибка при создании участника',
      error: error.message,
    });
  }
};

exports.updateParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone } = req.body;

    const participant = await Participant.findByPk(id);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Участник не найден',
      });
    }

    await participant.update({
      fullName,
      email,
      phone,
    });

    res.json({
      success: true,
      message: 'Участник успешно обновлен',
      data: participant,
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
      let errorMessage = 'Нарушение уникальности данных';
      if (error.errors && error.errors.length > 0) {
        errorMessage = error.errors.map(e => {
          if (e.path === 'email') return 'Email уже используется';
          if (e.path === 'phone') return 'Номер телефона уже используется';
          return e.message;
        }).join(', ');
      } else if (error.message) {
        if (error.message.includes('email')) {
          errorMessage = 'Email уже используется';
        } else if (error.message.includes('phone')) {
          errorMessage = 'Номер телефона уже используется';
        }
      }
      return res.status(400).json({
        success: false,
        message: errorMessage,
        error: errorMessage,
      });
    }
    
    res.status(400).json({
      success: false,
      message: 'Ошибка при обновлении участника',
      error: error.message,
    });
  }
};

exports.deleteParticipant = async (req, res) => {
  try {
    const { id } = req.params;

    const participant = await Participant.findByPk(id);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Участник не найден',
      });
    }

    const { MasterClass } = require('../models');
    const { Op } = require('sequelize');
    const masterClasses = await MasterClass.findAll({
      where: {
        participantIds: {
          [Op.contains]: [parseInt(id)],
        },
      },
    });

    if (masterClasses.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Невозможно удалить участника. Он зарегистрирован на ${masterClasses.length} мастер-классах. Сначала удалите его из связанных мастер-классов.`,
      });
    }

    await participant.destroy();

    res.json({
      success: true,
      message: 'Участник успешно удален',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении участника',
      error: error.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Пароль должен содержать минимум 6 символов',
      });
    }

    const participant = await Participant.findByPk(id);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Участник не найден',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let participantPassword = await ParticipantPassword.findOne({
      where: { participantId: id },
    });

    if (participantPassword) {
      await participantPassword.update({ passwordHash });
    } else {
      await ParticipantPassword.create({
        participantId: id,
        passwordHash: passwordHash,
      });
    }

    res.json({
      success: true,
      message: 'Пароль успешно изменён',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при изменении пароля',
      error: error.message,
    });
  }
};
