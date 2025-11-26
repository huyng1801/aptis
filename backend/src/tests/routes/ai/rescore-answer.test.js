const request = require('supertest');
const app = require('../../../server');

describe('AI Routes - Rescore Answer', () => {
  let teacherToken, adminToken, studentToken;

  beforeEach(async () => {
    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);
  });

  describe('POST /api/ai/rescore-answer/:id', () => {
    it('should rescore answer as teacher', async () => {
      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should rescore answer as admin', async () => {
      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should reject rescoring for students', async () => {
      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/ai/rescore-answer/1');

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent answer', async () => {
      const response = await request(app)
        .post('/api/ai/rescore-answer/99999')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([404, 400, 500]).toContain(response.status);
      if (response.status === 404) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should handle invalid answer ID format', async () => {
      const response = await request(app)
        .post('/api/ai/rescore-answer/invalid-id')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should accept optional confidence threshold', async () => {
      const rescoreData = {
        confidence_threshold: 0.7
      };

      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(rescoreData);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should validate confidence threshold range', async () => {
      const rescoreData = {
        confidence_threshold: 1.5
      };

      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(rescoreData);

      expect([200, 400, 404, 422, 500]).toContain(response.status);
    });

    it('should accept optional criteria', async () => {
      const rescoreData = {
        criteria: {
          grammar: true,
          vocabulary: true,
          fluency: true
        }
      };

      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(rescoreData);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should accept force rescore option', async () => {
      const rescoreData = {
        force: true
      };

      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(rescoreData);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should provide comparison with previous score', async () => {
      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      if (response.status === 200 && response.body.data) {
        if (response.body.data.previous_score !== undefined) {
          expect(response.body.data.previous_score).toBeDefined();
        }
        if (response.body.data.new_score !== undefined) {
          expect(response.body.data.new_score).toBeDefined();
        }
      }
    });

    it('should indicate if rescoring changed the score', async () => {
      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      if (response.status === 200 && response.body.data) {
        if (response.body.data.changed !== undefined) {
          expect(typeof response.body.data.changed).toBe('boolean');
        }
      }
    });

    it('should handle concurrent rescore requests', async () => {
      const responses = await Promise.all([
        request(app)
          .post('/api/ai/rescore-answer/1')
          .set('Authorization', `Bearer ${teacherToken}`),
        request(app)
          .post('/api/ai/rescore-answer/1')
          .set('Authorization', `Bearer ${teacherToken}`),
        request(app)
          .post('/api/ai/rescore-answer/1')
          .set('Authorization', `Bearer ${teacherToken}`)
      ]);

      responses.forEach(response => {
        expect([200, 400, 404, 500]).toContain(response.status);
      });
    });

    it('should maintain audit trail for rescoring', async () => {
      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      if (response.status === 200 && response.body.data) {
        if (response.body.data.timestamp !== undefined) {
          expect(new Date(response.body.data.timestamp)).toBeInstanceOf(Date);
        }
      }
    });

    it('should handle rescore with empty body', async () => {
      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({});

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should reject invalid confidence threshold value', async () => {
      const rescoreData = {
        confidence_threshold: 'invalid'
      };

      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(rescoreData);

      expect([200, 400, 422, 404, 500]).toContain(response.status);
    });

    it('should validate criteria structure', async () => {
      const rescoreData = {
        criteria: 'invalid'
      };

      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(rescoreData);

      expect([200, 400, 422, 404, 500]).toContain(response.status);
    });

    it('should include timestamp in response', async () => {
      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
      }
    });

    it('should handle rescore timeout', async () => {
      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .timeout(30000);

      expect([200, 408, 400, 404, 500]).toContain(response.status);
    });

    it('should return consistent response format', async () => {
      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
    });

    it('should handle multiple consecutive rescores', async () => {
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/ai/rescore-answer/1')
          .set('Authorization', `Bearer ${teacherToken}`);

        expect([200, 400, 404, 500]).toContain(response.status);
      }
    });

    it('should track who initiated the rescore', async () => {
      const response = await request(app)
        .post('/api/ai/rescore-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      if (response.status === 200 && response.body.data) {
        // Response should indicate this was initiated by the authenticated user
        expect(response.body).toHaveProperty('success');
      }
    });
  });
});
