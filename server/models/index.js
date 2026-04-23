const sequelize = require('../config/database');
const Instructor = require('./Instructor');
const Participant = require('./Participant');
const MasterClass = require('./MasterClass');
const MasterClassParticipant = require('./MasterClassParticipant');
const ParticipantPassword = require('./ParticipantPassword');
const RefreshToken = require('./RefreshToken');
const RecoveryToken = require('./RecoveryToken');
const Review = require('./Review');
const Category = require('./Category');
const Location = require('./Location');
const Schedule = require('./Schedule');
const Payment = require('./Payment');
const MasterClassCategory = require('./MasterClassCategory');
const Favorite = require('./Favorite');
const ContactRequest = require('./ContactRequest');
const Test = require('./Test');
const Question = require('./Question');
const Answer = require('./Answer');
const TestResult = require('./TestResult');

// Instructor <-> MasterClass
Instructor.hasMany(MasterClass, {
  foreignKey: 'instructorId',
  as: 'masterClasses',
});
MasterClass.belongsTo(Instructor, {
  foreignKey: 'instructorId',
  as: 'instructor',
});

// MasterClass <-> Participant (через junction)
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

// Participant -> ParticipantPassword
Participant.hasOne(ParticipantPassword, {
  foreignKey: 'participantId',
  as: 'password',
  onDelete: 'CASCADE',
});

// Participant -> RefreshToken
Participant.hasMany(RefreshToken, {
  foreignKey: 'participantId',
  as: 'refreshTokens',
  onDelete: 'CASCADE',
});

// Participant -> RecoveryToken
Participant.hasMany(RecoveryToken, {
  foreignKey: 'participantId',
  as: 'recoveryTokens',
  onDelete: 'CASCADE',
});

// Review
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

// MasterClass <-> Category (через junction)
MasterClass.belongsToMany(Category, {
  through: MasterClassCategory,
  foreignKey: 'masterClassId',
  otherKey: 'categoryId',
  as: 'categories',
});
Category.belongsToMany(MasterClass, {
  through: MasterClassCategory,
  foreignKey: 'categoryId',
  otherKey: 'masterClassId',
  as: 'masterClasses',
});

// MasterClass -> Schedule
MasterClass.hasMany(Schedule, {
  foreignKey: 'masterClassId',
  as: 'schedules',
  onDelete: 'CASCADE',
});
Schedule.belongsTo(MasterClass, {
  foreignKey: 'masterClassId',
  as: 'masterClass',
});

// Location -> Schedule
Location.hasMany(Schedule, {
  foreignKey: 'locationId',
  as: 'schedules',
});
Schedule.belongsTo(Location, {
  foreignKey: 'locationId',
  as: 'location',
});

// Schedule -> Payment
Schedule.hasMany(Payment, {
  foreignKey: 'scheduleId',
  as: 'payments',
  onDelete: 'CASCADE',
});
Payment.belongsTo(Schedule, {
  foreignKey: 'scheduleId',
  as: 'schedule',
});

// Participant -> Payment
Participant.hasMany(Payment, {
  foreignKey: 'participantId',
  as: 'payments',
  onDelete: 'CASCADE',
});
Payment.belongsTo(Participant, {
  foreignKey: 'participantId',
  as: 'participant',
});

// Participant <-> MasterClass (favorites)
Participant.belongsToMany(MasterClass, {
  through: Favorite,
  foreignKey: 'participantId',
  otherKey: 'masterClassId',
  as: 'favorites',
});
MasterClass.belongsToMany(Participant, {
  through: Favorite,
  foreignKey: 'masterClassId',
  otherKey: 'participantId',
  as: 'favoritedBy',
});

// Test -> Question -> Answer
Test.hasMany(Question, {
  foreignKey: 'testId',
  as: 'questions',
  onDelete: 'CASCADE',
});
Question.belongsTo(Test, {
  foreignKey: 'testId',
  as: 'test',
});

Question.hasMany(Answer, {
  foreignKey: 'questionId',
  as: 'answers',
  onDelete: 'CASCADE',
});
Answer.belongsTo(Question, {
  foreignKey: 'questionId',
  as: 'question',
});

// Participant -> TestResult <- Test
Participant.hasMany(TestResult, {
  foreignKey: 'participantId',
  as: 'testResults',
  onDelete: 'CASCADE',
});
TestResult.belongsTo(Participant, {
  foreignKey: 'participantId',
  as: 'participant',
});

Test.hasMany(TestResult, {
  foreignKey: 'testId',
  as: 'results',
  onDelete: 'CASCADE',
});
TestResult.belongsTo(Test, {
  foreignKey: 'testId',
  as: 'test',
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
  Category,
  Location,
  Schedule,
  Payment,
  MasterClassCategory,
  Favorite,
  ContactRequest,
  Test,
  Question,
  Answer,
  TestResult,
};
