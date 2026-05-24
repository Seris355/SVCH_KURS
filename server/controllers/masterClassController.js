const PDFDocument = require('pdfkit');
const { MasterClass, Instructor, Participant, Schedule, Location, Payment, Review } = require('../models');
const { Op, Sequelize } = require('sequelize');
const { resolveUnicodeTtfPath } = require('../utils/pdfFonts');
const {
  assertCanModifyEnrollment,
  getEnrollmentModifyStatus,
} = require('../utils/enrollmentPolicy');
const {
  reconcileParticipantMcMembership,
  findActiveEnrollmentPayment,
} = require('../utils/participantMembership');

async function countActiveEnrollment(scheduleId) {
  return Payment.count({
    where: {
      scheduleId,
      status: { [Op.in]: ['pending', 'paid'] },
    },
  });
}

async function getScheduleEnrollmentCounts(scheduleIds) {
  const map = new Map();
  if (!scheduleIds.length) return map;

  const rows = await Payment.findAll({
    attributes: [
      'scheduleId',
      [Sequelize.fn('COUNT', Sequelize.col('Payment.id')), 'cnt'],
    ],
    where: {
      scheduleId: { [Op.in]: scheduleIds },
      status: { [Op.in]: ['pending', 'paid'] },
    },
    group: ['scheduleId'],
    raw: true,
  });

  rows.forEach((row) => {
    map.set(row.scheduleId, parseInt(row.cnt, 10) || 0);
  });

  return map;
}

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

    const now = new Date();

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
          where: { startDate: { [Op.gt]: now } },
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

    const scheduleRows = masterClass.schedules || [];
    const scheduleIds = scheduleRows.map((s) => s.id);
    const enrollmentCounts = await getScheduleEnrollmentCounts(scheduleIds);

    let viewerEnrolledScheduleIds = [];
    let viewerHasEnrollment = false;
    let viewerHasReview = false;
    let viewerCanSubmitReview = false;
    if (req.user && req.user.role === 'participant') {
      const pid = req.user.id;

      if (scheduleIds.length > 0) {
        const viewerPayments = await Payment.findAll({
          where: {
            participantId: pid,
            scheduleId: { [Op.in]: scheduleIds },
            status: { [Op.in]: ['pending', 'paid'] },
          },
          attributes: ['scheduleId'],
        });
        viewerEnrolledScheduleIds = viewerPayments.map((p) => p.scheduleId);
      }

      viewerHasEnrollment =
        viewerEnrolledScheduleIds.length > 0 || participantIds.includes(pid);

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

    const now = new Date();
    const schedules = (base.schedules || []).map((schedule) => {
      const enrolledCount = enrollmentCounts.get(schedule.id) || 0;
      const capacityLeft = Math.max(0, schedule.maxParticipants - enrolledCount);
      const isUpcoming = new Date(schedule.startDate) > now;
      const viewerIsEnrolled = viewerEnrolledScheduleIds.includes(schedule.id);

      return {
        ...schedule,
        enrolledCount,
        capacityLeft,
        isUpcoming,
        viewerIsEnrolled,
        canEnroll: isUpcoming && capacityLeft > 0 && !viewerIsEnrolled,
      };
    });

    res.json({
      success: true,
      data: {
        ...base,
        schedules,
        avgRating,
        reviewCount,
        participantCount: participantIds.length,
        participants,
        viewerHasEnrollment,
        viewerEnrolledScheduleIds,
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
    const masterClassId = parseInt(id, 10);

    if (
      scheduleId === undefined ||
      scheduleId === null ||
      `${scheduleId}`.trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        message: 'Выберите сеанс для записи',
      });
    }

    const sid = parseInt(scheduleId, 10);
    if (Number.isNaN(sid)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный идентификатор сеанса',
      });
    }

    const masterClass = await MasterClass.findByPk(masterClassId);

    if (!masterClass) {
      return res.status(404).json({
        success: false,
        message: 'Мастер-класс не найден',
      });
    }

    const schedule = await Schedule.findByPk(sid);
    if (!schedule || schedule.masterClassId !== masterClassId) {
      return res.status(400).json({
        success: false,
        message: 'Сеанс не относится к этому мастер-классу',
      });
    }

    if (new Date(schedule.startDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя записаться на прошедший сеанс',
      });
    }

    const existingOnSchedule = await Payment.findOne({
      where: {
        participantId,
        scheduleId: sid,
        status: { [Op.in]: ['pending', 'paid'] },
      },
    });

    if (existingOnSchedule) {
      return res.status(400).json({
        success: false,
        message: 'Вы уже записаны на этот сеанс',
      });
    }

    const mcScheduleRows = await Schedule.findAll({
      where: { masterClassId },
      attributes: ['id'],
      raw: true,
    });
    const mcScheduleIds = mcScheduleRows.map((row) => row.id);

    if (mcScheduleIds.length > 0) {
      const existingOnMasterClass = await Payment.findOne({
        where: {
          participantId,
          scheduleId: { [Op.in]: mcScheduleIds },
          status: { [Op.in]: ['pending', 'paid'] },
        },
      });

      if (existingOnMasterClass) {
        return res.status(400).json({
          success: false,
          message:
            'Вы уже записаны на другой сеанс этого мастер-класса. Для смены даты обратитесь к администратору.',
        });
      }
    }

    const enrolledCount = await countActiveEnrollment(sid);
    if (enrolledCount >= schedule.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'На этом сеансе не осталось свободных мест',
      });
    }

    let paymentInfo = null;
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
        scheduleId: sid,
      };
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'Счёт на этот сеанс для вас уже существует',
        });
      }
      throw error;
    }

    const participantIds = [...(masterClass.participantIds || [])];
    if (!participantIds.includes(participantId)) {
      participantIds.push(participantId);
      await masterClass.update({ participantIds });
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
      message: 'Вы успешно записались на выбранный сеанс',
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

exports.cancelEnrollment = async (req, res) => {
  try {
    const masterClassId = parseInt(req.params.id, 10);
    const participantId = req.user.id;

    if (Number.isNaN(masterClassId)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный идентификатор мастер-класса',
      });
    }

    const payment = await findActiveEnrollmentPayment(participantId, masterClassId);

    if (!payment || !payment.schedule) {
      const masterClass = await MasterClass.findByPk(masterClassId);
      if (!masterClass) {
        return res.status(404).json({
          success: false,
          message: 'Мастер-класс не найден',
        });
      }

      const participantIds = masterClass.participantIds || [];
      if (!participantIds.includes(participantId)) {
        return res.status(404).json({
          success: false,
          message: 'Вы не записаны на этот мастер-класс',
        });
      }

      await masterClass.update({
        participantIds: participantIds.filter((id) => id !== participantId),
      });

      return res.json({
        success: true,
        message: 'Вы отписались от мастер-класса',
      });
    }

    try {
      assertCanModifyEnrollment(payment.schedule.startDate);
    } catch (policyError) {
      return res.status(policyError.statusCode || 400).json({
        success: false,
        message: policyError.message,
      });
    }

    await payment.destroy();
    await reconcileParticipantMcMembership(masterClassId, participantId);

    res.json({
      success: true,
      message: 'Вы отписались от мастер-класса',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при отмене записи',
      error: error.message,
    });
  }
};

