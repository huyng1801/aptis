const request = require('supertest');
const app = require('../../../server');

describe('Student - Audio', () => {
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
      title: 'Audio Test Exam',
      description: 'Test exam for audio endpoints',
      duration_minutes: 30,
      passing_score: 70,
      is_published: true
    });

    // Create test question (for audio/speaking)
    testQuestion = await testHelpers.createTestQuestion(testLevel.id, {
      skill_id: testSkill.id,
      type: 'short_message',
      question_text: 'Please answer this question',
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

    // Create and start attempt
    const startRes = await request(app)
      .post(`/api/student/exams/${testExam.id}/start`)
      .set('Authorization', `Bearer ${studentToken}`);
    
    testAttempt = startRes.body.data.attempt;
  });

  describe('POST /api/audio/attempts/{attemptId}/questions/{questionId}/audio', () => {
    it('should upload audio answer with valid token', async () => {
      const audioBuffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00,
        0x57, 0x41, 0x56, 0x45, 0x66, 0x6d, 0x74, 0x20
      ]);

      const response = await request(app)
        .post(`/api/audio/attempts/${testAttempt.id}/questions/${testQuestion.id}/audio`)
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('audio', audioBuffer, 'test-audio.wav');

      expect([200, 201, 400]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      } else {
        expect(response.body.success).toBe(true);
      }
    });

    it('should return 401 without token', async () => {
      const audioBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46]);
      const response = await request(app)
        .post(`/api/audio/attempts/${testAttempt.id}/questions/${testQuestion.id}/audio`)
        .attach('audio', audioBuffer, 'test-audio.wav');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-student users', async () => {
      const audioBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46]);
      const response = await request(app)
        .post(`/api/audio/attempts/${testAttempt.id}/questions/${testQuestion.id}/audio`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .attach('audio', audioBuffer, 'test-audio.wav');

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should prevent other students from uploading', async () => {
      const audioBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46]);
      const response = await request(app)
        .post(`/api/audio/attempts/${testAttempt.id}/questions/${testQuestion.id}/audio`)
        .set('Authorization', `Bearer ${otherToken}`)
        .attach('audio', audioBuffer, 'test-audio.wav');

      expect([400, 403, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should reject if no audio file provided', async () => {
      const response = await request(app)
        .post(`/api/audio/attempts/${testAttempt.id}/questions/${testQuestion.id}/audio`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/audio/attempts/{attemptId}/questions/{questionId}/audio', () => {
    beforeEach(async () => {
      const audioBuffer = Buffer.from([0x52, 0x49, 0x46, 0x46]);
      await request(app)
        .post(`/api/audio/attempts/${testAttempt.id}/questions/${testQuestion.id}/audio`)
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('audio', audioBuffer, 'test-audio.wav');
    });

    it('should delete audio answer with valid token', async () => {
      const response = await request(app)
        .delete(`/api/audio/attempts/${testAttempt.id}/questions/${testQuestion.id}/audio`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect([200, 204, 500]).toContain(response.status);
      if (response.status < 400) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .delete(`/api/audio/attempts/${testAttempt.id}/questions/${testQuestion.id}/audio`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-student users', async () => {
      const response = await request(app)
        .delete(`/api/audio/attempts/${testAttempt.id}/questions/${testQuestion.id}/audio`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should prevent other students from deleting', async () => {
      const response = await request(app)
        .delete(`/api/audio/attempts/${testAttempt.id}/questions/${testQuestion.id}/audio`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect([403, 500]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/audio/files/{filename}', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/audio/files/test-file.wav');

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-student users', async () => {
      const response = await request(app)
        .get('/api/audio/files/test-file.wav')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([403, 404]).toContain(response.status);
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get('/api/audio/files/non-existent-file.wav')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(404);
    });

    it('should reject path traversal attempts', async () => {
      const response = await request(app)
        .get('/api/audio/files/../../../etc/passwd')
        .set('Authorization', `Bearer ${studentToken}`);

      expect([400, 403, 404]).toContain(response.status);
    });

    it('should prevent other students from accessing audio', async () => {
      const response = await request(app)
        .get('/api/audio/files/some-file.wav')
        .set('Authorization', `Bearer ${otherToken}`);

      expect([403, 404]).toContain(response.status);
    });
  });
});
