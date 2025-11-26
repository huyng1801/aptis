const request = require('supertest');
const app = require('../../../server');

describe('Exam Routes - /api/exams/:id (DELETE)', () => {
  let teacherUser, teacherToken;
  let adminToken;
  let testLevel;
  let testExam;

  beforeEach(async () => {
    teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);
    
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    testLevel = await testHelpers.getTestLevel();
    
    const examData = {
      title: 'Test Exam for Delete',
      level_id: testLevel.id,
      duration_minutes: 60
    };

    const examResponse = await request(app)
      .post('/api/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(examData);

    testExam = examResponse.body.data.exam;
  });

  describe('DELETE /api/exams/:id', () => {
    it('should delete exam successfully', async () => {
      const response = await request(app)
        .delete(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted');
    });

    it('should return 404 for non-existent exam', async () => {
      const response = await request(app)
        .delete('/api/exams/99999')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for students', async () => {
      const studentUser = await testHelpers.createTestUser('student');
      const studentToken = testHelpers.getAuthToken(studentUser);

      const response = await request(app)
        .delete(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should allow admin to delete other user exams', async () => {
      const response = await request(app)
        .delete(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should prevent access after deletion', async () => {
      // Delete the exam
      await request(app)
        .delete(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // Try to access it again
      const response = await request(app)
        .get(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });
});
