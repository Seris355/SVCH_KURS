const { Op, fn, col } = require('sequelize');
const {
  Schedule,
  MasterClass,
  Location,
  Payment,
  Participant,
} = require('../models');

function parseDateRange(query) {
  let { dateFrom, dateTo } = query;
  const now = new Date();
  if (!dateTo) {
    const e = new Date(now);
    e.setHours(23, 59, 59, 999);
    dateTo = e.toISOString();
  } else {
    const e = new Date(dateTo);
    if (Number.isNaN(e.getTime())) {
      return { error: 'Некорректная дата окончания периода' };
    }
    e.setHours(23, 59, 59, 999);
    dateTo = e.toISOString();
  }
  if (!dateFrom) {
    const s = new Date(now);
    s.setDate(s.getDate() - 30);
    s.setHours(0, 0, 0, 0);
    dateFrom = s.toISOString();
  } else {
    const s = new Date(dateFrom);
    if (Number.isNaN(s.getTime())) {
      return { error: 'Некорректная дата начала периода' };
    }
    s.setHours(0, 0, 0, 0);
    dateFrom = s.toISOString();
  }
  if (new Date(dateFrom) > new Date(dateTo)) {
    return { error: 'Дата начала позже даты окончания' };
  }
  return { dateFrom, dateTo };
}

exports.paymentsFinanceReport = async (req, res) => {
  try {
    const range = parseDateRange(req.query);
    if (range.error) {
      return res.status(400).json({
        success: false,
        message: range.error,
      });
    }
    const { dateFrom, dateTo } = range;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const offset = (page - 1) * limit;

    const dateWhere = {
      createdAt: {
        [Op.between]: [new Date(dateFrom), new Date(dateTo)],
      },
    };

    const summaryRows = await Payment.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('Payment.id')), 'count'],
        [fn('SUM', col('amount')), 'amountSum'],
      ],
      where: dateWhere,
      group: ['status'],
      raw: true,
    });

    const totalCount = await Payment.count({ where: dateWhere });
    const rows = await Payment.findAll({
      where: dateWhere,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Participant,
          as: 'participant',
          attributes: ['id', 'fullName', 'email', 'phone'],
        },
        {
          model: Schedule,
          as: 'schedule',
          attributes: ['id', 'startDate', 'endDate'],
          include: [
            {
              model: MasterClass,
              as: 'masterClass',
              attributes: ['id', 'name'],
            },
          ],
        },
      ],
    });

    res.json({
      success: true,
      data: {
        period: { dateFrom, dateTo },
        summaryByStatus: summaryRows.map((row) => ({
          status: row.status,
          count: parseInt(row.count, 10),
          amountSum:
            row.amountSum != null ? parseFloat(row.amountSum) : null,
        })),
        rows,
        pagination: {
          total: totalCount,
          page,
          limit,
          totalPages: Math.ceil(totalCount / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при формировании финансового отчёта',
      error: error.message,
    });
  }
};

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
