const PDFDocument = require('pdfkit');
const { MasterClass, Instructor, Participant, Schedule, Location, Payment, Review } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { resolveUnicodeTtfPath } = require('../utils/pdfFonts');

async function getRatingStatsMap(masterClassIds) {
  const map = new Map();
  if (!masterClassIds.length) {
    return map;
  }

  const rows = await Review.findAll({
    attributes: [
      'masterClassId',
      [Sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating'],
      [Sequelize.fn('COUNT', Sequelize.col('Review.id')), 'reviewCount'],
    ],
    where: { masterClassId: { [Op.in]: masterClassIds } },
    group: ['masterClassId'],
    raw: true,
  });

  rows.forEach((row) => {
    const avgRaw = parseFloat(row.avgRating);
    map.set(row.masterClassId, {
      avgRating: Number.isNaN(avgRaw) ? null : Math.round(avgRaw * 100) / 100,
      reviewCount: parseInt(row.reviewCount, 10) || 0,
    });
  });

  return map;
}

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

    if (instructorId !== undefined && instructorId !== null && `${instructorId}`.trim() !== '') {
      const parts = `${instructorId}`
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n));
      if (parts.length === 1) {
        where.instructorId = parts[0];
      } else if (parts.length > 1) {
        where.instructorId = { [Op.in]: parts };
      }
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

    const allowedSortFields = ['id', 'name', 'price'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'name';
    const orderDir = String(sortOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const { count, rows } = await MasterClass.findAndCountAll({
      where,
      include: [
        {
          model: Instructor,
          as: 'instructor',
          attributes: ['id', 'fullName', 'specialization'],
        },
        {
          model: Schedule,
          as: 'schedules',
          separate: true,
          limit: 1,
          order: [['startDate', 'ASC']],
          attributes: ['id', 'startDate', 'endDate'],
          required: false,
        },
      ],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [[validSortBy, orderDir]],
    });

    const ids = rows.map((r) => r.id);
    const ratingMap = await getRatingStatsMap(ids);

    const list = rows.map((masterClass) => {
      const json = masterClass.toJSON();
      const st = ratingMap.get(json.id) || { avgRating: null, reviewCount: 0 };
      const pids = json.participantIds || [];
      return {
        ...json,
        avgRating: st.avgRating,
        reviewCount: st.reviewCount,
        participantCount: pids.length,
      };
    });

    res.json({
      success: true,
      data: list,
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
      message: 'Ошибка при получении списка мастер-классов',
      error: error.message,
    });
  }
};


