const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Question = sequelize.define('Question', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  testId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'tests', key: 'id' },
    onDelete: 'CASCADE',
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Текст вопроса не может быть пустым' },
    },
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Порядок вопроса не может быть отрицательным' },
    },
  },
}, {
  tableName: 'questions',
  timestamps: false,
  indexes: [
    {
      name: 'questions_test_order_idx',
      fields: ['testId', 'orderIndex'],
    },
  ],
});

module.exports = Question;
