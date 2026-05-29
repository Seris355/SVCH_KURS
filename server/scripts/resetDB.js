const { sequelize } = require('../models');

async function resetDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Подключение к базе данных установлено.');

    await sequelize.sync({ force: true });
    console.log('База данных полностью пересоздана (все таблицы пустые).');

    process.exit(0);
  } catch (error) {
    console.error('Ошибка при сбросе базы данных:', error);
    process.exit(1);
  }
}

resetDatabase();
