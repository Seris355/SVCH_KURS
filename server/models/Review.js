const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Review = sequelize.define('Review', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  participantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'participants',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  masterClassId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'masterclasses',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: { args: [1], msg: 'Оценка от 1 до 5' },
      max: { args: [5], msg: 'Оценка от 1 до 5' },
      isInt: { msg: 'Оценка должна быть целым числом' },
    },
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'reviews',
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['participantId', 'masterClassId'],
      name: 'reviews_participant_master_class_unique',
    },
  ],
});

module.exports = Review;
