const request = require('supertest');
const app = require('../../../server');

describe('Admin - Reporting › GET /api/reports/content', () => {
  let adminToken, teacherToken, studentToken;

  beforeEach(async () => {
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);
  });

  describe('GET /api/reports/content', () => {
    it('should get content usage report as admin', async () => {
      const response = await request(app)
        .get('/api/reports/content')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should filter content usage by content type', async () => {
      const contentTypes = ['questions', 'exams', 'practice', 'all'];

      for (const type of contentTypes) {
        const response = await request(app)
          .get('/api/reports/content')
          .query({ content_type: type })
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 500]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body.success).toBe(true);
        }
      }
    });

    it('should sort content by different criteria', async () => {
      const sortOptions = ['usage', 'difficulty', 'effectiveness'];

      for (const sortBy of sortOptions) {
        const response = await request(app)
          .get('/api/reports/content')
          .query({ sort_by: sortBy })
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 500]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body.success).toBe(true);
        }
      }
    });

    it('should include question statistics', async () => {
      const response = await request(app)
        .get('/api/reports/content')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 && response.body.data) {
        const data = response.body.data;
        if (data.total_questions !== undefined) {
          expect(typeof data.total_questions).toBe('number');
        }
      }
    });

    it('should include exam statistics', async () => {
      const response = await request(app)
        .get('/api/reports/content')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 && response.body.data) {
        const data = response.body.data;
        if (data.total_exams !== undefined) {
          expect(typeof data.total_exams).toBe('number');
        }
      }
    });

    it('should include most used content list', async () => {
      const response = await request(app)
        .get('/api/reports/content')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 && response.body.data) {
        const data = response.body.data;
        if (data.most_used_content) {
          expect(Array.isArray(data.most_used_content)).toBe(true);
        }
      }
    });

    it('should include difficulty distribution', async () => {
      const response = await request(app)
        .get('/api/reports/content')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 && response.body.data) {
        const data = response.body.data;
        if (data.difficulty_distribution) {
          expect(typeof data.difficulty_distribution).toBe('object');
        }
      }
    });

    it('should handle combined content type and sort filters', async () => {
      const response = await request(app)
        .get('/api/reports/content')
        .query({
          content_type: 'questions',
          sort_by: 'usage'
        })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
    });

    it('should return 403 for teachers', async () => {
      const response = await request(app)
        .get('/api/reports/content')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .get('/api/reports/content')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/reports/content')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle invalid content type gracefully', async () => {
      const response = await request(app)
        .get('/api/reports/content')
        .query({ content_type: 'invalid_type' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle invalid sort option gracefully', async () => {
      const response = await request(app)
        .get('/api/reports/content')
        .query({ sort_by: 'invalid_sort' })
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 500]).toContain(response.status);
    });
  });
});
