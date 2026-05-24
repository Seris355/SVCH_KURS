const { Test, Question, Answer, TestResult } = require('../models');
const { Op } = require('sequelize');
const { validateTestForPublish } = require('../utils/testPublishPolicy');

async function loadTestWithTree(id) {
  return Test.findByPk(id, {
    include: [
      {
        model: Question,
        as: 'questions',
        separate: true,
        order: [['orderIndex', 'ASC']],
        include: [
          {
            model: Answer,
            as: 'answers',
            separate: true,
            order: [['orderIndex', 'ASC']],
          },
        ],
      },
    ],
  });
}

function stripCorrectFlags(testInstance) {
  const plain = testInstance.toJSON();
  if (!plain.questions) {
    return plain;
  }
  plain.questions = plain.questions.map((q) => {
    const answers = q.answers || [];
    const correctCount = answers.filter((a) => a.isCorrect).length;
    return {
      id: q.id,
      testId: q.testId,
      text: q.text,
      orderIndex: q.orderIndex,
      allowMultiple: correctCount > 1,
      answers: answers.map((a) => ({
        id: a.id,
        questionId: a.questionId,
        text: a.text,
        orderIndex: a.orderIndex,
      })),
    };
  });
  return plain;
}

exports.getAllTests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'ASC',
      search,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};
    const isAdmin = req.user?.role === 'admin';
    const includeDrafts =
      isAdmin &&
      String(req.query.includeDrafts || '').toLowerCase() === 'true';

    if (!includeDrafts) {
      where.isPublished = true;
    }

    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }

    const allowedSortFields = ['id', 'title', 'createdAt'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'id';

    const { count, rows } = await Test.findAndCountAll({
      where,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      order: [[validSortBy, sortOrder.toUpperCase()]],
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
      message: 'Ошибка при получении списка тестов',
      error: error.message,
    });
  }
};

exports.getTestById = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await loadTestWithTree(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Тест не найден',
      });
    }

    res.json({
      success: true,
      data: test,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении теста',
      error: error.message,
    });
  }
};

exports.getTestForTaking = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await loadTestWithTree(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Тест не найден',
      });
    }

    if (!test.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Тест недоступен',
      });
    }

    const data = stripCorrectFlags(test);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при подготовке теста',
      error: error.message,
    });
  }
};

exports.createTest = async (req, res) => {
  try {
    const { title, description } = req.body;

    const test = await Test.create({
      title,
      description,
      isPublished: false,
    });

    res.status(201).json({
      success: true,
      message: 'Тест успешно создан',
      data: test,
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

    res.status(400).json({
      success: false,
      message: 'Ошибка при создании теста',
      error: error.message,
    });
  }
};

exports.updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    const test = await Test.findByPk(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Тест не найден',
      });
    }

    await test.update({
      title,
      description,
    });

    res.json({
      success: true,
      message: 'Тест успешно обновлён',
      data: test,
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

    res.status(400).json({
      success: false,
      message: 'Ошибка при обновлении теста',
      error: error.message,
    });
  }
};

exports.deleteTest = async (req, res) => {
  try {
    const { id } = req.params;

    const test = await Test.findByPk(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Тест не найден',
      });
    }

    await test.destroy();

    res.json({
      success: true,
      message: 'Тест успешно удалён',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении теста',
      error: error.message,
    });
  }
};

