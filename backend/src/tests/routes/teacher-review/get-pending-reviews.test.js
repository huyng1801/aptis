const request = require('supertest');
const app = require('../../../server');

describe('Teacher Review Routes - /api/teacher-review/pending (GET)', () => {
  let teacherUser, teacherToken;
  let adminToken;
  let studentToken;

  beforeEach(async () => {
    teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);
    
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);
  });

  describe('GET /api/teacher-review/pending', () => {
    it('should get pending reviews as teacher', async () => {
      const response = await request(app)
        .get('/api/teacher-review/pending')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('pending');
      expect(Array.isArray(response.body.data.pending)).toBe(true);
    });

    it('should get pending reviews as admin', async () => {
      const response = await request(app)
        .get('/api/teacher-review/pending')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .get('/api/teacher-review/pending')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/teacher-review/pending')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should include pending item details', async () => {
      const response = await request(app)
        .get('/api/teacher-review/pending')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      if (response.body.data.pending && response.body.data.pending.length > 0) {
        const item = response.body.data.pending[0];
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('type');
      }
    });
  });
});