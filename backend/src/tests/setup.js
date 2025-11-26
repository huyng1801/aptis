const { sequelize } = require('../config/database');
const { User, Skill, Level, Question, Exam } = require('../models');

// Test database setup
beforeAll(async () => {
  // Force sync the database
  await sequelize.sync({ force: true });
  
  // Create test data
  await seedTestData();
});

afterAll(async () => {
  await sequelize.close();
});

// Clean database before each test
beforeEach(async () => {
  await cleanDatabase();
});

async function seedTestData() {
  // Create skills
  await Skill.bulkCreate([
    { id: 1, name: 'Grammar & Vocabulary', description: 'Grammar and vocabulary test', order_number: 1 },
    { id: 2, name: 'Listening', description: 'Listening test', order_number: 2 },
    { id: 3, name: 'Reading', description: 'Reading test', order_number: 3 },
    { id: 4, name: 'Writing', description: 'Writing test', order_number: 4 },
    { id: 5, name: 'Speaking', description: 'Speaking test', order_number: 5 }
  ]);

  // Create levels
  await Level.bulkCreate([
    { id: 1, name: 'A1', description: 'Beginner', order_number: 1, level_value: 1 },
    { id: 2, name: 'A2', description: 'Elementary', order_number: 2, level_value: 2 },
    { id: 3, name: 'B1', description: 'Intermediate', order_number: 3, level_value: 3 },
    { id: 4, name: 'B2', description: 'Upper Intermediate', order_number: 4, level_value: 4 }
  ]);
}

async function cleanDatabase() {
  try {
    // Disable foreign key checks temporarily
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    
    // Delete from all user-related tables only
    const tables = ['exam_attempts', 'attempt_answers', 'practice_sessions', 'users'];
    
    for (const tableName of tables) {
      try {
        await sequelize.query(`DELETE FROM \`${tableName}\``);
      } catch (err) {
        // Table might not exist, continue
      }
    }

    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
  } catch (err) {
    console.error('Error cleaning database:', err.message);
  }
}

// Helper functions for tests
global.testHelpers = {
  createTestUser: async (role = 'student', userData = {}) => {
    const password = userData.password || 'password123';
    const defaultUser = {
      email: `test-${role}-${Date.now()}-${Math.random()}@test.com`,
      password_hash: password, // Model hook will hash this
      full_name: `Test ${role}`,
      role: role,
      is_active: true,
      email_verified: true,
      verification_token: null,
      reset_password_token: null,
      reset_password_expires: null
    };
    
    const { password: _, ...rest } = userData;
    return await User.create({ ...defaultUser, ...rest });
  },

  getAuthToken: (user) => {
    const jwt = require('jsonwebtoken');
    const jwtConfig = require('../config/jwt');
    return jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      jwtConfig.secret,
      { expiresIn: '1h' }
    );
  },

  getTestLevel: async () => {
    const { Level } = require('../models');
    const level = await Level.findOne();
    return level || { id: 1, name: 'A1' };
  },

  getTestSkill: async () => {
    const { Skill } = require('../models');
    const skill = await Skill.findOne();
    return skill || { id: 1, name: 'Grammar & Vocabulary' };
  },

  createTestQuestion: async (levelId = 1, questionData = {}) => {
    const { Question, Skill, User } = require('../models');
    
    // Get a random skill
    const skill = await Skill.findOne();
    
    // Get a teacher to be the creator
    let teacher = await User.findOne({ where: { role: 'teacher' } });
    if (!teacher) {
      teacher = await global.testHelpers.createTestUser('teacher');
    }
    
    const defaultQuestion = {
      title: `Test Question ${Date.now()}`,
      question_text: 'What is this test question about?',
      type: 'multiple_choice',
      level_id: levelId || 1,
      skill_id: skill?.id || 1,
      difficulty_level: 'medium',
      correct_answer: 'A',
      options: JSON.stringify({ A: 'Option A', B: 'Option B', C: 'Option C', D: 'Option D' }),
      explanation: 'This is the explanation',
      is_published: true,
      created_by: teacher.id
    };

    return await Question.create({ ...defaultQuestion, ...questionData });
  },

  createTestExam: async (teacherId, levelId = 1, examData = {}) => {
    const { Exam } = require('../models');
    
    const defaultExam = {
      title: `Test Exam ${Date.now()}`,
      description: 'Test exam description',
      level_id: levelId || 1,
      duration_minutes: 60,
      passing_score: 70,
      max_attempts: 1,
      shuffle_questions: false,
      show_results_immediately: true,
      is_published: false,
      created_by: teacherId
    };

    return await Exam.create({ ...defaultExam, ...examData });
  }
};

module.exports = {
  seedTestData,
  cleanDatabase
};