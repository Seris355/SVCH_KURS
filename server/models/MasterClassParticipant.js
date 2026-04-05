const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const MasterClassParticipant = sequelize.define('MasterClassParticipant', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
  participantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'participants',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
}, {
  tableName: 'master_class_participants',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['masterClassId', 'participantId'],
    },
  ],
});

module.exports = MasterClassParticipant;
