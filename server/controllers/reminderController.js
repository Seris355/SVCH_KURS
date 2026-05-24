const { Op } = require('sequelize');
const { Payment, Schedule, MasterClass, Location } = require('../models');

const { REMINDER_DAYS_AHEAD } = require('../utils/enrollmentPolicy');

function formatReminder(schedule) {
  const locationParts = [];
  if (schedule.location?.name) locationParts.push(schedule.location.name);
  if (schedule.location?.address) locationParts.push(schedule.location.address);

  const masterClassName = schedule.masterClass?.name || 'Мастер-класс';

  return {
    scheduleId: schedule.id,
    masterClassId: schedule.masterClass?.id,
    masterClassName,
    startDate: schedule.startDate,
    endDate: schedule.endDate,
    location: locationParts.join(', ') || null,
    message: `Напоминаем: скоро состоится «${masterClassName}». Не забудьте подготовиться и прийти вовремя.`,
  };
}

exports.getUpcomingReminders = async (req, res) => {
  try {
    const participantId = req.user.id;
    const now = new Date();
    const inThreeDays = new Date(now.getTime() + REMINDER_DAYS_AHEAD * 24 * 60 * 60 * 1000);

    const dateFilter = {
      startDate: {
        [Op.gt]: now,
        [Op.lte]: inThreeDays,
      },
    };

    const payments = await Payment.findAll({
      where: {
        participantId,
        status: { [Op.in]: ['pending', 'paid'] },
      },
      include: [
        {
          model: Schedule,
          as: 'schedule',
          required: true,
          where: dateFilter,
          include: [
            {
              model: MasterClass,
              as: 'masterClass',
              attributes: ['id', 'name'],
              required: true,
            },
            {
              model: Location,
              as: 'location',
              attributes: ['name', 'address'],
              required: false,
            },
          ],
        },
      ],
    });

    const byScheduleId = new Map();
    payments.forEach((payment) => {
      if (payment.schedule) {
        byScheduleId.set(payment.schedule.id, formatReminder(payment.schedule));
      }
    });

    const enrolled = await MasterClass.findAll({
      where: {
        participantIds: {
          [Op.contains]: [participantId],
        },
      },
      attributes: ['id'],
    });

    const masterClassIds = enrolled.map((item) => item.id);

    if (masterClassIds.length) {
      const schedules = await Schedule.findAll({
        where: {
          masterClassId: { [Op.in]: masterClassIds },
          ...dateFilter,
        },
        include: [
          {
            model: MasterClass,
            as: 'masterClass',
            attributes: ['id', 'name'],
            required: true,
          },
          {
            model: Location,
            as: 'location',
            attributes: ['name', 'address'],
            required: false,
          },
        ],
        order: [['startDate', 'ASC']],
      });

      schedules.forEach((schedule) => {
        if (!byScheduleId.has(schedule.id)) {
          byScheduleId.set(schedule.id, formatReminder(schedule));
        }
      });
    }

    const data = [...byScheduleId.values()].sort(
      (a, b) => new Date(a.startDate) - new Date(b.startDate)
    );

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении напоминаний',
      error: error.message,
    });
  }
};
