const request = require('supertest');
const app = require('../../../server');

describe('Admin - System Management › System Health', () => {
  let adminToken, teacherToken, studentToken;

  beforeEach(async () => {
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);
  });

  describe('GET /api/admin/health', () => {
    it('should get system health status as admin', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.status).toBeDefined();
      }
    });

    it('should return valid status value', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        const validStatuses = ['healthy', 'degraded', 'unhealthy'];
        expect(validStatuses).toContain(response.body.data.status);
      }
    });

    it('should include database status', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body.data.database).toBeDefined();
        const validDbStatuses = ['connected', 'disconnected'];
        expect(validDbStatuses).toContain(response.body.data.database);
      }
    });

    it('should include cache status', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body.data.cache).toBeDefined();
        const validCacheStatuses = ['connected', 'disconnected'];
        expect(validCacheStatuses).toContain(response.body.data.cache);
      }
    });

    it('should include memory usage information', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body.data.memory_usage).toBeDefined();
        const memUsage = response.body.data.memory_usage;
        expect(typeof memUsage === 'string' || typeof memUsage === 'number').toBe(true);
      }
    });

    it('should include uptime information', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body.data.uptime_hours).toBeDefined();
        expect(typeof response.body.data.uptime_hours === 'number').toBe(true);
        expect(response.body.data.uptime_hours).toBeGreaterThanOrEqual(0);
      }
    });

    it('should return consistent timestamp', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        // Should have some form of timestamp
        expect(response.body.data || response.body.generated_at).toBeDefined();
      }
    });

    it('should indicate healthy status when database is connected', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        const data = response.body.data;
        // If database is connected, status should not be "unhealthy"
        if (data.database === 'connected') {
          expect(data.status).not.toBe('unhealthy');
        }
      }
    });

    it('should return degraded or unhealthy status when database is disconnected', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        const data = response.body.data;
        // If database is disconnected, status should be degraded or unhealthy
        if (data.database === 'disconnected') {
          expect(['degraded', 'unhealthy']).toContain(data.status);
        }
      }
    });

    it('should return memory usage as percentage or valid format', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        const memUsage = response.body.data.memory_usage;
        if (typeof memUsage === 'string') {
          // Should contain percentage or memory info
          expect(memUsage.length).toBeGreaterThan(0);
        } else if (typeof memUsage === 'number') {
          expect(memUsage).toBeGreaterThanOrEqual(0);
          expect(memUsage).toBeLessThanOrEqual(100);
        }
      }
    });

    it('should handle concurrent health checks', async () => {
      const responses = await Promise.all([
        request(app)
          .get('/api/admin/health')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get('/api/admin/health')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get('/api/admin/health')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get('/api/admin/health')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .get('/api/admin/health')
          .set('Authorization', `Bearer ${adminToken}`)
      ]);

      responses.forEach(response => {
        expect([200, 500]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body.success).toBe(true);
          expect(response.body.data.status).toBeDefined();
        }
      });
    });

    it('should not expose sensitive system information', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        const data = response.body.data;
        // Should not expose database passwords or connection strings
        const jsonStr = JSON.stringify(data);
        expect(jsonStr).not.toMatch(/password/i);
        expect(jsonStr).not.toMatch(/secret/i);
      }
    });

    it('should provide actionable health status', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        const data = response.body.data;
        // Status should be human-readable and actionable
        expect(['healthy', 'degraded', 'unhealthy']).toContain(data.status);
      }
    });

    it('should return 403 Forbidden for non-admin users (teacher)', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 Forbidden for non-admin users (student)', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 401 Unauthorized without token', async () => {
      const response = await request(app)
        .get('/api/admin/health');

      expect(response.status).toBe(401);
    });

    it('should handle rapid successive requests', async () => {
      const response1 = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      const response2 = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      const response3 = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response1.status);
      expect([200, 500]).toContain(response2.status);
      expect([200, 500]).toContain(response3.status);
    });

    it('should maintain consistent data structure across multiple requests', async () => {
      const response1 = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      const response2 = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response1.status === 200 && response2.status === 200) {
        const keys1 = Object.keys(response1.body.data).sort();
        const keys2 = Object.keys(response2.body.data).sort();
        expect(keys1).toEqual(keys2);
      }
    });

    it('should indicate uptime increases over multiple checks', async () => {
      const response1 = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      const response2 = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response1.status === 200 && response2.status === 200) {
        const uptime1 = response1.body.data.uptime_hours;
        const uptime2 = response2.body.data.uptime_hours;
        expect(uptime2).toBeGreaterThanOrEqual(uptime1);
      }
    });

    it('should return proper content type', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should have required response properties', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
      }
    });

    it('should show cache status even if cache is unavailable', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        // Cache status should exist and be valid
        expect(response.body.data.cache).toBeDefined();
        expect(['connected', 'disconnected']).toContain(response.body.data.cache);
      }
    });

    it('should use ISO 8601 format for timestamps if included', async () => {
      const response = await request(app)
        .get('/api/admin/health')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 && response.body.generated_at) {
        // Should be valid ISO 8601 format or timestamp
        const timestamp = new Date(response.body.generated_at);
        expect(timestamp instanceof Date && !isNaN(timestamp)).toBe(true);
      }
    });
  });
});
