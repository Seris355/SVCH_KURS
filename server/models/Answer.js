const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Answer = sequelize.define('Answer', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  questionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'questions', key: 'id' },
    onDelete: 'CASCADE',
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Текст варианта ответа не может быть пустым' },
    },
  },
  isCorrect: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Порядок варианта не может быть отрицательным' },
    },
  },
}, {
  tableName: 'answers',
  timestamps: false,
  indexes: [
    {
      name: 'answers_question_order_idx',
      fields: ['questionId', 'orderIndex'],
    },
  ],
});

module.exports = Answer;