exports.getMasterClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user && req.user.role === 'admin';

    const masterClass = await MasterClass.findByPk(id, {
      include: [
        {
          model: Instructor,
          as: 'instructor',
          attributes: ['id', 'fullName', 'specialization'],
        },
        {
          model: Schedule,
          as: 'schedules',
          separate: true,
          order: [['startDate', 'ASC']],
          include: [
            {
              model: Location,
              as: 'location',
              attributes: ['id', 'name', 'address'],
            },
          ],
        },
        {
          model: Review,
          as: 'reviews',
          separate: true,
          order: [['createdAt', 'ASC']],
          include: [
            {
              model: Participant,
              as: 'participant',
              attributes: ['id', 'fullName'],
            },
          ],
        },
      ],
    });

    if (!masterClass) {
      return res.status(404).json({
        success: false,
        message: 'Мастер-класс не найден',
      });
    }

    const agg = await Review.findOne({
      attributes: [
        [Sequelize.fn('AVG', Sequelize.col('rating')), 'avgRating'],
        [Sequelize.fn('COUNT', Sequelize.col('Review.id')), 'cnt'],
      ],
      where: { masterClassId: id },
      raw: true,
    });

    const avgRaw = agg && agg.avgRating != null ? parseFloat(agg.avgRating) : null;
    const avgRating = avgRaw != null && !Number.isNaN(avgRaw) ? Math.round(avgRaw * 100) / 100 : null;
    const reviewCount = agg && agg.cnt != null ? parseInt(agg.cnt, 10) : 0;

    const participantIds = masterClass.participantIds || [];
    let participants = [];
    if (isAdmin && participantIds.length > 0) {
      participants = await Participant.findAll({
        where: { id: { [Op.in]: participantIds } },
        attributes: ['id', 'fullName', 'email', 'phone'],
      });
    }

    let viewerHasEnrollment = false;
    let viewerHasReview = false;
    let viewerCanSubmitReview = false;
    if (req.user && req.user.role === 'participant') {
      const pid = req.user.id;
      viewerHasEnrollment = participantIds.includes(pid);
      if (viewerHasEnrollment) {
        const existingReview = await Review.findOne({
          where: {
            participantId: pid,
            masterClassId: parseInt(id, 10),
          },
          attributes: ['id'],
        });
        viewerHasReview = !!existingReview;
        viewerCanSubmitReview = !existingReview;
      }
    }

    const base = masterClass.toJSON();
    if (!isAdmin) {
      delete base.participantIds;
    }

    res.json({
      success: true,
      data: {
        ...base,
        avgRating,
        reviewCount,
        participantCount: participantIds.length,
        participants,
        viewerHasEnrollment,
        viewerHasReview,
        viewerCanSubmitReview,
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
    const { scheduleId } = req.body || {};
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

    let paymentInfo = null;
    const hasSchedule =
      scheduleId !== undefined && scheduleId !== null && `${scheduleId}`.trim() !== '';

    if (hasSchedule) {
      const sid = parseInt(scheduleId, 10);
      if (Number.isNaN(sid)) {
        participantIds.splice(participantIds.indexOf(participantId), 1);
        await masterClass.update({ participantIds: participantIds });
        return res.status(400).json({
          success: false,
          message: 'Некорректный идентификатор сеанса',
        });
      }

      const schedule = await Schedule.findByPk(sid);
      if (!schedule || schedule.masterClassId !== parseInt(id, 10)) {
        participantIds.splice(participantIds.indexOf(participantId), 1);
        await masterClass.update({ participantIds: participantIds });
        return res.status(400).json({
          success: false,
          message: 'Сеанс не относится к этому мастер-классу',
        });
      }

      try {
        const payment = await Payment.create({
          participantId,
          scheduleId: sid,
          amount: masterClass.price,
          status: 'pending',
        });
        paymentInfo = {
          id: payment.id,
          invoiceCode: payment.invoiceCode,
          amount: payment.amount,
          status: payment.status,
        };
      } catch (error) {
        participantIds.splice(participantIds.indexOf(participantId), 1);
        await masterClass.update({ participantIds: participantIds });
        if (error.name === 'SequelizeUniqueConstraintError') {
          return res.status(400).json({
            success: false,
            message: 'Счёт на этот сеанс для вас уже существует',
          });
        }
        throw error;
      }
    }

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
      payment: paymentInfo,
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

exports.exportMyClassesPdf = async (req, res) => {
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
          attributes: ['fullName'],
        },
      ],
      order: [['id', 'ASC']],
    });

    const mcIds = masterClasses.map((m) => m.id);
    const schedules = mcIds.length
      ? await Schedule.findAll({
          where: { masterClassId: { [Op.in]: mcIds } },
          order: [['startDate', 'ASC']],
        })
      : [];

    const firstDateByMc = {};
    schedules.forEach((s) => {
      if (firstDateByMc[s.masterClassId] == null) {
        firstDateByMc[s.masterClassId] = s.startDate;
      }
    });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="moi-master-klassy.pdf"'
    );
    doc.pipe(res);

    const fontPath = resolveUnicodeTtfPath();
    if (fontPath) {
      doc.font(fontPath);
    }

    doc.fontSize(16).text('Мои мастер-классы', { align: 'center' });
    doc.moveDown();

    if (masterClasses.length === 0) {
      doc.fontSize(11).text('Нет записей.');
      doc.end();
      return;
    }

    doc.fontSize(10);
    masterClasses.forEach((mc, i) => {
      const dateStr = firstDateByMc[mc.id]
        ? new Date(firstDateByMc[mc.id]).toLocaleString('ru-RU')
        : '—';
      doc.text(
        `${i + 1}. ${mc.name}`,
        { continued: false }
      );
      doc.text(
        `   Инструктор: ${mc.instructor?.fullName || '—'} | Дата (ближайший сеанс): ${dateStr} | Цена: ${parseFloat(mc.price).toFixed(2)} ₽`
      );
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Ошибка при формировании PDF',
        error: error.message,
      });
    }
  }
};
