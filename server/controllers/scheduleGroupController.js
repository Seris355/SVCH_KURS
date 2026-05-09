const { Op } = require('sequelize');
const {
  Schedule,
  MasterClass,
  Location,
  Payment,
  Participant,
} = require('../models');

async function reconcileParticipantMcMembership(masterClassId, participantId) {
  const mc = await MasterClass.findByPk(masterClassId);
  if (!mc) return;

  const scheduleRows = await Schedule.findAll({
    where: { masterClassId },
    attributes: ['id'],
    raw: true,
  });
  const scheduleIds = scheduleRows.map((s) => s.id);

  const setIds = new Set(mc.participantIds || []);

  if (scheduleIds.length === 0) {
    setIds.delete(participantId);
    await mc.update({ participantIds: Array.from(setIds) });
    return;
  }

  const activeCount = await Payment.count({
    where: {
      participantId,
      scheduleId: { [Op.in]: scheduleIds },
      status: { [Op.in]: ['pending', 'paid'] },
    },
  });

  if (activeCount > 0) {
    setIds.add(participantId);
  } else {
    setIds.delete(participantId);
  }

  await mc.update({ participantIds: Array.from(setIds) });
}

async function countActiveEnrollment(scheduleId) {
  return Payment.count({
    where: {
      scheduleId,
      status: { [Op.in]: ['pending', 'paid'] },
    },
  });
}

exports.getScheduleGroup = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByPk(id, {
      include: [
        {
          model: MasterClass,
          as: 'masterClass',
          attributes: ['id', 'name', 'price'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address', 'capacity'],
        },
      ],
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Сеанс не найден',
      });
    }

    const payments = await Payment.findAll({
      where: { scheduleId: id },
      include: [
        {
          model: Participant,
          as: 'participant',
          attributes: ['id', 'fullName', 'email', 'phone'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    const enrolledCount = await countActiveEnrollment(id);

    res.json({
      success: true,
      data: {
        schedule,
        enrolledCount,
        capacityLeft: Math.max(0, schedule.maxParticipants - enrolledCount),
        payments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при загрузке группы сеанса',
      error: error.message,
    });
  }
};

exports.addParticipantToSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const participantId = parseInt(req.body?.participantId, 10);

    if (Number.isNaN(participantId)) {
      return res.status(400).json({
        success: false,
        message: 'Укажите корректный participantId',
      });
    }

    const schedule = await Schedule.findByPk(id, {
      include: [
        {
          model: MasterClass,
          as: 'masterClass',
          attributes: ['id', 'name', 'price'],
        },
      ],
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Сеанс не найден',
      });
    }

    const participant = await Participant.findByPk(participantId);
    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Участник не найден',
      });
    }

    const enrolledCount = await countActiveEnrollment(id);
    if (enrolledCount >= schedule.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Достигнут лимит участников на этом сеансе',
      });
    }

    const existing = await Payment.findOne({
      where: { scheduleId: id, participantId },
    });

    if (existing && ['pending', 'paid'].includes(existing.status)) {
      return res.status(400).json({
        success: false,
        message: 'Участник уже записан на этот сеанс',
      });
    }

    if (existing && existing.status === 'cancelled') {
      await existing.destroy();
    }

    const price =
      schedule.masterClass && schedule.masterClass.price != null
        ? schedule.masterClass.price
        : 0;

    await Payment.create({
      participantId,
      scheduleId: parseInt(id, 10),
      amount: price,
      status: 'pending',
    });

    await reconcileParticipantMcMembership(schedule.masterClassId, participantId);

    const enrolledAfter = await countActiveEnrollment(id);

    res.status(201).json({
      success: true,
      message: 'Участник добавлен на сеанс',
      data: {
        enrolledCount: enrolledAfter,
        capacityLeft: Math.max(0, schedule.maxParticipants - enrolledAfter),
      },
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Запись участника на этот сеанс уже существует',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Ошибка при добавлении участника',
      error: error.message,
    });
  }
};

exports.removeParticipantFromSchedule = async (req, res) => {
  try {
    const { id, participantId } = req.params;
    const pid = parseInt(participantId, 10);

    if (Number.isNaN(pid)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный идентификатор участника',
      });
    }

    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Сеанс не найден',
      });
    }

    const deleted = await Payment.destroy({
      where: { scheduleId: id, participantId: pid },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Участник не числится на этом сеансе',
      });
    }

    await reconcileParticipantMcMembership(schedule.masterClassId, pid);

    const enrolledAfter = await countActiveEnrollment(id);

    res.json({
      success: true,
      message: 'Участник исключён из сеанса',
      data: {
        enrolledCount: enrolledAfter,
        capacityLeft: Math.max(0, schedule.maxParticipants - enrolledAfter),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при исключении участника',
      error: error.message,
    });
  }
};
