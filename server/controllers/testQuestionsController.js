const { Test, Question, Answer } = require('../models');
const { validateTestForPublish } = require('../utils/testPublishPolicy');
const { loadTestWithTree } = require('./testController');

async function unpublishIfInvalid(testId) {
  const test = await Test.findByPk(testId);
  if (!test?.isPublished) {
    return;
  }

  const full = await loadTestWithTree(testId);
  const validation = validateTestForPublish(full);
  if (!validation.ok) {
    await test.update({ isPublished: false });
  }
}

async function resolveNextOrder(Model, fkField, fkValue) {
  const maxIdx = await Model.max('orderIndex', {
    where: { [fkField]: fkValue },
  });
  if (maxIdx == null || Number.isNaN(Number(maxIdx))) {
    return 0;
  }
  return Number(maxIdx) + 1;
}

exports.createQuestion = async (req, res) => {
  try {
    const testId = parseInt(req.params.id, 10);
    const { text, orderIndex } = req.body;

    if (!text || `${text}`.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Укажите текст вопроса',
      });
    }

    const test = await Test.findByPk(testId);
    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Тест не найден',
      });
    }

    const order =
      orderIndex !== undefined && orderIndex !== ''
        ? parseInt(orderIndex, 10)
        : await resolveNextOrder(Question, 'testId', testId);

    const row = await Question.create({
      testId,
      text: `${text}`.trim(),
      orderIndex: Number.isNaN(order) ? 0 : order,
    });

    res.status(201).json({
      success: true,
      message: 'Вопрос добавлен',
      data: row,
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      let errorMessages = error.errors ? error.errors.map((e) => e.message).join(', ') : error.message;
      errorMessages = errorMessages.replace(/^Validation error:\s*/i, '');
      return res.status(400).json({
        success: false,
        message: errorMessages,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании вопроса',
      error: error.message,
    });
  }
};

exports.updateQuestion = async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId, 10);
    const { text, orderIndex } = req.body;

    const row = await Question.findByPk(questionId);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Вопрос не найден',
      });
    }

    const patch = {};
    if (text !== undefined) patch.text = `${text}`.trim();
    if (orderIndex !== undefined) patch.orderIndex = parseInt(orderIndex, 10);

    await row.update(patch);

    res.json({
      success: true,
      message: 'Вопрос обновлён',
      data: row,
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      let errorMessages = error.errors ? error.errors.map((e) => e.message).join(', ') : error.message;
      errorMessages = errorMessages.replace(/^Validation error:\s*/i, '');
      return res.status(400).json({
        success: false,
        message: errorMessages,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении вопроса',
      error: error.message,
    });
  }
};

exports.deleteQuestion = async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId, 10);

    const row = await Question.findByPk(questionId);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Вопрос не найден',
      });
    }

    const testId = row.testId;
    await row.destroy();
    await unpublishIfInvalid(testId);

    res.json({
      success: true,
      message: 'Вопрос удалён',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении вопроса',
      error: error.message,
    });
  }
};

exports.createAnswer = async (req, res) => {
  try {
    const questionId = parseInt(req.params.questionId, 10);
    const { text, isCorrect, orderIndex } = req.body;

    if (!text || `${text}`.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Укажите текст варианта ответа',
      });
    }

    const question = await Question.findByPk(questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Вопрос не найден',
      });
    }

    const order =
      orderIndex !== undefined && orderIndex !== ''
        ? parseInt(orderIndex, 10)
        : await resolveNextOrder(Answer, 'questionId', questionId);

    const row = await Answer.create({
      questionId,
      text: `${text}`.trim(),
      isCorrect: Boolean(isCorrect),
      orderIndex: Number.isNaN(order) ? 0 : order,
    });

    res.status(201).json({
      success: true,
      message: 'Вариант ответа добавлен',
      data: row,
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      let errorMessages = error.errors ? error.errors.map((e) => e.message).join(', ') : error.message;
      errorMessages = errorMessages.replace(/^Validation error:\s*/i, '');
      return res.status(400).json({
        success: false,
        message: errorMessages,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Ошибка при создании ответа',
      error: error.message,
    });
  }
};

exports.updateAnswer = async (req, res) => {
  try {
    const answerId = parseInt(req.params.answerId, 10);
    const { text, isCorrect, orderIndex } = req.body;

    const row = await Answer.findByPk(answerId);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Ответ не найден',
      });
    }

    const patch = {};
    if (text !== undefined) patch.text = `${text}`.trim();
    if (isCorrect !== undefined) patch.isCorrect = Boolean(isCorrect);
    if (orderIndex !== undefined) patch.orderIndex = parseInt(orderIndex, 10);

    await row.update(patch);

    res.json({
      success: true,
      message: 'Ответ обновлён',
      data: row,
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      let errorMessages = error.errors ? error.errors.map((e) => e.message).join(', ') : error.message;
      errorMessages = errorMessages.replace(/^Validation error:\s*/i, '');
      return res.status(400).json({
        success: false,
        message: errorMessages,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Ошибка при обновлении ответа',
      error: error.message,
    });
  }
};

exports.deleteAnswer = async (req, res) => {
  try {
    const answerId = parseInt(req.params.answerId, 10);

    const row = await Answer.findByPk(answerId);
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'Ответ не найден',
      });
    }

    const question = await Question.findByPk(row.questionId);
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Вопрос не найден',
      });
    }

    const testId = question.testId;
    await row.destroy();
    await unpublishIfInvalid(testId);

    res.json({
      success: true,
      message: 'Ответ удалён',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении ответа',
      error: error.message,
    });
  }
};
