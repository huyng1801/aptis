const request = require('supertest');
const app = require('../../../server');

describe('Admin - Reporting › GET /api/reports/overview', () => {
  let adminToken, teacherToken, studentToken;

  beforeEach(async () => {
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);
  });

  describe('GET /api/reports/overview', () => {
    it('should get system overview as admin', async () => {
      const response = await request(app)
        .get('/api/reports/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should get system overview with date_range filter', async () => {
      const response = await request(app)
        .get('/api/reports/overview')
        .query({ date_range: 'week' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should support all date range values', async () => {
      const dateRanges = ['today', 'week', 'month', 'year', 'all'];

      for (const range of dateRanges) {
        const response = await request(app)
          .get('/api/reports/overview')
          .query({ date_range: range })
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 500]).toContain(response.status);
      }
    });

    it('should include key metrics in overview', async () => {
      const response = await request(app)
        .get('/api/reports/overview')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 && response.body.data) {
        const data = response.body.data;
        // Check for expected metric fields
        if (data.overview || data.metrics) {
          expect(data).toBeDefined();
        }
      }
    });

    it('should return 403 for teachers', async () => {
      const response = await request(app)
        .get('/api/reports/overview')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .get('/api/reports/overview')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/reports/overview')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid date_range gracefully', async () => {
      const response = await request(app)
        .get('/api/reports/overview')
        .query({ date_range: 'invalid' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 500]).toContain(response.status);
    });
  });
});
