const { Op, fn, col, QueryTypes } = require('sequelize');
const { sequelize, Payment } = require('../models');

function parseWeeks(raw) {
  const n = parseInt(raw, 10);
  if (Number.isNaN(n)) return 12;
  return Math.min(Math.max(n, 4), 52);
}

exports.getDashboard = async (req, res) => {
  try {
    const weeks = parseWeeks(req.query.weeks);
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - weeks * 7);
    windowStart.setHours(0, 0, 0, 0);

    const enrollmentsByWeek = await Payment.findAll({
      attributes: [
        [fn('date_trunc', 'week', col('Payment.createdAt')), 'weekStart'],
        [fn('COUNT', col('Payment.id')), 'count'],
      ],
      where: {
        status: { [Op.in]: ['pending', 'paid'] },
        createdAt: { [Op.gte]: windowStart },
      },
      group: [fn('date_trunc', 'week', col('Payment.createdAt'))],
      order: [[fn('date_trunc', 'week', col('Payment.createdAt')), 'ASC']],
      raw: true,
    });

    const masterClassesByCategory = await sequelize.query(
      `SELECT c.id,
              c.name,
              COUNT(DISTINCT mcc."masterClassId")::integer AS "masterClassCount"
       FROM categories c
       LEFT JOIN master_class_categories mcc ON mcc."categoryId" = c.id
       GROUP BY c.id, c.name
       ORDER BY "masterClassCount" DESC, c.name ASC`,
      { type: QueryTypes.SELECT }
    );

    const upcomingScheduleFill = await sequelize.query(
      `SELECT s.id AS "scheduleId",
              s."startDate",
              s."maxParticipants",
              m.name AS "masterClassName",
              COUNT(p.id)
                FILTER (
                  WHERE p.status IN ('pending', 'paid')
                )::integer AS enrolled
       FROM schedules s
       INNER JOIN masterclasses m ON m.id = s."masterClassId"
       LEFT JOIN payments p ON p."scheduleId" = s.id
       WHERE s."startDate" >= NOW()
       GROUP BY s.id, s."startDate", s."maxParticipants", m.name
       ORDER BY s."startDate" ASC
       LIMIT 30`,
      { type: QueryTypes.SELECT }
    );

    const paymentsByStatus = await Payment.findAll({
      attributes: [
        'status',
        [fn('COUNT', col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const scheduleFillNormalized = upcomingScheduleFill.map((row) => ({
      scheduleId: row.scheduleId,
      startDate: row.startDate,
      masterClassName: row.masterClassName,
      maxParticipants: row.maxParticipants,
      enrolled: row.enrolled ?? 0,
      fillPercent:
        row.maxParticipants > 0
          ? Math.round(
              ((row.enrolled ?? 0) / row.maxParticipants) * 1000
            ) / 10
          : 0,
    }));

    res.json({
      success: true,
      data: {
        weeksWindow: weeks,
        enrollmentsByWeek: enrollmentsByWeek.map((row) => ({
          weekStart:
            row.weekStart instanceof Date
              ? row.weekStart.toISOString()
              : new Date(row.weekStart).toISOString(),
          count: parseInt(row.count, 10),
        })),
        masterClassesByCategory: masterClassesByCategory.map((row) => ({
          id: row.id,
          name: row.name,
          masterClassCount: Number(row.masterClassCount) || 0,
        })),
        upcomingScheduleFill: scheduleFillNormalized,
        paymentsByStatus: paymentsByStatus.map((row) => ({
          status: row.status,
          count: parseInt(row.count, 10),
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to load admin analytics dashboard',
      error: error.message,
    });
  }
};
