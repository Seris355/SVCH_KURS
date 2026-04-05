const { sequelize, Instructor, Participant, MasterClass, ParticipantPassword, RefreshToken, RecoveryToken } = require('../models');

async function resetDatabase() {
  try {
    
    await sequelize.authenticate();
    console.log('✓ Подключение к базе данных установлено.');

    
    
    await sequelize.sync({ force: true });
    console.log('✓ База данных полностью пересоздана.');

    console.log('✓ База данных успешно сброшена!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Ошибка при сбросе базы данных:', error);
    process.exit(1);
  }
}

resetDatabase();

