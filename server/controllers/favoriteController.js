const { Participant, Favorite, MasterClass, Instructor } = require('../models');

exports.getMyFavorites = async (req, res) => {
  try {
    const participantId = req.user.id;

    const participant = await Participant.findByPk(participantId, {
      attributes: ['id'],
      include: [
        {
          model: MasterClass,
          as: 'favorites',
          through: { attributes: [] },
          include: [
            {
              model: Instructor,
              as: 'instructor',
              attributes: ['id', 'fullName', 'specialization'],
            },
          ],
        },
      ],
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Участник не найден',
      });
    }

    res.json({
      success: true,
      data: participant.favorites || [],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при получении избранного',
      error: error.message,
    });
  }
};

exports.addFavorite = async (req, res) => {
  try {
    const participantId = req.user.id;
    const masterClassId = parseInt(req.params.masterClassId, 10);

    if (Number.isNaN(masterClassId)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный идентификатор мастер-класса',
      });
    }

    const masterClass = await MasterClass.findByPk(masterClassId);
    if (!masterClass) {
      return res.status(404).json({
        success: false,
        message: 'Мастер-класс не найден',
      });
    }

    const [row, created] = await Favorite.findOrCreate({
      where: { participantId, masterClassId },
      defaults: { participantId, masterClassId },
    });

    if (!created) {
      return res.status(400).json({
        success: false,
        message: 'Мастер-класс уже в избранном',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Добавлено в избранное',
      data: { id: row.id },
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Мастер-класс уже в избранном',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Ошибка при добавлении в избранное',
      error: error.message,
    });
  }
};

exports.removeFavorite = async (req, res) => {
  try {
    const participantId = req.user.id;
    const masterClassId = parseInt(req.params.masterClassId, 10);

    if (Number.isNaN(masterClassId)) {
      return res.status(400).json({
        success: false,
        message: 'Некорректный идентификатор мастер-класса',
      });
    }

    const deleted = await Favorite.destroy({
      where: { participantId, masterClassId },
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Запись в избранном не найдена',
      });
    }

    res.json({
      success: true,
      message: 'Удалено из избранного',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Ошибка при удалении из избранного',
      error: error.message,
    });
  }
};
