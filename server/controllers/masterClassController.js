const { MasterClass, Instructor, Participant } = require('../models');
const { Op } = require('sequelize');

exports.getAllMasterClasses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'name',
      sortOrder = 'ASC',
      search,
      instructorId,
      minPrice,
      maxPrice,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {}; 


    if (instructorId) {
      where.instructorId = parseInt(instructorId);
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price[Op.gte] = parseFloat(minPrice);
      }
      if (maxPrice) {
        where.price[Op.lte] = parseFloat(maxPrice);
      }
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await MasterClass.findAndCountAll({
      where,
      include: [
        {
          model: Instructor,
          as: 'instructor',
          attributes: ['id', 'fullName', 'specialization'],
        },
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [[sortBy, sortOrder.toUpperCase()]],
    });


    const masterClassesWithParticipants = await Promise.all(
      rows.map(async (masterClass) => {
        const participantIds = masterClass.participantIds || [];
        const participants = participantIds.length > 0
          ? await Participant.findAll({
              where: { id: { [Op.in]: participantIds } },
              attributes: ['id', 'fullName', 'email', 'phone'],
            })
          : [];

        return {
          ...masterClass.toJSON(),
          participants,
        };
      })
    );

    res.json({
      success: true,
      data: masterClassesWithParticipants,
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
      message: 'Ошибка при получении списка мастер-классов',
      error: error.message,
    });
  }
};


exports.getMasterClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const masterClass = await MasterClass.findByPk(id, {
      include: [
        {
          model: Instructor,
          as: 'instructor',
          attributes: ['id', 'fullName', 'specialization'],
        },
      ],
    });

    if (!masterClass) {
      return res.status(404).json({
        success: false,
        message: 'Мастер-класс не найден',
      });
    }

    const participantIds = masterClass.participantIds || [];
    const participants = participantIds.length > 0
      ? await Participant.findAll({
          where: { id: { [Op.in]: participantIds } },
          attributes: ['id', 'fullName', 'email', 'phone'],
        })
      : [];

    res.json({
      success: true,
      data: {
        ...masterClass.toJSON(),
        participants,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении мастер-класса',
      error: error.message,
    });
  }
};


exports.checkMasterClassExists = async (req, res) => {
  try {
    const { id } = req.params;
    const masterClass = await MasterClass.findByPk(id);

    res.json({
      success: true,
      exists: !!masterClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при проверке существования мастер-класса',
      error: error.message,
    });
  }
};


exports.createMasterClass = async (req, res) => {
  try {
    const { name, description, price, photo, instructorId, participantIds } = req.body;


    const instructor = await Instructor.findByPk(instructorId);
    if (!instructor) {
      return res.status(404).json({
        success: false,
        message: 'Инструктор не найден',
      });
    }


    if (participantIds && participantIds.length > 0) {
      const participants = await Participant.findAll({
        where: { id: { [Op.in]: participantIds } },
      });
      if (participants.length !== participantIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Один или несколько участников не найдены',
        });
      }
    }

    const masterClass = await MasterClass.create({
      name,
      description,
      price,
      photo,
      instructorId,
      participantIds: participantIds || [],
    });

    const createdMasterClass = await MasterClass.findByPk(masterClass.id, {
      include: [
        {
          model: Instructor,
          as: 'instructor',
          attributes: ['id', 'fullName', 'specialization'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Мастер-класс успешно создан',
      data: createdMasterClass,
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
      message: 'Ошибка при создании мастер-класса',
      error: error.message,
    });
  }
};


exports.updateMasterClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, photo, instructorId, participantIds } = req.body;

    const masterClass = await MasterClass.findByPk(id);

    if (!masterClass) {
      return res.status(404).json({
        success: false,
        message: 'Мастер-класс не найден',
      });
    }


    if (instructorId) {
      const instructor = await Instructor.findByPk(instructorId);
      if (!instructor) {
        return res.status(404).json({
          success: false,
          message: 'Инструктор не найден',
        });
      }
    }


    if (participantIds && participantIds.length > 0) {
      const participants = await Participant.findAll({
        where: { id: { [Op.in]: participantIds } },
      });
      if (participants.length !== participantIds.length) {
        return res.status(400).json({
          success: false,
          message: 'Один или несколько участников не найдены',
        });
      }
    }

    await masterClass.update({
      name,
      description,
      price,
      photo,
      instructorId,
      participantIds: participantIds !== undefined ? participantIds : masterClass.participantIds,
    });

    const updatedMasterClass = await MasterClass.findByPk(id, {
      include: [
        {
          model: Instructor,
          as: 'instructor',
          attributes: ['id', 'fullName', 'specialization'],
        },
      ],
    });

    res.json({
      success: true,
      message: 'Мастер-класс успешно обновлен',
      data: updatedMasterClass,
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
      message: 'Ошибка при обновлении мастер-класса',
      error: error.message,
    });
  }
};


exports.deleteMasterClass = async (req, res) => {
  try {
    const { id } = req.params;

    const masterClass = await MasterClass.findByPk(id);

    if (!masterClass) {
      return res.status(404).json({
        success: false,
        message: 'Мастер-класс не найден',
      });
    }

    await masterClass.destroy();

    res.json({
      success: true,
      message: 'Мастер-класс успешно удален',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении мастер-класса',
      error: error.message,
    });
  }
};

exports.enrollParticipant = async (req, res) => {
  try {
    const { id } = req.params;
    const participantId = req.user.id;

    const masterClass = await MasterClass.findByPk(id);

    if (!masterClass) {
      return res.status(404).json({
        success: false,
        message: 'Мастер-класс не найден',
      });
    }

    const participantIds = [...(masterClass.participantIds || [])];

    if (participantIds.includes(participantId)) {
      return res.status(400).json({
        success: false,
        message: 'Вы уже записаны на этот мастер-класс',
      });
    }

    participantIds.push(participantId);
    await masterClass.update({ participantIds: participantIds });

    const updatedMasterClass = await MasterClass.findByPk(id, {
      include: [
        {
          model: Instructor,
          as: 'instructor',
          attributes: ['id', 'fullName', 'specialization'],
        },
      ],
    });

    res.json({
      success: true,
      message: 'Вы успешно записались на мастер-класс',
      data: updatedMasterClass,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при записи на мастер-класс',
      error: error.message,
    });
  }
};

exports.getParticipantMasterClasses = async (req, res) => {
  try {
    const participantId = req.user.id;

    const masterClasses = await MasterClass.findAll({
      where: {
        participantIds: {
          [Op.contains]: [participantId],
        },
      },
      include: [
        {
          model: Instructor,
          as: 'instructor',
          attributes: ['id', 'fullName', 'specialization'],
        },
      ],
    });

    res.json({
      success: true,
      data: masterClasses,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении мастер-классов участника',
      error: error.message,
    });
  }
};
