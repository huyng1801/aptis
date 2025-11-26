const request = require('supertest');
const app = require('../../../server');

describe('Question Routes - /api/questions/:id (PUT UPDATE)', () => {
  let teacherUser, teacherToken;
  let adminToken;
  let studentToken;
  let testLevel;
  let testSkill;
  let testQuestion;

  beforeEach(async () => {
    teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);
    
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);

    testLevel = await testHelpers.getTestLevel();
    testSkill = await testHelpers.getTestSkill();
    testQuestion = await testHelpers.createTestQuestion(testLevel.id);
  });

  describe('PUT /api/questions/:id', () => {
    it('should update question successfully as teacher', async () => {
      const updateData = {
        question_text: 'Updated question text',
        explanation: 'Updated explanation',
        points: 2.5
      };

      const response = await request(app)
        .put(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.question_text).toBe(updateData.question_text);
      expect(response.body.data.explanation).toBe(updateData.explanation);
      expect(parseFloat(response.body.data.points)).toBe(updateData.points);
    });

    it('should update question successfully as admin', async () => {
      const updateData = {
        question_text: 'Admin updated question',
        points: 3.0
      };

      const response = await request(app)
        .put(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.question_text).toBe(updateData.question_text);
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .put(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ question_text: 'Updated' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/questions/${testQuestion.id}`)
        .send({ question_text: 'Updated' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent question', async () => {
      const response = await request(app)
        .put('/api/questions/99999')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ question_text: 'Updated question text', type: 'multiple_choice' })
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should allow partial updates', async () => {
      const updateData = {
        question_text: 'Only text updated'
      };

      const response = await request(app)
        .put(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.question_text).toBe(updateData.question_text);
      expect(response.body.data.explanation).toBe(testQuestion.explanation);
    });

    it('should update question type', async () => {
      const updateData = {
        type: 'reading_true_false',
        question_text: 'Is this true or false?'
      };

      const response = await request(app)
        .put(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.type).toBe('reading_true_false');
    });

    it('should update skill_id and level_id', async () => {
      const updateData = {
        skill_id: testSkill.id,
        level_id: testLevel.id
      };

      const response = await request(app)
        .put(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.skill_id).toBe(testSkill.id);
      expect(response.body.data.level_id).toBe(testLevel.id);
    });

    it('should update media_url', async () => {
      const updateData = {
        media_url: 'https://example.com/new-image.jpg'
      };

      const response = await request(app)
        .put(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.media_url).toBe(updateData.media_url);
    });

    it('should update correct_answer', async () => {
      const updateData = {
        correct_answer: 'C'
      };

      const response = await request(app)
        .put(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.correct_answer).toBe('C');
    });

    it('should return 400 for invalid points', async () => {
      const response = await request(app)
        .put(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ points: -1 })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for invalid question ID format', async () => {
      const response = await request(app)
        .put('/api/questions/invalid-id')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ question_text: 'Updated question text' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
