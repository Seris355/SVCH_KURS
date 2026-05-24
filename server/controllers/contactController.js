const { ContactRequest, ContactThread, ContactMessage, Participant } = require('../models');
const { Op } = require('sequelize');

async function getOrCreateThread(participantId) {
  const [thread] = await ContactThread.findOrCreate({
    where: { participantId },
    defaults: {
      participantId,
      lastMessageAt: new Date(),
    },
  });
  return thread;
}

function normalizeMessage(message) {
  return typeof message === 'string' ? message.trim() : '';
}

exports.createContactRequest = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const trimmedName = typeof name === 'string' ? name.trim() : '';
    const trimmedEmail = typeof email === 'string' ? email.trim() : '';
    const trimmedMessage = typeof message === 'string' ? message.trim() : '';

    if (!trimmedName || !trimmedEmail || !trimmedMessage) {
      return res.status(400).json({
        success: false,
        message: 'Заполните имя, e-mail и текст сообщения',
      });
    }

    let participantId = null;
    if (req.user && req.user.role === 'participant') {
      participantId = req.user.id;
    }

    const row = await ContactRequest.create({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
      participantId,
    });

    res.status(201).json({
      success: true,
      message: 'Сообщение отправлено',
      data: { id: row.id },
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      let errorMessages = error.errors ? error.errors.map((e) => e.message).join(', ') : error.message;
      errorMessages = errorMessages.replace(/^Validation error:\s*/i, '');
      return res.status(400).json({
        success: false,
        message: errorMessages,
        error: errorMessages,
      });
    }

    res.status(500).json({
      success: false,
      message: 'Не удалось сохранить обращение',
      error: error.message,
    });
  }
};

exports.getAllContactRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortOrder = 'DESC',
      isRead: isReadFilter,
      search,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (isReadFilter === 'true') {
      where.isRead = true;
    } else if (isReadFilter === 'false') {
      where.isRead = false;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { message: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const orderDir = String(sortOrder).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const { count, rows } = await ContactRequest.findAndCountAll({
      where,
      include: [
        {
          model: Participant,
          as: 'participant',
          attributes: ['id', 'fullName', 'email'],
          required: false,
        },
      ],
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [['createdAt', orderDir]],
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
      message: 'Ошибка при получении обращений',
      error: error.message,
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const row = await ContactRequest.findByPk(id);

    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Обращение не найдено',
      });
    }

    await row.update({ isRead: true });

    res.json({
      success: true,
      message: 'Отмечено как прочитанное',
      data: row,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении обращения',
      error: error.message,
    });
  }
};

exports.getMyThread = async (req, res) => {
  try {
    const thread = await getOrCreateThread(req.user.id);

    await ContactMessage.update(
      { readByParticipant: true },
      {
        where: {
          threadId: thread.id,
          senderRole: 'admin',
          readByParticipant: false,
        },
      }
    );

    const messages = await ContactMessage.findAll({
      where: { threadId: thread.id },
      order: [['createdAt', 'ASC']],
    });

    res.json({
      success: true,
      data: {
        thread,
        messages,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении переписки',
      error: error.message,
    });
  }
};

exports.sendParticipantMessage = async (req, res) => {
  try {
    const message = normalizeMessage(req.body.message);
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Введите текст сообщения',
      });
    }

    const thread = await getOrCreateThread(req.user.id);
    const row = await ContactMessage.create({
      threadId: thread.id,
      senderRole: 'participant',
      message,
      readByAdmin: false,
      readByParticipant: true,
    });

    await thread.update({ lastMessageAt: row.createdAt });

    res.status(201).json({
      success: true,
      message: 'Сообщение отправлено',
      data: row,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не удалось отправить сообщение',
      error: error.message,
    });
  }
};

exports.getThreads = async (req, res) => {
  try {
    const { search } = req.query;
    const participantWhere = {};

    if (search && String(search).trim()) {
      const value = `%${String(search).trim()}%`;
      participantWhere[Op.or] = [
        { fullName: { [Op.iLike]: value } },
        { email: { [Op.iLike]: value } },
      ];
    }

    const rows = await ContactThread.findAll({
      include: [
        {
          model: Participant,
          as: 'participant',
          attributes: ['id', 'fullName', 'email', 'phone'],
          where: participantWhere,
        },
        {
          model: ContactMessage,
          as: 'messages',
          separate: true,
          limit: 1,
          order: [['createdAt', 'DESC']],
        },
      ],
      order: [['lastMessageAt', 'DESC']],
    });

    const unreadRows = await ContactMessage.findAll({
      attributes: ['threadId'],
      where: {
        senderRole: 'participant',
        readByAdmin: false,
      },
      raw: true,
    });
    const unreadMap = unreadRows.reduce((acc, row) => {
      acc[row.threadId] = (acc[row.threadId] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: rows.map((thread) => {
        const json = thread.toJSON();
        return {
          ...json,
          unreadCount: unreadMap[json.id] || 0,
          lastMessage: json.messages?.[0] || null,
          messages: undefined,
        };
      }),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении чатов',
      error: error.message,
    });
  }
};

exports.getAdminThread = async (req, res) => {
  try {
    const thread = await ContactThread.findByPk(req.params.threadId, {
      include: [
        {
          model: Participant,
          as: 'participant',
          attributes: ['id', 'fullName', 'email', 'phone'],
        },
      ],
    });

    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Чат не найден',
      });
    }

    await ContactMessage.update(
      { readByAdmin: true },
      {
        where: {
          threadId: thread.id,
          senderRole: 'participant',
          readByAdmin: false,
        },
      }
    );

    const messages = await ContactMessage.findAll({
      where: { threadId: thread.id },
      order: [['createdAt', 'ASC']],
    });

    res.json({
      success: true,
      data: {
        thread,
        messages,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении чата',
      error: error.message,
    });
  }
};

exports.sendAdminMessage = async (req, res) => {
  try {
    const thread = await ContactThread.findByPk(req.params.threadId);
    if (!thread) {
      return res.status(404).json({
        success: false,
        message: 'Чат не найден',
      });
    }

    const message = normalizeMessage(req.body.message);
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Введите текст сообщения',
      });
    }

    const row = await ContactMessage.create({
      threadId: thread.id,
      senderRole: 'admin',
      message,
      readByAdmin: true,
      readByParticipant: false,
    });

    await thread.update({ lastMessageAt: row.createdAt });

    res.status(201).json({
      success: true,
      message: 'Сообщение отправлено',
      data: row,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не удалось отправить сообщение',
      error: error.message,
    });
  }
};

exports.startAdminThread = async (req, res) => {
  try {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const message = normalizeMessage(req.body.message);

    if (!email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Введите email участника и текст сообщения',
      });
    }

    const participant = await Participant.findOne({
      where: { email: { [Op.iLike]: email } },
      attributes: ['id', 'fullName', 'email', 'phone'],
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Участник с такой почтой не найден',
      });
    }

    const thread = await getOrCreateThread(participant.id);
    const row = await ContactMessage.create({
      threadId: thread.id,
      senderRole: 'admin',
      message,
      readByAdmin: true,
      readByParticipant: false,
    });

    await thread.update({ lastMessageAt: row.createdAt });

    res.status(201).json({
      success: true,
      message: 'Сообщение отправлено',
      data: {
        threadId: thread.id,
        message: row,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Не удалось создать чат',
      error: error.message,
    });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await ContactMessage.count({
      where: {
        senderRole: 'participant',
        readByAdmin: false,
      },
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении количества новых сообщений',
      error: error.message,
    });
  }
};
