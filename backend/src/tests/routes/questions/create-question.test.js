const request = require('supertest');
const app = require('../../../server');

describe('Question Routes - /api/questions (POST CREATE)', () => {
  let teacherUser, teacherToken;
  let adminToken;
  let studentToken;
  let testLevel;

  beforeEach(async () => {
    teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);
    
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);

    testLevel = await testHelpers.getTestLevel();
  });

  describe('POST /api/questions', () => {
    it('should create multiple choice question as teacher', async () => {
      const questionData = {
        skill_id: 1,
        level_id: testLevel.id,
        type: 'multiple_choice',
        question_text: 'Which is a correct sentence?',
        options: ['He go', 'He goes', 'He going', 'He gone'],
        correct_answer: 'He goes',
        points: 1.0,
        explanation: 'Third person singular requires "goes"'
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('multiple_choice');
      expect(response.body.data.question_text).toBe(questionData.question_text);
    });

    it('should create true/false question as teacher', async () => {
      const questionData = {
        skill_id: 1,
        level_id: testLevel.id,
        type: 'reading_true_false',
        question_text: 'The Earth is flat.',
        correct_answer: 'false',
        points: 1.0
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('reading_true_false');
    });

    it('should create essay question as teacher', async () => {
      const questionData = {
        skill_id: 1,
        level_id: testLevel.id,
        type: 'essay_opinion',
        question_text: 'Describe your ideal day in 200 words.',
        points: 5.0
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('essay_opinion');
    });

    it('should create audio response question as teacher', async () => {
      const questionData = {
        skill_id: 1,
        level_id: testLevel.id,
        type: 'listening_multiple_choice',
        question_text: 'Please read this sentence aloud.',
        points: 2.0
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('listening_multiple_choice');
    });

    it('should create question as admin', async () => {
      const questionData = {
        skill_id: 1,
        level_id: testLevel.id,
        type: 'multiple_choice',
        question_text: 'Admin created question',
        options: ['A', 'B', 'C'],
        correct_answer: 'A',
        points: 1.0
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(questionData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should return 403 for students', async () => {
      const questionData = {
        skill_id: 1,
        level_id: testLevel.id,
        type: 'multiple_choice',
        question_text: 'Student attempt',
        options: ['A', 'B'],
        correct_answer: 'A',
        points: 1.0
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(questionData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      const questionData = {
        skill_id: 1,
        type: 'multiple_choice',
        // Missing level_id and question_text
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid question type', async () => {
      const questionData = {
        skill_id: 1,
        level_id: testLevel.id,
        type: 'invalid_type',
        question_text: 'Test question',
        points: 1.0
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid skill_id', async () => {
      const questionData = {
        skill_id: 99999,
        level_id: testLevel.id,
        type: 'multiple_choice',
        question_text: 'Test question',
        options: ['A', 'B'],
        correct_answer: 'A',
        points: 1.0
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate points is positive', async () => {
      const questionData = {
        skill_id: 1,
        level_id: testLevel.id,
        type: 'multiple_choice',
        question_text: 'Test question',
        options: ['A', 'B'],
        correct_answer: 'A',
        points: -5.0
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should set default points if not provided', async () => {
      const questionData = {
        skill_id: 1,
        level_id: testLevel.id,
        type: 'multiple_choice',
        question_text: 'Test question',
        options: ['A', 'B'],
        correct_answer: 'A'
      };

      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)
        .expect(201);

      expect(response.body.data.points).toBeDefined();
      expect(parseFloat(response.body.data.points)).toBeGreaterThan(0);
    });
  });
});
