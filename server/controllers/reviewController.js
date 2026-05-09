const { Review, MasterClass } = require('../models');

exports.createReview = async (req, res) => {
  try {
    const participantId = req.user.id;
    const { masterClassId, rating, comment } = req.body;

    if (masterClassId === undefined || masterClassId === null) {
      return res.status(400).json({
        success: false,
        message: 'Не указан идентификатор мастер-класса',
      });
    }

    const mcId = parseInt(masterClassId, 10);
    if (Number.isNaN(mcId)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный идентификатор мастер-класса',
      });
    }

    const r = parseInt(rating, 10);
    if (Number.isNaN(r) || r < 1 || r > 5) {
      return res.status(400).json({
        success: false,
        message: 'Оценка должна быть целым числом от 1 до 5',
      });
    }

    const masterClass = await MasterClass.findByPk(mcId);
    if (!masterClass) {
      return res.status(404).json({
        success: false,
        message: 'Мастер-класс не найден',
      });
    }

    const ids = masterClass.participantIds || [];
    if (!ids.includes(participantId)) {
      return res.status(403).json({
        success: false,
        message: 'Отзыв можно оставить только после записи на этот мастер-класс',
      });
    }

    const review = await Review.create({
      participantId,
      masterClassId: mcId,
      rating: r,
      comment: comment != null && String(comment).trim() !== '' ? String(comment).trim() : null,
    });

    res.status(201).json({
      success: true,
      message: 'Отзыв сохранён',
      data: review,
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Вы уже оставляли отзыв на этот мастер-класс',
      });
    }
    if (error.name === 'SequelizeValidationError') {
      const msg = error.errors ? error.errors.map((e) => e.message).join(', ') : error.message;
      return res.status(400).json({
        success: false,
        message: msg,
      });
    }
    res.status(500).json({
      success: false,
      message: 'Ошибка при сохранении отзыва',
      error: error.message,
    });
  }
};
