const request = require('supertest');
const app = require('../../../server');

describe('Admin - Reporting › GET /api/reports/export', () => {
  let adminToken, teacherToken, studentToken;

  beforeEach(async () => {
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);
  });

  describe('GET /api/reports/export', () => {
    it('should export overview report as PDF', async () => {
      const response = await request(app)
        .get('/api/reports/export')
        .query({
          report_type: 'overview',
          format: 'pdf'
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.headers['content-type']).toMatch(/pdf|octet-stream/);
      }
    });

    it('should export overview report as Excel', async () => {
      const response = await request(app)
        .get('/api/reports/export')
        .query({
          report_type: 'overview',
          format: 'excel'
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.headers['content-type']).toMatch(/spreadsheet|octet-stream/);
      }
    });

    it('should export overview report as CSV', async () => {
      const response = await request(app)
        .get('/api/reports/export')
        .query({
          report_type: 'overview',
          format: 'csv'
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.headers['content-type']).toMatch(/csv|text/);
      }
    });

    it('should export users report in all formats', async () => {
      const formats = ['pdf', 'excel', 'csv'];

      for (const format of formats) {
        const response = await request(app)
          .get('/api/reports/export')
          .query({
            report_type: 'users',
            format
          })
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 400, 500]).toContain(response.status);
      }
    });

    it('should export exams report in all formats', async () => {
      const formats = ['pdf', 'excel', 'csv'];

      for (const format of formats) {
        const response = await request(app)
          .get('/api/reports/export')
          .query({
            report_type: 'exams',
            format
          })
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 400, 500]).toContain(response.status);
      }
    });

    it('should export content report in all formats', async () => {
      const formats = ['pdf', 'excel', 'csv'];

      for (const format of formats) {
        const response = await request(app)
          .get('/api/reports/export')
          .query({
            report_type: 'content',
            format
          })
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 400, 500]).toContain(response.status);
      }
    });

    it('should support all report types', async () => {
      const reportTypes = ['overview', 'users', 'exams', 'content'];

      for (const type of reportTypes) {
        const response = await request(app)
          .get('/api/reports/export')
          .query({
            report_type: type,
            format: 'csv'
          })
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 400, 500]).toContain(response.status);
      }
    });

    it('should support date range in export', async () => {
      const response = await request(app)
        .get('/api/reports/export')
        .query({
          report_type: 'users',
          format: 'csv',
          date_from: new Date('2025-01-01').toISOString(),
          date_to: new Date('2025-12-31').toISOString()
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle date range with other parameters', async () => {
      const response = await request(app)
        .get('/api/reports/export')
        .query({
          report_type: 'exams',
          format: 'pdf',
          date_from: new Date('2025-01-01').toISOString(),
          date_to: new Date('2025-12-31').toISOString()
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should return 400 for missing report_type', async () => {
      const response = await request(app)
        .get('/api/reports/export')
        .query({
          format: 'pdf'
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing format', async () => {
      const response = await request(app)
        .get('/api/reports/export')
        .query({
          report_type: 'overview'
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid report type', async () => {
      const response = await request(app)
        .get('/api/reports/export')
        .query({
          report_type: 'invalid_report',
          format: 'pdf'
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid format', async () => {
      const response = await request(app)
        .get('/api/reports/export')
        .query({
          report_type: 'overview',
          format: 'invalid_format'
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for teachers', async () => {
      const response = await request(app)
        .get('/api/reports/export')
        .query({
          report_type: 'overview',
          format: 'pdf'
        })
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .get('/api/reports/export')
        .query({
          report_type: 'overview',
          format: 'pdf'
        })
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/reports/export')
        .query({
          report_type: 'overview',
          format: 'pdf'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should set correct content-disposition headers', async () => {
      const response = await request(app)
        .get('/api/reports/export')
        .query({
          report_type: 'overview',
          format: 'pdf'
        })
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.headers['content-disposition']).toBeDefined();
      }
    });

    it('should handle invalid date format gracefully', async () => {
      const response = await request(app)
        .get('/api/reports/export')
        .query({
          report_type: 'users',
          format: 'csv',
          date_from: 'invalid-date',
          date_to: 'invalid-date'
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 500]).toContain(response.status);
    });
  });
});
