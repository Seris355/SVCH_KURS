const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ScheduleReminderLog = sequelize.define(
  'ScheduleReminderLog',
  {
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
    scheduleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'schedules', key: 'id' },
      onDelete: 'CASCADE',
    },
    kind: {
      type: DataTypes.STRING(48),
      allowNull: false,
      defaultValue: 'session_upcoming',
    },
    sentAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: 'schedule_reminder_logs',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['participantId', 'scheduleId', 'kind'],
        name: 'schedule_reminder_logs_unique_kind',
      },
    ],
  }
);

module.exports = ScheduleReminderLog;
