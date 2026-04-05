const sequelize = require('../config/database');
const Instructor = require('./Instructor');
const Participant = require('./Participant');
const MasterClass = require('./MasterClass');
const MasterClassParticipant = require('./MasterClassParticipant');
const ParticipantPassword = require('./ParticipantPassword');
const RefreshToken = require('./RefreshToken');
const RecoveryToken = require('./RecoveryToken');
const Review = require('./Review');




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

Participant.hasMany(Review, {
  foreignKey: 'participantId',
  as: 'reviews',
  onDelete: 'CASCADE',
});

MasterClass.hasMany(Review, {
  foreignKey: 'masterClassId',
  as: 'reviews',
  onDelete: 'CASCADE',
});

Review.belongsTo(Participant, {
  foreignKey: 'participantId',
  as: 'participant',
});

Review.belongsTo(MasterClass, {
  foreignKey: 'masterClassId',
  as: 'masterClass',
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
  Review,
};

