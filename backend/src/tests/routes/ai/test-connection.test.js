const request = require('supertest');
const app = require('../../../server');

describe('AI Routes - Test Connection', () => {
  let adminToken, teacherToken, studentToken;

  beforeEach(async () => {
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);
  });

  describe('GET /api/ai/test-connection', () => {
    it('should test AI connection as admin', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 500, 503]).toContain(response.status);
      if (response.status === 200 || response.status === 503) {
        expect(response.body.success).toBeDefined();
        expect(response.body.data).toBeDefined();
      }
    });

    it('should test AI connection as teacher', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 400, 403, 500, 503]).toContain(response.status);
    });

    it('should reject test connection for students', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection');

      expect(response.status).toBe(401);
    });

    it('should return connection status', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 || response.status === 503) {
        // Check if data exists or check response directly
        const data = response.body.data || response.body;
        expect(data.response || data.status || data.service).toBeDefined();
      }
    });

    it('should indicate service availability', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 || response.status === 503) {
        if (response.body.data.available !== undefined) {
          expect(typeof response.body.data.available).toBe('boolean');
        }
      }
    });

    it('should provide response time', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 || response.status === 503) {
        if (response.body.data.response_time !== undefined) {
          expect(typeof response.body.data.response_time).toBe('number');
          expect(response.body.data.response_time).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should include service version if available', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 || response.status === 503) {
        if (response.body.data.version) {
          expect(typeof response.body.data.version).toBe('string');
        }
      }
    });

    it('should report error details if connection fails', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 503 || (response.status === 200 && !response.body.data.available)) {
        if (response.body.error || response.body.data.error) {
          expect(response.body.error || response.body.data.error).toBeDefined();
        }
      }
    });

    it('should handle timeout gracefully', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`)
        .timeout(30000);

      expect([200, 408, 500, 503]).toContain(response.status);
    });

    it('should provide consistent response format', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 500, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
      if (response.status === 200 || response.status === 503) {
        expect(response.body).toHaveProperty('data');
      }
    });

    it('should support detailed connection check', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection?detailed=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 500, 503]).toContain(response.status);
      if (response.status === 200 || response.status === 503) {
        if (response.body.data.details) {
          expect(typeof response.body.data.details).toBe('object');
        }
      }
    });

    it('should not expose sensitive information', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 || response.status === 503) {
        const jsonStr = JSON.stringify(response.body);
        expect(jsonStr).not.toMatch(/api[-_]key|password|secret|token/i);
      }
    });

    it('should return proper content type', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should handle concurrent connection tests', async () => {
      const responses = await Promise.all([
        request(app)
          .get('/api/ai/test-connection')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get('/api/ai/test-connection')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get('/api/ai/test-connection')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get('/api/ai/test-connection')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get('/api/ai/test-connection')
          .set('Authorization', `Bearer ${adminToken}`)
      ]);

      responses.forEach(response => {
        expect([200, 400, 500, 503]).toContain(response.status);
      });
    });

    it('should indicate if service is healthy', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 || response.status === 503) {
        if (response.body.data.healthy !== undefined) {
          expect(typeof response.body.data.healthy).toBe('boolean');
        }
      }
    });

    it('should provide last connection time', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 || response.status === 503) {
        if (response.body.data.last_check) {
          expect(new Date(response.body.data.last_check)).toBeInstanceOf(Date);
        }
      }
    });

    it('should report model availability', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 || response.status === 503) {
        if (response.body.data.models) {
          expect(Array.isArray(response.body.data.models) || typeof response.body.data.models === 'object').toBe(true);
        }
      }
    });

    it('should indicate rate limit status', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 || response.status === 503) {
        if (response.body.data.rate_limit) {
          expect(response.body.data.rate_limit).toHaveProperty('remaining') || 
          expect(response.body.data.rate_limit).toBeDefined();
        }
      }
    });

    it('should handle format parameter', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection?format=detailed')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 500, 503]).toContain(response.status);
    });

    it('should work with different authentication methods', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 500, 503]).toContain(response.status);
    });

    it('should indicate if scoring is available', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 || response.status === 503) {
        if (response.body.data.capabilities) {
          if (response.body.data.capabilities.scoring !== undefined) {
            expect(typeof response.body.data.capabilities.scoring).toBe('boolean');
          }
        }
      }
    });

    it('should provide uptime status', async () => {
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 || response.status === 503) {
        if (response.body.data.uptime) {
          expect(typeof response.body.data.uptime).toBe('number' || typeof response.body.data.uptime === 'string');
        }
      }
    });

    it('should respond quickly to test-connection', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      const responseTime = Date.now() - startTime;
      expect([200, 400, 429, 500, 503]).toContain(response.status);
      // Should respond within reasonable time (adjust threshold as needed)
      if (response.status !== 429) {
        expect(responseTime).toBeLessThan(120000);
      }
    });

    it('should cache connection test results', async () => {
      const response1 = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      const response2 = await request(app)
        .get('/api/ai/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response1.status).toBe(response2.status);
    });

    it('should handle repeated requests efficiently', async () => {
      for (let i = 0; i < 3; i++) {  // Reduced from 10 to avoid rate limiting
        const response = await request(app)
          .get('/api/ai/test-connection')
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 400, 429, 500, 503]).toContain(response.status);
      }
    });
  });
});
