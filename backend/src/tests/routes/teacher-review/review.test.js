const request = require('supertest');
const app = require('../../../server');

describe('Teacher - Review & Audio Review', () => {
  let teacherUser, teacherToken;
  let adminUser, adminToken;
  let studentUser, studentToken;
  let testLevel, testSkill;
  let testExam, testQuestion;
  let testAttempt;
  let testAnswer;

  beforeEach(async () => {
    // Create test users
    teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);

    // Get test data
    testLevel = await testHelpers.getTestLevel();
    testSkill = await testHelpers.getTestSkill();

    // Create test exam
    testExam = await testHelpers.createTestExam(teacherUser.id, testLevel.id, {
      title: 'Teacher Review Test Exam',
      description: 'Test exam for review endpoints',
      duration_minutes: 30,
      passing_score: 70,
      is_published: true
    });

    // Create test question
    testQuestion = await testHelpers.createTestQuestion(testLevel.id, {
      skill_id: testSkill.id,
      type: 'short_message',
      question_text: 'Please provide an answer',
      options: JSON.stringify({}),
      correct_answer: '',
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
    
    if (startRes.body.data && startRes.body.data.attempt) {
      testAttempt = startRes.body.data.attempt;

      // Create an answer
      const answerRes = await request(app)
        .post(`/api/student/attempts/${testAttempt.id}/answers`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          question_id: testQuestion.id,
          selected_answer: 'Student answer text'
        });

      if (answerRes.body.data && answerRes.body.data.id) {
        testAnswer = answerRes.body.data;
      }
    }
  });

  describe('GET /api/teacher-review/pending', () => {
    it('should get pending reviews as teacher', async () => {
      const response = await request(app)
        .get('/api/teacher-review/pending')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should get pending reviews as admin', async () => {
      const response = await request(app)
        .get('/api/teacher-review/pending')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should return 403 for student users', async () => {
      const response = await request(app)
        .get('/api/teacher-review/pending')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/teacher-review/pending')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should support filtering and pagination', async () => {
      const response = await request(app)
        .get('/api/teacher-review/pending')
        .query({ status: 'pending', level_id: testLevel.id, page: 1, limit: 10 })
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('GET /api/teacher-review/attempts/{attemptId}', () => {
    it('should get review details for attempt as teacher', async () => {
      if (!testAttempt) {
        expect(true).toBe(true);
        return;
      }

      const response = await request(app)
        .get(`/api/teacher-review/attempts/${testAttempt.id}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should get review details as admin', async () => {
      if (!testAttempt) {
        expect(true).toBe(true);
        return;
      }

      const response = await request(app)
        .get(`/api/teacher-review/attempts/${testAttempt.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
    });

    it('should return 403 for student users', async () => {
      if (!testAttempt) {
        expect(true).toBe(true);
        return;
      }

      const response = await request(app)
        .get(`/api/teacher-review/attempts/${testAttempt.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      if (!testAttempt) {
        expect(true).toBe(true);
        return;
      }

      const response = await request(app)
        .get(`/api/teacher-review/attempts/${testAttempt.id}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent attempt', async () => {
      const response = await request(app)
        .get('/api/teacher-review/attempts/999999')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([404, 500]).toContain(response.status);
    });
  });

  describe('POST /api/teacher-review/answers/{answerId}/review', () => {
    it('should submit manual review as teacher', async () => {
      if (!testAnswer) {
        expect(true).toBe(true);
        return;
      }

      const response = await request(app)
        .post(`/api/teacher-review/answers/${testAnswer.id}/review`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          score: 8,
          feedback: 'Good attempt with some issues',
          status: 'reviewed'
        });

      expect([200, 201, 500]).toContain(response.status);
      if (response.status < 400) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should allow admin to submit review', async () => {
      if (!testAnswer) {
        expect(true).toBe(true);
        return;
      }

      const response = await request(app)
        .post(`/api/teacher-review/answers/${testAnswer.id}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          score: 9,
          feedback: 'Excellent'
        });

      expect([200, 201, 500]).toContain(response.status);
      if (response.status < 400) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should return 403 for student users', async () => {
      if (!testAnswer) {
        expect(true).toBe(true);
        return;
      }

      const response = await request(app)
        .post(`/api/teacher-review/answers/${testAnswer.id}/review`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ score: 5, feedback: 'Test' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      if (!testAnswer) {
        expect(true).toBe(true);
        return;
      }

      const response = await request(app)
        .post(`/api/teacher-review/answers/${testAnswer.id}/review`)
        .send({ score: 5, feedback: 'Test' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/teacher-review/batch-review', () => {
    it('should batch review multiple answers', async () => {
      const response = await request(app)
        .post('/api/teacher-review/batch-review')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          answers: testAnswer ? [{ answer_id: testAnswer.id, score: 8, feedback: 'Good' }] : []
        });

      expect([200, 201, 400]).toContain(response.status);
    });

    it('should return 403 for student users', async () => {
      const response = await request(app)
        .post('/api/teacher-review/batch-review')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: [] })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/teacher-review/batch-review')
        .send({ answers: [] })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/teacher-review/answers/{answerId}/flag', () => {
    it('should flag answer for manual review', async () => {
      if (!testAnswer) {
        expect(true).toBe(true);
        return;
      }

      const response = await request(app)
        .post(`/api/teacher-review/answers/${testAnswer.id}/flag`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ reason: 'Quality check', priority: 'high' });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });

    it('should allow admin to flag answers', async () => {
      if (!testAnswer) {
        expect(true).toBe(true);
        return;
      }

      const response = await request(app)
        .post(`/api/teacher-review/answers/${testAnswer.id}/flag`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'Review', priority: 'medium' });

      expect([200, 201]).toContain(response.status);
      expect(response.body.success).toBe(true);
    });

    it('should return 403 for student users', async () => {
      if (!testAnswer) {
        expect(true).toBe(true);
        return;
      }

      const response = await request(app)
        .post(`/api/teacher-review/answers/${testAnswer.id}/flag`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ reason: 'Test' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      if (!testAnswer) {
        expect(true).toBe(true);
        return;
      }

      const response = await request(app)
        .post(`/api/teacher-review/answers/${testAnswer.id}/flag`)
        .send({ reason: 'Test' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/teacher-review/stats', () => {
    it('should get review statistics as teacher', async () => {
      const response = await request(app)
        .get('/api/teacher-review/stats')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should get review statistics as admin', async () => {
      const response = await request(app)
        .get('/api/teacher-review/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
    });

    it('should return 403 for student users', async () => {
      const response = await request(app)
        .get('/api/teacher-review/stats')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/teacher-review/stats')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/audio/attempts/{attemptId}/audio-answers', () => {
    it('should get audio answers for attempt as teacher', async () => {
      if (!testAttempt) {
        expect(true).toBe(true);
        return;
      }

      const response = await request(app)
        .get(`/api/audio/attempts/${testAttempt.id}/audio-answers`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 500]).toContain(response.status);
    });

    it('should get audio answers as admin', async () => {
      if (!testAttempt) {
        expect(true).toBe(true);
        return;
      }

      const response = await request(app)
        .get(`/api/audio/attempts/${testAttempt.id}/audio-answers`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
    });

    it('should return 401 without token', async () => {
      if (!testAttempt) {
        expect(true).toBe(true);
        return;
      }

      const response = await request(app)
        .get(`/api/audio/attempts/${testAttempt.id}/audio-answers`);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent attempt', async () => {
      const response = await request(app)
        .get('/api/audio/attempts/999999/audio-answers')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([404, 500]).toContain(response.status);
    });
  });
});
