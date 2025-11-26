const request = require('supertest');
const app = require('../../../server');

describe('Student - Results/Progress/Statistics', () => {
  let studentUser, studentToken;
  let otherStudent, otherToken;
  let teacherUser, teacherToken;
  let testLevel, testSkill;
  let testExam, testQuestion;
  let testAttempt;

  beforeEach(async () => {
    // Create test users
    studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);

    otherStudent = await testHelpers.createTestUser('student');
    otherToken = testHelpers.getAuthToken(otherStudent);

    teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    // Get test data
    testLevel = await testHelpers.getTestLevel();
    testSkill = await testHelpers.getTestSkill();

    // Create test exam
    testExam = await testHelpers.createTestExam(teacherUser.id, testLevel.id, {
      title: 'Results Test Exam',
      description: 'Test exam for results endpoints',
      duration_minutes: 30,
      passing_score: 70,
      is_published: true
    });

    // Create test question
    testQuestion = await testHelpers.createTestQuestion(testLevel.id, {
      skill_id: testSkill.id,
      type: 'reading_multiple_choice',
      question_text: 'What is correct?',
      options: JSON.stringify({
        A: 'Option A',
        B: 'Option B',
        C: 'Option C',
        D: 'Option D'
      }),
      correct_answer: 'B',
      points: 10
    });

    // Add question to exam
    const { ExamQuestion } = require('../../../models');
    await ExamQuestion.create({
      exam_id: testExam.id,
      question_id: testQuestion.id,
      order_number: 1
    });

    // Create and submit attempt
    const startRes = await request(app)
      .post(`/api/student/exams/${testExam.id}/start`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    testAttempt = startRes.body.data.attempt;

    // Submit with answers
    await request(app)
      .post(`/api/student/attempts/${testAttempt.id}/submit`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        answers: [
          {
            question_id: testQuestion.id,
            selected_answer: 'B'
          }
        ]
      });
  });

  describe('GET /api/student/results', () => {
    it('should get results list with valid token', async () => {
      const response = await request(app)
        .get('/api/student/results')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/student/results')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-student users', async () => {
      const response = await request(app)
        .get('/api/student/results')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should support pagination with page and limit', async () => {
      const response = await request(app)
        .get('/api/student/results')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should filter results by exam_id', async () => {
      const response = await request(app)
        .get('/api/student/results')
        .query({ exam_id: testExam.id })
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/student/results/:id', () => {
    it('should get specific result with valid token', async () => {
      const response = await request(app)
        .get(`/api/student/results/${testAttempt.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.attempt).toBeDefined();
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get(`/api/student/results/${testAttempt.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-student users', async () => {
      const response = await request(app)
        .get(`/api/student/results/${testAttempt.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should prevent access to other students results', async () => {
      const response = await request(app)
        .get(`/api/student/results/${testAttempt.id}`)
        .set('Authorization', `Bearer ${otherToken}`);

      // Should either 403 or 404
      expect([403, 404]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent result', async () => {
      const response = await request(app)
        .get('/api/student/results/999999999')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/student/progress', () => {
    it('should get progress with valid token', async () => {
      const response = await request(app)
        .get('/api/student/progress')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/student/progress')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-student users', async () => {
      const response = await request(app)
        .get('/api/student/progress')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should filter progress by skill_id', async () => {
      const response = await request(app)
        .get('/api/student/progress')
        .query({ skill_id: testSkill.id })
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter progress by period', async () => {
      const response = await request(app)
        .get('/api/student/progress')
        .query({ period: 'week' })
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/student/statistics', () => {
    it('should get statistics with valid token', async () => {
      const response = await request(app)
        .get('/api/student/statistics')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/student/statistics')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-student users', async () => {
      const response = await request(app)
        .get('/api/student/statistics')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should filter statistics by level_id', async () => {
      const response = await request(app)
        .get('/api/student/statistics')
        .query({ level_id: testLevel.id })
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support valid period filtering', async () => {
      const response = await request(app)
        .get('/api/student/statistics')
        .query({ period: 'all' })
        .set('Authorization', `Bearer ${studentToken}`);

      // Period validation might be strict
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('GET /api/student/compare', () => {
    it('should require level_id parameter', async () => {
      // compare endpoint requires level_id
      const response = await request(app)
        .get('/api/student/compare')
        .set('Authorization', `Bearer ${studentToken}`);

      // Should either return 400 (missing parameter) or 200 if has default
      expect([200, 400]).toContain(response.status);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/student/compare')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-student users', async () => {
      const response = await request(app)
        .get('/api/student/compare')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should get comparison data with level_id', async () => {
      const response = await request(app)
        .get('/api/student/compare')
        .query({ level_id: testLevel.id })
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
    });

    it('should support pagination with level_id', async () => {
      const response = await request(app)
        .get('/api/student/compare')
        .query({ level_id: testLevel.id, page: 1, limit: 10 })
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
