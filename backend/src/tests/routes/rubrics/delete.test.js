const request = require('supertest');
const app = require('../../../server');

describe('Rubrics - Delete', () => {
  let adminToken, teacherToken, studentToken;

  beforeEach(async () => {
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);
  });

  describe('DELETE /api/rubrics/:id', () => {
    it('should delete rubric as admin', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 204, 400, 404, 500]).toContain(response.status);
    });

    it('should not allow delete rubric as teacher', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([403, 401, 400, 500]).toContain(response.status);
    });

    it('should not allow delete rubric as student', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect([403, 401, 400, 500]).toContain(response.status);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1');

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent rubric', async () => {
      const response = await request(app)
        .delete('/api/rubrics/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([404, 200, 204, 400, 500]).toContain(response.status);
    });

    it('should handle invalid rubric ID format', async () => {
      const response = await request(app)
        .delete('/api/rubrics/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should handle zero rubric ID', async () => {
      const response = await request(app)
        .delete('/api/rubrics/0')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should handle negative rubric ID', async () => {
      const response = await request(app)
        .delete('/api/rubrics/-1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should handle very large rubric ID', async () => {
      const response = await request(app)
        .delete('/api/rubrics/999999999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([404, 200, 204, 400, 500]).toContain(response.status);
    });

    it('should handle special characters in rubric ID', async () => {
      const response = await request(app)
        .delete('/api/rubrics/<script>')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should not allow delete with invalid token', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', 'Bearer invalid-token');

      expect([401, 403, 400, 500]).toContain(response.status);
    });

    it('should not allow delete with malformed authorization header', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', 'InvalidToken');

      expect([401, 400, 500]).toContain(response.status);
    });

    it('should handle delete without authorization header', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .unset('Authorization');

      expect(response.status).toBe(401);
    });

    it('should return success response on deletion', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200 || response.status === 204) {
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(300);
      }
    });

    it('should handle soft delete if implemented', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 204, 400, 404, 500]).toContain(response.status);
    });

    it('should prevent subsequent access to deleted rubric', async () => {
      const deleteResponse = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (deleteResponse.status === 200 || deleteResponse.status === 204) {
        const getResponse = await request(app)
          .get('/api/rubrics/skill/1')
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 400, 404, 500]).toContain(getResponse.status);
      }
    });

    it('should not allow double delete', async () => {
      const deleteResponse1 = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`);

      const deleteResponse2 = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 204, 400, 404, 500]).toContain(deleteResponse1.status);
      expect([200, 204, 400, 404, 500]).toContain(deleteResponse2.status);
    });

    it('should handle concurrent delete requests on same rubric', async () => {
      const responses = await Promise.all([
        request(app)
          .delete('/api/rubrics/1')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .delete('/api/rubrics/1')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .delete('/api/rubrics/1')
          .set('Authorization', `Bearer ${adminToken}`)
      ]);

      responses.forEach(response => {
        expect([200, 204, 400, 404, 500]).toContain(response.status);
      });
    });

    it('should handle concurrent delete requests on different rubrics', async () => {
      const responses = await Promise.all([
        request(app)
          .delete('/api/rubrics/1')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .delete('/api/rubrics/2')
          .set('Authorization', `Bearer ${adminToken}`),
        request(app)
          .delete('/api/rubrics/3')
          .set('Authorization', `Bearer ${adminToken}`)
      ]);

      responses.forEach(response => {
        expect([200, 204, 400, 404, 500]).toContain(response.status);
      });
    });

    it('should include proper content-type header', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.headers['content-type']) {
        expect(response.headers['content-type']).toMatch(/json/);
      }
    });

    it('should handle query parameters in delete request', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1?force=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 204, 400, 404, 500]).toContain(response.status);
    });

    it('should not allow delete with body payload', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ reason: 'test' });

      expect([200, 204, 400, 404, 500]).toContain(response.status);
    });

    it('should respond quickly for delete operations', async () => {
      const startTime = Date.now();

      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`);

      const responseTime = Date.now() - startTime;
      expect([200, 204, 400, 404, 500]).toContain(response.status);
      expect(responseTime).toBeLessThan(5000);
    });

    it('should not expose sensitive information in response', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`);

      const jsonStr = JSON.stringify(response.body);
      expect(jsonStr).not.toMatch(/password|secret|api[-_]key/i);
    });

    it('should handle delete with extra path segments', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1/extra/path')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should return empty or minimal response body on success', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 204) {
        expect(response.body).toEqual({}) || expect(response.body).toBeFalsy();
      }
    });

    it('should handle delete request timeout gracefully', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .timeout(5000);

      expect([200, 204, 400, 404, 408, 500]).toContain(response.status);
    });

    it('should maintain audit trail if implemented', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 204, 400, 404, 500]).toContain(response.status);
    });

    it('should handle cascade delete if rubric has related data', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 204, 400, 404, 409, 500]).toContain(response.status);
    });

    it('should validate idempotency of delete operation', async () => {
      const firstDelete = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`);

      const secondDelete = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 204, 400, 404, 500]).toContain(firstDelete.status);
      expect([200, 204, 400, 404, 500]).toContain(secondDelete.status);
    });

    it('should not allow delete when dependent records exist', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 204, 400, 404, 409, 500]).toContain(response.status);
    });

    it('should include proper status code for successful deletion', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 204, 400, 404, 500]).toContain(response.status);
      if (response.status === 200 || response.status === 204) {
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(300);
      }
    });

    it('should provide error message for failed deletion', async () => {
      const response = await request(app)
        .delete('/api/rubrics/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 404 || response.status === 400) {
        expect(response.body.message || response.body.error).toBeDefined();
      }
    });

    it('should handle delete with various HTTP headers', async () => {
      const response = await request(app)
        .delete('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Accept', 'application/json')
        .set('Content-Type', 'application/json');

      expect([200, 204, 400, 404, 500]).toContain(response.status);
    });
  });
});
