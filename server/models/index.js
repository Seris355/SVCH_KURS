const sequelize = require('../config/database');
const Instructor = require('./Instructor');
const Participant = require('./Participant');
const MasterClass = require('./MasterClass');
const MasterClassParticipant = require('./MasterClassParticipant');
const ParticipantPassword = require('./ParticipantPassword');
const RefreshToken = require('./RefreshToken');
const RecoveryToken = require('./RecoveryToken');




Instructor.hasMany(MasterClass, {
  foreignKey: 'instructorId',
  as: 'masterClasses',
});


MasterClass.belongsTo(Instructor, {
  foreignKey: 'instructorId',
  as: 'instructor',
});

MasterClass.belongsToMany(Participant, {
  through: MasterClassParticipant,
  foreignKey: 'masterClassId',
  otherKey: 'participantId',
  as: 'participants',
});

Participant.belongsToMany(MasterClass, {
  through: MasterClassParticipant,
  foreignKey: 'participantId',
  otherKey: 'masterClassId',
  as: 'masterClasses',
});

Participant.hasOne(ParticipantPassword, {
  foreignKey: 'participantId',
  as: 'password',
  onDelete: 'CASCADE',
});

Participant.hasMany(RefreshToken, {
  foreignKey: 'participantId',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
});

Participant.hasMany(RecoveryToken, {
  foreignKey: 'participantId',
  as: 'recoveryTokens',
  onDelete: 'CASCADE',
});

module.exports = {
  sequelize,
  Instructor,
  Participant,
  MasterClass,
  MasterClassParticipant,
  ParticipantPassword,
  RefreshToken,
  RecoveryToken,
};

