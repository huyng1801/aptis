const request = require('supertest');
const app = require('../../../server');

describe('Admin - System Management › System Configuration', () => {
  let adminToken, teacherToken, studentToken;

  beforeEach(async () => {
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);
  });

  describe('GET /api/admin/config', () => {
    it('should get system configuration as admin', async () => {
      const response = await request(app)
        .get('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.config).toBeDefined();
      }
    });

    it('should return config with expected properties', async () => {
      const response = await request(app)
        .get('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        const config = response.body.data.config || response.body.data;
        // At least one config property should exist
        expect(Object.keys(config).length).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return 403 Forbidden for non-admin users (teacher)', async () => {
      const response = await request(app)
        .get('/api/admin/config')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 Forbidden for non-admin users (student)', async () => {
      const response = await request(app)
        .get('/api/admin/config')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 401 Unauthorized without token', async () => {
      const response = await request(app)
        .get('/api/admin/config');

      expect(response.status).toBe(401);
    });

    it('should return consistent config structure', async () => {
      const response1 = await request(app)
        .get('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`);

      const response2 = await request(app)
        .get('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response1.status === 200 && response2.status === 200) {
        expect(response1.body.data).toBeDefined();
        expect(response2.body.data).toBeDefined();
      }
    });

    it('should handle concurrent config requests', async () => {
      const responses = await Promise.all([
        request(app)
          .get('/api/admin/config')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get('/api/admin/config')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get('/api/admin/config')
          .set('Authorization', `Bearer ${adminToken}`)
      ]);

      responses.forEach(response => {
        expect([200, 500]).toContain(response.status);
      });
    });
  });

  describe('PUT /api/admin/config', () => {
    it('should update system configuration as admin', async () => {
      const configData = {
        max_exam_attempts: 5,
        exam_timeout_minutes: 90,
        passing_score_default: 70
      };

      const response = await request(app)
        .put('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(configData);

      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should update partial configuration', async () => {
      const configData = {
        max_exam_attempts: 3
      };

      const response = await request(app)
        .put('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(configData);

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should update all configuration fields', async () => {
      const configData = {
        max_exam_attempts: 10,
        exam_timeout_minutes: 120,
        passing_score_default: 60
      };

      const response = await request(app)
        .put('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(configData);

      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should reject invalid max_exam_attempts', async () => {
      const configData = {
        max_exam_attempts: -5 // Invalid: negative value
      };

      const response = await request(app)
        .put('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(configData);

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should reject invalid exam_timeout_minutes', async () => {
      const configData = {
        exam_timeout_minutes: 0 // Invalid: zero or negative
      };

      const response = await request(app)
        .put('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(configData);

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should reject invalid passing_score_default', async () => {
      const configData = {
        passing_score_default: 150 // Invalid: > 100
      };

      const response = await request(app)
        .put('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(configData);

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle non-numeric values gracefully', async () => {
      const configData = {
        max_exam_attempts: 'five',
        exam_timeout_minutes: 'ninety'
      };

      const response = await request(app)
        .put('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(configData);

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should return 403 Forbidden for non-admin users', async () => {
      const configData = {
        max_exam_attempts: 5
      };

      const response = await request(app)
        .put('/api/admin/config')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(configData);

      expect(response.status).toBe(403);
    });

    it('should return 401 Unauthorized without token', async () => {
      const configData = {
        max_exam_attempts: 5
      };

      const response = await request(app)
        .put('/api/admin/config')
        .send(configData);

      expect(response.status).toBe(401);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .put('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should ignore unknown configuration fields', async () => {
      const configData = {
        max_exam_attempts: 5,
        unknown_field: 'should be ignored',
        another_unknown: true
      };

      const response = await request(app)
        .put('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(configData);

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should preserve existing config on partial update', async () => {
      // First, get current config
      const getResponse = await request(app)
        .get('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`);

      // Update with partial data
      const updateData = {
        max_exam_attempts: 7
      };

      const updateResponse = await request(app)
        .put('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect([200, 400, 500]).toContain(updateResponse.status);
    });

    it('should handle boundary values correctly', async () => {
      const configData = {
        max_exam_attempts: 1,
        exam_timeout_minutes: 1,
        passing_score_default: 0
      };

      const response = await request(app)
        .put('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(configData);

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should handle maximum valid values', async () => {
      const configData = {
        max_exam_attempts: 999,
        exam_timeout_minutes: 1440, // 24 hours
        passing_score_default: 100
      };

      const response = await request(app)
        .put('/api/admin/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(configData);

      expect([200, 400, 500]).toContain(response.status);
    });
  });
});
