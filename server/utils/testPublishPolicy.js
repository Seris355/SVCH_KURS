function validateTestForPublish(testInstance) {
  const questions = testInstance?.questions || [];

  if (questions.length === 0) {
    return {
      ok: false,
      message: 'Добавьте хотя бы один вопрос, чтобы опубликовать тест',
    };
  }

  for (let i = 0; i < questions.length; i += 1) {
    const question = questions[i];
    const answers = question.answers || [];
    const label = question.text?.trim() || `Вопрос ${i + 1}`;

    if (answers.length < 2) {
      return {
        ok: false,
        message: `«${label}»: нужно минимум 2 варианта ответа`,
      };
    }

    if (!answers.some((answer) => answer.isCorrect)) {
      return {
        ok: false,
        message: `«${label}»: отметьте хотя бы один верный ответ`,
      };
    }
  }

  return { ok: true, message: null };
}

module.exports = {
  validateTestForPublish,
};
