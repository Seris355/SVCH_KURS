const { Op, fn, col } = require('sequelize');
const {
  Schedule,
  MasterClass,
  Location,
  Payment,
  Participant,
} = require('../models');
const {
  beginPdfResponse,
  writeReportHeader,
  writeSectionTitle,
  writeKeyValueBlock,
  writeSimpleTable,
  formatRuDateTime,
  formatRuDate,
  formatMoney,
  paymentStatusRu,
} = require('../utils/pdfReportBuilder');

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

function buildPaymentSummary(payments) {
  const summaryMap = {
    paid: { status: 'paid', count: 0, amountSum: 0 },
    pending: { status: 'pending', count: 0, amountSum: 0 },
    cancelled: { status: 'cancelled', count: 0, amountSum: 0 },
  };

  payments.forEach((payment) => {
    const status = payment.status || 'pending';
    if (!summaryMap[status]) {
      summaryMap[status] = { status, count: 0, amountSum: 0 };
    }
    summaryMap[status].count += 1;
    summaryMap[status].amountSum += parseFloat(payment.amount) || 0;
  });

  return Object.values(summaryMap).filter((row) => row.count > 0);
}

function reportGeneratedAt() {
  return new Date().toLocaleString('ru-RU', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
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

    const summaryByStatus = summaryRows.map((row) => ({
      status: row.status,
      count: parseInt(row.count, 10),
      amountSum: row.amountSum != null ? parseFloat(row.amountSum) : 0,
    }));

    const totalAmountSum = summaryByStatus.reduce(
      (acc, row) => acc + (row.amountSum || 0),
      0
    );

    res.json({
      success: true,
      data: {
        generatedAt: reportGeneratedAt(),
        period: { dateFrom, dateTo },
        summaryByStatus,
        totals: {
          count: totalCount,
          amountSum: totalAmountSum,
        },
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
    const summaryByStatus = buildPaymentSummary(payments);
    const totalAmountSum = payments.reduce(
      (acc, row) => acc + (parseFloat(row.amount) || 0),
      0
    );

    res.json({
      success: true,
      data: {
        generatedAt: reportGeneratedAt(),
        schedule,
        enrolledCount,
        capacityLeft: Math.max(0, schedule.maxParticipants - enrolledCount),
        summaryByStatus,
        totals: {
          count: enrolledCount,
          amountSum: totalAmountSum,
        },
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

exports.exportScheduleParticipantsPdf = async (req, res) => {
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

    const summaryByStatus = buildPaymentSummary(payments);
    const totalAmountSum = payments.reduce(
      (acc, row) => acc + (parseFloat(row.amount) || 0),
      0
    );
    const generatedAt = reportGeneratedAt();
    const doc = beginPdfResponse(
      res,
      `otchet-seans-${scheduleId}.pdf`
    );

    writeReportHeader(doc, {
      title: 'Отчёт по участникам сеанса',
      subtitle: schedule.masterClass?.name || `Сеанс #${scheduleId}`,
      meta: [
        `Дата формирования: ${generatedAt}`,
        `Период сеанса: ${formatRuDateTime(schedule.startDate)} — ${formatRuDateTime(schedule.endDate)}`,
        schedule.location?.name
          ? `Площадка: ${schedule.location.name}`
          : null,
      ].filter(Boolean),
    });

    writeSectionTitle(doc, 'Сводка');
    writeKeyValueBlock(doc, [
      ['Участников в группе', `${payments.length} из ${schedule.maxParticipants}`],
      ['Свободных мест', String(Math.max(0, schedule.maxParticipants - payments.length))],
      ['Общая сумма счетов', formatMoney(totalAmountSum)],
    ]);

    writeSectionTitle(doc, 'Группировка по статусу оплаты');
    writeSimpleTable(doc, {
      headers: ['Статус', 'Количество', 'Сумма'],
      rows: summaryByStatus.map((row) => [
        paymentStatusRu(row.status),
        String(row.count),
        formatMoney(row.amountSum),
      ]),
      colWidths: [180, 100, 120],
      footerRow: [
        'Итого',
        String(payments.length),
        formatMoney(totalAmountSum),
      ],
    });

    writeSectionTitle(doc, 'Табличная часть: участники');
    if (!payments.length) {
      doc.fontSize(9).text('На сеансе нет участников.');
    } else {
      writeSimpleTable(doc, {
        headers: ['№', 'ФИО', 'E-mail', 'Статус', 'Сумма', 'Счёт'],
        rows: payments.map((row, index) => [
          String(index + 1),
          row.participant?.fullName || '—',
          row.participant?.email || '—',
          paymentStatusRu(row.status),
          formatMoney(row.amount),
          row.invoiceCode || '—',
        ]),
        colWidths: [28, 120, 120, 80, 70, 90],
        footerRow: [
          '',
          `Всего: ${payments.length}`,
          '',
          '',
          formatMoney(totalAmountSum),
          '',
        ],
      });
    }

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

exports.exportPaymentsFinancePdf = async (req, res) => {
  try {
    const range = parseDateRange(req.query);
    if (range.error) {
      return res.status(400).json({
        success: false,
        message: range.error,
      });
    }
    const { dateFrom, dateTo } = range;

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

    const rows = await Payment.findAll({
      where: dateWhere,
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: Participant,
          as: 'participant',
          attributes: ['id', 'fullName', 'email'],
        },
        {
          model: Schedule,
          as: 'schedule',
          attributes: ['id', 'startDate'],
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

    const summaryByStatus = summaryRows.map((row) => ({
      status: row.status,
      count: parseInt(row.count, 10),
      amountSum: row.amountSum != null ? parseFloat(row.amountSum) : 0,
    }));
    const totalAmountSum = summaryByStatus.reduce(
      (acc, row) => acc + (row.amountSum || 0),
      0
    );
    const generatedAt = reportGeneratedAt();
    const doc = beginPdfResponse(res, 'finansovyy-otchet.pdf');

    writeReportHeader(doc, {
      title: 'Финансовый отчёт по счетам',
      subtitle: 'Группировка и детализация за период',
      meta: [
        `Дата формирования: ${generatedAt}`,
        `Период: ${formatRuDate(dateFrom)} — ${formatRuDate(dateTo)}`,
      ],
    });

    writeSectionTitle(doc, 'Сводка за период');
    writeKeyValueBlock(doc, [
      ['Всего счетов', String(rows.length)],
      ['Общая сумма', formatMoney(totalAmountSum)],
    ]);

    writeSectionTitle(doc, 'Итоги по статусам');
    writeSimpleTable(doc, {
      headers: ['Статус', 'Количество', 'Сумма'],
      rows: summaryByStatus.map((row) => [
        paymentStatusRu(row.status),
        String(row.count),
        formatMoney(row.amountSum),
      ]),
      colWidths: [180, 100, 120],
      footerRow: [
        'Итого',
        String(rows.length),
        formatMoney(totalAmountSum),
      ],
    });

    writeSectionTitle(doc, 'Табличная часть: счета');
    if (!rows.length) {
      doc.fontSize(9).text('За выбранный период счетов нет.');
    } else {
      writeSimpleTable(doc, {
        headers: ['№', 'Участник', 'Мастер-класс', 'Статус', 'Сумма', 'Дата'],
        rows: rows.map((row, index) => [
          String(index + 1),
          row.participant?.fullName || '—',
          row.schedule?.masterClass?.name || '—',
          paymentStatusRu(row.status),
          formatMoney(row.amount),
          formatRuDateTime(row.createdAt),
        ]),
        colWidths: [28, 95, 110, 75, 65, 85],
        footerRow: [
          '',
          `Всего: ${rows.length}`,
          '',
          '',
          formatMoney(totalAmountSum),
          '',
        ],
      });
    }

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
