const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TestResult = sequelize.define('TestResult', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  participantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'participants', key: 'id' },
    onDelete: 'CASCADE',
  },
  testId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'tests', key: 'id' },
    onDelete: 'CASCADE',
  },
  score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Результат не может быть отрицательным' },
      isInt: { msg: 'Результат должен быть целым числом' },
    },
  },
  totalQuestions: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Количество вопросов должно быть не менее 1' },
      isInt: { msg: 'Количество вопросов должно быть целым числом' },
    },
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'test_results',
  timestamps: false,
});

module.exports = TestResult;