exports.rescheduleEnrollment = async (req, res) => {
  try {
    const masterClassId = parseInt(req.params.id, 10);
    const participantId = req.user.id;
    const { scheduleId } = req.body || {};

    if (Number.isNaN(masterClassId)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный идентификатор мастер-класса',
      });
    }

    if (
      scheduleId === undefined ||
      scheduleId === null ||
      `${scheduleId}`.trim() === ''
    ) {
      return res.status(400).json({
        success: false,
        message: 'Выберите новый сеанс',
      });
    }

    const newScheduleId = parseInt(scheduleId, 10);
    if (Number.isNaN(newScheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный идентификатор сеанса',
      });
    }

    const payment = await findActiveEnrollmentPayment(participantId, masterClassId);
    if (!payment || !payment.schedule) {
      return res.status(404).json({
        success: false,
        message: 'Активная запись на этот мастер-класс не найдена',
      });
    }

    if (payment.scheduleId === newScheduleId) {
      return res.json({
        success: true,
        message: 'Дата сеанса не изменилась',
        data: {
          payment: {
            id: payment.id,
            invoiceCode: payment.invoiceCode,
            amount: payment.amount,
            status: payment.status,
          },
          schedule: payment.schedule,
          unchanged: true,
        },
      });
    }

    try {
      assertCanModifyEnrollment(payment.schedule.startDate);
    } catch (policyError) {
      return res.status(policyError.statusCode || 400).json({
        success: false,
        message: policyError.message,
      });
    }

    const newSchedule = await Schedule.findByPk(newScheduleId);
    if (!newSchedule || newSchedule.masterClassId !== masterClassId) {
      return res.status(400).json({
        success: false,
        message: 'Сеанс не относится к этому мастер-классу',
      });
    }

    if (new Date(newSchedule.startDate) <= new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Нельзя перенести запись на прошедший сеанс',
      });
    }

    const enrolledCount = await countActiveEnrollment(newScheduleId);
    if (enrolledCount >= newSchedule.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'На выбранном сеансе не осталось свободных мест',
      });
    }

    const staleCancelled = await Payment.findOne({
      where: {
        participantId,
        scheduleId: newScheduleId,
        status: 'cancelled',
      },
    });
    if (staleCancelled) {
      await staleCancelled.destroy();
    }

    try {
      await payment.update({ scheduleId: newScheduleId });
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({
          success: false,
          message: 'На этот сеанс уже есть запись',
        });
      }
      throw error;
    }

    const updatedPayment = await Payment.findByPk(payment.id, {
      include: [
        {
          model: Schedule,
          as: 'schedule',
          include: [
            {
              model: Location,
              as: 'location',
              attributes: ['id', 'name', 'address'],
            },
          ],
        },
      ],
    });

    res.json({
      success: true,
      message: 'Дата сеанса успешно изменена',
      data: {
        payment: {
          id: updatedPayment.id,
          invoiceCode: updatedPayment.invoiceCode,
          amount: updatedPayment.amount,
          status: updatedPayment.status,
        },
        schedule: updatedPayment.schedule,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при смене даты сеанса',
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
      ],
    });

    const mcIds = masterClasses.map((mc) => mc.id);
    const payments = mcIds.length
      ? await Payment.findAll({
          where: {
            participantId,
            status: { [Op.in]: ['pending', 'paid'] },
          },
          include: [
            {
              model: Schedule,
              as: 'schedule',
              where: { masterClassId: { [Op.in]: mcIds } },
              attributes: ['id', 'masterClassId', 'startDate', 'endDate'],
              include: [
                {
                  model: Location,
                  as: 'location',
                  attributes: ['id', 'name', 'address'],
                },
              ],
            },
          ],
        })
      : [];

    const paymentByMcId = new Map();
    payments.forEach((payment) => {
      const mcId = payment.schedule?.masterClassId;
      if (mcId != null && !paymentByMcId.has(mcId)) {
        paymentByMcId.set(mcId, payment);
      }
    });

    const data = masterClasses.map((masterClass) => {
      const json = masterClass.toJSON();
      const enrolledPayment = paymentByMcId.get(json.id);
      const enrolledSchedule = enrolledPayment?.schedule || null;
      const now = new Date();
      const enrolledScheduleIsPast = enrolledSchedule?.startDate
        ? new Date(enrolledSchedule.startDate) <= now
        : false;

      const enrollmentManage = enrolledSchedule?.startDate
        ? getEnrollmentModifyStatus(enrolledSchedule.startDate)
        : {
            canModify: false,
            daysUntilSession: null,
            modifyBlockedReason: null,
          };

      return {
        ...json,
        enrolledSchedule: enrolledSchedule
          ? { ...enrolledSchedule, isPast: enrolledScheduleIsPast }
          : null,
        enrolledPayment: enrolledPayment
          ? {
              id: enrolledPayment.id,
              invoiceCode: enrolledPayment.invoiceCode,
              amount: enrolledPayment.amount,
              status: enrolledPayment.status,
              scheduleId: enrolledPayment.scheduleId,
            }
          : null,
        enrollmentManage,
      };
    });

    res.json({
      success: true,
      data,
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
