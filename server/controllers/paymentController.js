const { Payment, Participant, Schedule, MasterClass } = require('../models');
const { Op } = require('sequelize');

exports.listPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      search,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (status && ['pending', 'paid', 'cancelled'].includes(status)) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { invoiceCode: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Payment.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
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
          attributes: ['id', 'startDate', 'endDate', 'maxParticipants'],
          include: [
            {
              model: MasterClass,
              as: 'masterClass',
              attributes: ['id', 'name', 'price'],
            },
          ],
        },
      ],
    });

    res.json({
      success: true,
      data: rows,
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
      message: 'Ошибка при получении счетов',
      error: error.message,
    });
  }
};

exports.markPaid = async (req, res) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findByPk(id);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Счёт не найден',
      });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Счёт уже обработан',
      });
    }

    await payment.update({
      status: 'paid',
      paidAt: new Date(),
    });

    res.json({
      success: true,
      message: 'Отмечено как оплачено',
      data: payment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении счёта',
      error: error.message,
    });
  }
};

exports.myPayments = async (req, res) => {
  try {
    const participantId = req.user.id;

    const rows = await Payment.findAll({
      where: { participantId },
      order: [['createdAt', 'DESC']],
      include: [
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
      data: rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении ваших счетов',
      error: error.message,
    });
  }
};
