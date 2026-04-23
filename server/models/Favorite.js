const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Favorite = sequelize.define('Favorite', {
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
  masterClassId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: 'masterclasses', key: 'id' },
    onDelete: 'CASCADE',
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'favorites',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['participantId', 'masterClassId'],
      name: 'favorites_participant_masterclass_unique',
    },
  ],
});

module.exports = Favorite;
