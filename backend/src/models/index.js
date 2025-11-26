const { sequelize } = require('../config/database');
const User = require('./User');
const Skill = require('./Skill');
const Level = require('./Level');
const Question = require('./Question');
const Exam = require('./Exam');
const ExamQuestion = require('./ExamQuestion');
const ExamAttempt = require('./ExamAttempt');
const AttemptAnswer = require('./AttemptAnswer');
const PracticeSession = require('./PracticeSession');
// Phase 3: AI models
const AIScoringRubric = require('./AIScoringRubric');

// Define associations

// Question associations
Question.belongsTo(Skill, { foreignKey: 'skill_id', as: 'skill' });
Question.belongsTo(Level, { foreignKey: 'level_id', as: 'level' });
Question.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Skill.hasMany(Question, { foreignKey: 'skill_id', as: 'questions' });
Level.hasMany(Question, { foreignKey: 'level_id', as: 'questions' });

// Exam associations
Exam.belongsTo(Level, { foreignKey: 'level_id', as: 'level' });
Exam.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Level.hasMany(Exam, { foreignKey: 'level_id', as: 'exams' });

// Exam-Question many-to-many
Exam.belongsToMany(Question, { 
  through: ExamQuestion, 
  foreignKey: 'exam_id',
  otherKey: 'question_id',
  as: 'questions' 
});
Question.belongsToMany(Exam, { 
  through: ExamQuestion, 
  foreignKey: 'question_id',
  otherKey: 'exam_id',
  as: 'exams' 
});
Exam.hasMany(ExamQuestion, { foreignKey: 'exam_id', as: 'examQuestions' });
ExamQuestion.belongsTo(Exam, { foreignKey: 'exam_id', as: 'exam' });
ExamQuestion.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });

// ExamAttempt associations
ExamAttempt.belongsTo(Exam, { foreignKey: 'exam_id', as: 'exam' });
ExamAttempt.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Exam.hasMany(ExamAttempt, { foreignKey: 'exam_id', as: 'attempts' });
User.hasMany(ExamAttempt, { foreignKey: 'user_id', as: 'examAttempts' });

// AttemptAnswer associations
AttemptAnswer.belongsTo(ExamAttempt, { foreignKey: 'attempt_id', as: 'attempt' });
AttemptAnswer.belongsTo(Question, { foreignKey: 'question_id', as: 'question' });
AttemptAnswer.belongsTo(User, { foreignKey: 'graded_by', as: 'grader' });
ExamAttempt.hasMany(AttemptAnswer, { foreignKey: 'attempt_id', as: 'answers' });
Question.hasMany(AttemptAnswer, { foreignKey: 'question_id', as: 'answers' });

// PracticeSession associations
PracticeSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
PracticeSession.belongsTo(Skill, { foreignKey: 'skill_id', as: 'skill' });
PracticeSession.belongsTo(Level, { foreignKey: 'level_id', as: 'level' });
User.hasMany(PracticeSession, { foreignKey: 'user_id', as: 'practiceSessions' });
Skill.hasMany(PracticeSession, { foreignKey: 'skill_id', as: 'practiceSessions' });
Level.hasMany(PracticeSession, { foreignKey: 'level_id', as: 'practiceSessions' });

// Phase 3: AI Scoring Rubric associations
AIScoringRubric.belongsTo(Skill, { foreignKey: 'skill_id', as: 'skill' });
AIScoringRubric.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Skill.hasMany(AIScoringRubric, { foreignKey: 'skill_id', as: 'scoringRubrics' });
User.hasMany(AIScoringRubric, { foreignKey: 'created_by', as: 'createdRubrics' });

const models = {
  User,
  Skill,
  Level,
  Question,
  Exam,
  ExamQuestion,
  ExamAttempt,
  AttemptAnswer,
  PracticeSession,
  AIScoringRubric
};

module.exports = {
  sequelize,
  ...models
};
