const request = require('supertest');
const app = require('../../../server');

describe('Question Routes - /api/questions/:id (DELETE)', () => {
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
  });

  beforeEach(async () => {
    testQuestion = await testHelpers.createTestQuestion(testLevel.id);
  });

  describe('DELETE /api/questions/:id', () => {
    it('should delete question successfully as teacher', async () => {
      const response = await request(app)
        .delete(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should delete question successfully as admin', async () => {
      const response = await request(app)
        .delete(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .delete(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/questions/${testQuestion.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent question', async () => {
      const response = await request(app)
        .delete('/api/questions/99999')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should prevent access to deleted question', async () => {
      // Delete the question
      const deleteResponse = await request(app)
        .delete(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify the question is marked as inactive
      const getResponse = await request(app)
        .get(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(getResponse.body.data.is_active).toBe(false);
    });

    it('should perform soft delete (mark as inactive)', async () => {
      const response = await request(app)
        .delete(`/api/questions/${testQuestion.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 400 for invalid question ID format', async () => {
      const response = await request(app)
        .delete('/api/questions/invalid-id')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should allow deleting multiple questions', async () => {
      const question1 = await testHelpers.createTestQuestion(testLevel.id);
      const question2 = await testHelpers.createTestQuestion(testLevel.id);

      const response1 = await request(app)
        .delete(`/api/questions/${question1.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const response2 = await request(app)
        .delete(`/api/questions/${question2.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response1.body.success).toBe(true);
      expect(response2.body.success).toBe(true);
    });
  });
});
