const request = require('supertest');
const app = require('../../../server');

describe('Question Routes - /api/questions (GET ALL)', () => {
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

  describe('GET /api/questions', () => {
    it('should get all questions as teacher', async () => {
      const response = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('questions');
      expect(Array.isArray(response.body.data.questions)).toBe(true);
    });

    it('should get all questions as admin', async () => {
      const response = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('questions');
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/questions')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should filter by skill_id', async () => {
      const response = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ skill_id: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter by level_id', async () => {
      const response = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ level_id: testLevel.level_id })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should filter by question type', async () => {
      const response = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ type: 'multiple_choice' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support search', async () => {
      const response = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ search: 'grammar' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
    });
  });
});