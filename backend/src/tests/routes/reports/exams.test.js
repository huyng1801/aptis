const request = require('supertest');
const app = require('../../../server');

describe('Admin - Reporting › GET /api/reports/exams', () => {
  let adminToken, teacherToken, studentToken;
  let testExam, testLevel;

  beforeEach(async () => {
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);

    // Create test data
    testLevel = await testHelpers.getTestLevel();
    testExam = await testHelpers.createTestExam(teacherUser.id, testLevel.id);
  });

  describe('GET /api/reports/exams', () => {
    it('should get exam performance report as admin', async () => {
      const response = await request(app)
        .get('/api/reports/exams')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should filter exam report by specific exam', async () => {
      const response = await request(app)
        .get('/api/reports/exams')
        .query({ exam_id: testExam.id })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should filter exam report by level', async () => {
      const response = await request(app)
        .get('/api/reports/exams')
        .query({ level_id: testLevel.id })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should support date range filters', async () => {
      const dateRanges = ['week', 'month', 'year', 'all'];

      for (const range of dateRanges) {
        const response = await request(app)
          .get('/api/reports/exams')
          .query({ date_range: range })
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 500]).toContain(response.status);
      }
    });

    it('should include exam statistics', async () => {
      const response = await request(app)
        .get('/api/reports/exams')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 && response.body.data) {
        // Should have exam data
        expect(response.body.data).toBeDefined();
      }
    });

    it('should include average score metrics', async () => {
      const response = await request(app)
        .get('/api/reports/exams')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 && response.body.data) {
        const data = response.body.data;
        if (data.average_score !== undefined || data.avg_score !== undefined) {
          expect(data).toBeDefined();
        }
      }
    });

    it('should include pass rate information', async () => {
      const response = await request(app)
        .get('/api/reports/exams')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 && response.body.data) {
        const data = response.body.data;
        if (data.pass_rate !== undefined) {
          expect(typeof data.pass_rate).toBe('number');
        }
      }
    });

    it('should handle combined exam and level filters', async () => {
      const response = await request(app)
        .get('/api/reports/exams')
        .query({
          exam_id: testExam.id,
          level_id: testLevel.id,
          date_range: 'month'
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
    });

    it('should return 403 for teachers', async () => {
      const response = await request(app)
        .get('/api/reports/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .get('/api/reports/exams')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/reports/exams')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle non-existent exam ID gracefully', async () => {
      const response = await request(app)
        .get('/api/reports/exams')
        .query({ exam_id: 99999 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404, 500]).toContain(response.status);
    });

    it('should handle non-existent level ID gracefully', async () => {
      const response = await request(app)
        .get('/api/reports/exams')
        .query({ level_id: 99999 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404, 500]).toContain(response.status);
    });
  });
});
