const { Op } = require('sequelize');
const {
  Schedule,
  MasterClass,
  Location,
  Payment,
  Participant,
} = require('../models');

exports.scheduleParticipantsReport = async (req, res) => {
  try {
    const scheduleId = parseInt(req.params.scheduleId, 10);
    if (Number.isNaN(scheduleId)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный идентификатор сеанса',
      });
    }

    const schedule = await Schedule.findByPk(scheduleId, {
      include: [
        {
          model: MasterClass,
          as: 'masterClass',
          attributes: ['id', 'name', 'price'],
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'address'],
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
      where: {
        scheduleId,
        status: { [Op.in]: ['pending', 'paid'] },
      },
      include: [
        {
          model: Participant,
          as: 'participant',
          attributes: ['id', 'fullName', 'email', 'phone'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    const enrolledCount = payments.length;

    res.json({
      success: true,
      data: {
        schedule,
        enrolledCount,
        capacityLeft: Math.max(0, schedule.maxParticipants - enrolledCount),
        rows: payments,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при формировании отчёта по сеансу',
      error: error.message,
    });
  }
};
