const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ParticipantPassword = sequelize.define('ParticipantPassword', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  participantId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: 'participants',
      key: 'id',
    },
    onDelete: 'CASCADE',
  },
  passwordHash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'participant_passwords',
  timestamps: false,
});

module.exports = ParticipantPassword;
