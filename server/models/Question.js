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
  orderNumber: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: { args: [1], msg: 'Порядковый номер должен быть не менее 1' },
      isInt: { msg: 'Порядковый номер должен быть целым числом' },
    },
  },
}, {
  tableName: 'questions',
  timestamps: false,
});

module.exports = Question;
