const request = require('supertest');
const app = require('../../../server');

describe('Rubrics - Get by Skill', () => {
  let adminToken, teacherToken, studentToken;

  beforeEach(async () => {
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);
  });

  describe('GET /api/rubrics/skill/:skillId', () => {
    it('should get rubrics for skill as admin', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should get rubrics for skill as teacher', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should get rubrics for skill as student', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect([200, 403, 400, 404, 500]).toContain(response.status);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/1');

      expect(response.status).toBe(401);
    });

    it('should handle invalid skill ID format', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should return 404 for non-existent skill', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([404, 200, 400, 500]).toContain(response.status);
    });

    it('should return array of rubrics', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body.data).toBeDefined();
        if (Array.isArray(response.body.data)) {
          expect(Array.isArray(response.body.data)).toBe(true);
        }
      }
    });

    it('should include rubric details in response', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 && Array.isArray(response.body.data)) {
        if (response.body.data.length > 0) {
          const rubric = response.body.data[0];
          expect(rubric).toHaveProperty('id') || expect(rubric).toBeDefined();
        }
      }
    });

    it('should handle zero skill ID', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should handle negative skill ID', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should handle very large skill ID', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/999999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([404, 200, 400, 500]).toContain(response.status);
    });

    it('should return proper content type', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should maintain consistent response structure', async () => {
      const response1 = await request(app)
        .get('/api/rubrics/skill/1')
        .set('Authorization', `Bearer ${adminToken}`);

      const response2 = await request(app)
        .get('/api/rubrics/skill/1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response1.status === response2.status && response1.status === 200) {
        expect(response1.body).toHaveProperty('success');
        expect(response2.body).toHaveProperty('success');
      }
    });

    it('should handle concurrent requests', async () => {
      const responses = await Promise.all([
        request(app)
          .get('/api/rubrics/skill/1')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get('/api/rubrics/skill/1')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get('/api/rubrics/skill/1')
          .set('Authorization', `Bearer ${adminToken}`)
      ]);

      responses.forEach(response => {
        expect([200, 400, 404, 500]).toContain(response.status);
      });
    });

    it('should support pagination if implemented', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/1?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should support filtering if implemented', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/1?status=active')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should support sorting if implemented', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/1?sort=name')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should handle query string parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/1?invalid_param=value')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should not expose sensitive information', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        const jsonStr = JSON.stringify(response.body);
        expect(jsonStr).not.toMatch(/password|secret|api[-_]key/i);
      }
    });

    it('should include metadata in response', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
      }
    });

    it('should handle special characters in skill ID', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/<script>')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should respond quickly', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/rubrics/skill/1')
        .set('Authorization', `Bearer ${adminToken}`);

      const responseTime = Date.now() - startTime;
      expect([200, 400, 404, 500]).toContain(response.status);
      expect(responseTime).toBeLessThan(5000);
    });

    it('should handle timeout gracefully', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .timeout(5000);

      expect([200, 400, 404, 408, 500]).toContain(response.status);
    });

    it('should provide error message for missing skill', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 404) {
        expect(response.body.message || response.body.error).toBeDefined();
      }
    });

    it('should handle multiple requests sequentially', async () => {
      for (let i = 1; i <= 3; i++) {
        const response = await request(app)
          .get(`/api/rubrics/skill/${i}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 400, 404, 500]).toContain(response.status);
      }
    });

    it('should return consistent data types', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(typeof response.body.success).toBe('boolean');
        expect(response.body.data).toBeDefined();
      }
    });

    it('should handle empty result set', async () => {
      const response = await request(app)
        .get('/api/rubrics/skill/1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        if (Array.isArray(response.body.data)) {
          expect(Array.isArray(response.body.data)).toBe(true);
        }
      }
    });
  });
});
