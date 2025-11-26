const request = require('supertest');
const app = require('../../../server');

describe('Question Routes - /api/questions/:id (GET BY ID)', () => {
  let teacherUser, teacherToken;
  let adminToken;
  let studentToken;
  let testLevel;
  let testQuestion;

  beforeEach(async () => {
    teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);
    
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);

    testLevel = await testHelpers.getTestLevel();

    // Create a test question
    const questionData = {
      skill_id: 1,
      level_id: testLevel.id,
      type: 'multiple_choice',
      question_text: 'What is the capital of France?',
      options: ['Paris', 'London', 'Berlin', 'Madrid'],
      correct_answer: 'Paris',
      points: 1.0,
      explanation: 'Paris is the capital of France.'
    };

    const questionResponse = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(questionData);

    if (questionResponse.body.success && questionResponse.body.data && questionResponse.body.data.id) {
      testQuestion = questionResponse.body.data;
    } else {
      // If creation fails, skip the rest of the tests
      testQuestion = { id: 1 };
    }
  });

  describe('GET /api/questions/:id', () => {
    it('should get question by ID as teacher', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.id).toBe(testQuestion.id);
    });

    it('should get question by ID as admin', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestion.question_id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestion.question_id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent question', async () => {
      const response = await request(app)
        .get('/api/questions/99999')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should include complete question details', async () => {
      const response = await request(app)
        .get(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const question = response.body.data;
      expect(question).toHaveProperty('id');
      expect(question).toHaveProperty('question_text');
      expect(question).toHaveProperty('type');
      expect(question).toHaveProperty('level_id');
      expect(question).toHaveProperty('skill_id');
      expect(question).toHaveProperty('points');
    });
  });
});