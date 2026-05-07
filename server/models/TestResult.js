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
  correctCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Число верных ответов не может быть отрицательным' },
    },
  },
  questionCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Число вопросов должно быть не меньше 1' },
    },
  },
  scorePercent: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Процент от 0 до 100' },
      max: { args: [100], msg: 'Процент от 0 до 100' },
      isInt: { msg: 'Процент должен быть целым числом' },
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
  indexes: [
    {
      name: 'test_results_participant_test_idx',
      fields: ['participantId', 'testId', 'completedAt'],
    },
  ],
});

module.exports = TestResult;
