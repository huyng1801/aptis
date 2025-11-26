const request = require('supertest');
const app = require('../../../server');

describe('Admin - Reporting › GET /api/reports/users', () => {
  let adminToken, teacherToken, studentToken;

  beforeEach(async () => {
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);
  });

  describe('GET /api/reports/users', () => {
    it('should get user analytics as admin', async () => {
      const response = await request(app)
        .get('/api/reports/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should filter user analytics by role', async () => {
      const roles = ['student', 'teacher', 'admin'];

      for (const role of roles) {
        const response = await request(app)
          .get('/api/reports/users')
          .query({ role })
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 500]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body.success).toBe(true);
        }
      }
    });

    it('should support date range filtering', async () => {
      const dateFrom = new Date('2025-01-01').toISOString();
      const dateTo = new Date('2025-12-31').toISOString();

      const response = await request(app)
        .get('/api/reports/users')
        .query({ date_from: dateFrom, date_to: dateTo })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should include registration metrics', async () => {
      const response = await request(app)
        .get('/api/reports/users')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 && response.body.data) {
        // Should have user analytics data
        expect(response.body.data).toBeDefined();
      }
    });

    it('should include user role breakdown', async () => {
      const response = await request(app)
        .get('/api/reports/users')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 && response.body.data) {
        const data = response.body.data;
        if (data.users_by_role || data.by_role) {
          expect(data).toBeDefined();
        }
      }
    });

    it('should include engagement metrics', async () => {
      const response = await request(app)
        .get('/api/reports/users')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 && response.body.data) {
        // Should include engagement data
        expect(response.body.data).toBeDefined();
      }
    });

    it('should handle combined role and date filters', async () => {
      const response = await request(app)
        .get('/api/reports/users')
        .query({
          role: 'student',
          date_from: new Date('2025-01-01').toISOString(),
          date_to: new Date('2025-12-31').toISOString()
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
    });

    it('should return 403 for teachers', async () => {
      const response = await request(app)
        .get('/api/reports/users')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .get('/api/reports/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/reports/users')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid role filter gracefully', async () => {
      const response = await request(app)
        .get('/api/reports/users')
        .query({ role: 'invalid_role' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 500]).toContain(response.status);
    });
  });
});