exports.submitTest = async (req, res) => {
  try {
    const { id } = req.params;
    const participantId = req.user.id;
    const { answers: submittedAnswers } = req.body;

    if (!Array.isArray(submittedAnswers)) {
      return res.status(400).json({
        success: false,
        message: 'Ожидается массив answers с questionId и answerIds',
      });
    }

    const test = await loadTestWithTree(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Тест не найден',
      });
    }

    if (!test.isPublished) {
      return res.status(404).json({
        success: false,
        message: 'Тест недоступен',
      });
    }

    const questions = test.questions || [];

    if (questions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'В тесте нет вопросов',
      });
    }

    const questionIds = new Set(questions.map((q) => q.id));
    const seenQuestions = new Set();

    for (const row of submittedAnswers) {
      if (
        !row ||
        row.questionId === undefined ||
        row.questionId === null
      ) {
        return res.status(400).json({
          success: false,
          message: 'Каждый элемент answers должен содержать questionId',
        });
      }
      const qid = parseInt(row.questionId, 10);
      if (Number.isNaN(qid)) {
        return res.status(400).json({
          success: false,
          message: 'Некорректный questionId',
        });
      }
      if (!questionIds.has(qid)) {
        return res.status(400).json({
          success: false,
          message: `Вопрос ${qid} не относится к этому тесту`,
        });
      }
      if (seenQuestions.has(qid)) {
        return res.status(400).json({
          success: false,
          message: `Вопрос ${qid} указан более одного раза`,
        });
      }
      seenQuestions.add(qid);
    }

    if (seenQuestions.size !== questions.length) {
      return res.status(400).json({
        success: false,
        message: 'Необходимо ответить на каждый вопрос теста',
      });
    }

    let correctCount = 0;

    for (const question of questions) {
      const row = submittedAnswers.find(
        (r) => parseInt(r.questionId, 10) === question.id
      );

      const correctIds = (question.answers || [])
        .filter((a) => a.isCorrect)
        .map((a) => a.id);
      const allowMultiple = correctIds.length > 1;

      let chosenIds = [];
      if (Array.isArray(row?.answerIds)) {
        chosenIds = row.answerIds.map((id) => parseInt(id, 10));
      } else if (row?.answerId != null) {
        chosenIds = [parseInt(row.answerId, 10)];
      }

      if (chosenIds.some((id) => Number.isNaN(id))) {
        return res.status(400).json({
          success: false,
          message: `Некорректный answerId для вопроса ${question.id}`,
        });
      }

      if (allowMultiple) {
        if (chosenIds.length === 0) {
          return res.status(400).json({
            success: false,
            message: `Выберите хотя бы один ответ для вопроса ${question.id}`,
          });
        }
      } else if (chosenIds.length !== 1) {
        return res.status(400).json({
          success: false,
          message: `Для вопроса ${question.id} нужно выбрать один ответ`,
        });
      }

      for (const answerId of chosenIds) {
        const chosen = await Answer.findByPk(answerId);
        if (!chosen || chosen.questionId !== question.id) {
          return res.status(400).json({
            success: false,
            message: `Некорректный ответ для вопроса ${question.id}`,
          });
        }
      }

      const chosenSet = new Set(chosenIds);
      const isQuestionCorrect =
        correctIds.length === chosenIds.length &&
        correctIds.every((id) => chosenSet.has(id));

      if (isQuestionCorrect) {
        correctCount += 1;
      }
    }

    const questionCount = questions.length;
    const scorePercent = Math.round((correctCount / questionCount) * 100);

    const result = await TestResult.create({
      participantId,
      testId: test.id,
      correctCount,
      questionCount,
      scorePercent,
      completedAt: new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Результат сохранён',
      data: {
        result,
        summary: { correctCount, questionCount, scorePercent },
      },
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
      message: 'Ошибка при отправке ответов',
      error: error.message,
    });
  }
};

exports.publishTest = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await loadTestWithTree(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Тест не найден',
      });
    }

    const validation = validateTestForPublish(test);
    if (!validation.ok) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    await test.update({ isPublished: true });

    res.json({
      success: true,
      message: 'Тест опубликован',
      data: test,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при публикации теста',
      error: error.message,
    });
  }
};

exports.unpublishTest = async (req, res) => {
  try {
    const { id } = req.params;
    const test = await Test.findByPk(id);

    if (!test) {
      return res.status(404).json({
        success: false,
        message: 'Тест не найден',
      });
    }

    await test.update({ isPublished: false });

    res.json({
      success: true,
      message: 'Тест снят с публикации',
      data: test,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при снятии теста с публикации',
      error: error.message,
    });
  }
};

exports.loadTestWithTree = loadTestWithTree;
