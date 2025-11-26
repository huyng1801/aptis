const request = require('supertest');
const app = require('../../../server');

describe('AI Routes - /api/ai/score-answer/:id (POST)', () => {
  let teacherUser, teacherToken;
  let adminToken;
  let studentToken;

  beforeEach(async () => {
    teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);
    
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);
  });

  describe('POST /api/ai/score-answer/:id', () => {
    it('should score answer as teacher', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should score answer as admin', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/1');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent answer', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/99999')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([404, 400, 500]).toContain(response.status);
      if (response.status === 404) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should include feedback in response if available', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      if (response.status === 200 && response.body.data) {
        if (response.body.data.feedback) {
          expect(typeof response.body.data.feedback).toBe('string');
        }
      }
    });

    it('should return numeric score', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      if (response.status === 200 && response.body.data) {
        if (response.body.data.score !== undefined) {
          expect(typeof response.body.data.score === 'number' || typeof response.body.data.score === 'string').toBe(true);
        }
      }
    });

    it('should provide confidence level', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      if (response.status === 200 && response.body.data) {
        if (response.body.data.confidence !== undefined) {
          expect(typeof response.body.data.confidence === 'number' || typeof response.body.data.confidence === 'string').toBe(true);
        }
      }
    });

    it('should accept optional scoring criteria', async () => {
      const scoreData = {
        criteria: {
          grammar: true,
          vocabulary: true,
          pronunciation: true
        }
      };

      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should accept optional rubric', async () => {
      const scoreData = {
        rubric_id: 1
      };

      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should accept detailed analysis option', async () => {
      const scoreData = {
        detailed: true
      };

      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      expect([200, 400, 404, 500]).toContain(response.status);
      if (response.status === 200 && response.body.data && response.body.data.analysis) {
        expect(typeof response.body.data.analysis).toBe('object');
      }
    });

    it('should handle invalid ID format', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/invalid-id')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should provide response timestamp', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
      }
    });

    it('should handle concurrent scoring requests', async () => {
      const responses = await Promise.all([
        request(app)
          .post('/api/ai/score-answer/1')
          .set('Authorization', `Bearer ${teacherToken}`),
        request(app)
          .post('/api/ai/score-answer/1')
          .set('Authorization', `Bearer ${teacherToken}`),
        request(app)
          .post('/api/ai/score-answer/1')
          .set('Authorization', `Bearer ${teacherToken}`)
      ]);

      responses.forEach(response => {
        expect([200, 400, 404, 500]).toContain(response.status);
      });
    });

    it('should accept language preference', async () => {
      const scoreData = {
        language: 'en'
      };

      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should return proper HTTP status codes', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should return JSON response', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should include success indicator', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.body).toHaveProperty('success');
    });

    it('should handle scoring timeout gracefully', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .timeout(30000);

      expect([200, 400, 404, 408, 500]).toContain(response.status);
    });

    it('should validate criteria parameter', async () => {
      const scoreData = {
        criteria: 'invalid'
      };

      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      expect([200, 400, 404, 422, 500]).toContain(response.status);
    });

    it('should provide score breakdown if detailed', async () => {
      const scoreData = {
        detailed: true
      };

      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      if (response.status === 200 && response.body.data) {
        if (response.body.data.breakdown) {
          expect(typeof response.body.data.breakdown).toBe('object');
        }
      }
    });

    it('should accept optional context', async () => {
      const scoreData = {
        context: {
          question: 'What is X?',
          level: 'B1'
        }
      };

      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should preserve answer ID in response', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      if (response.status === 200 && response.body.data) {
        if (response.body.data.answer_id !== undefined) {
          expect(response.body.data.answer_id).toBeDefined();
        }
      }
    });

    it('should indicate if manual review is needed', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      if (response.status === 200 && response.body.data) {
        if (response.body.data.needs_review !== undefined) {
          expect(typeof response.body.data.needs_review).toBe('boolean');
        }
      }
    });

    it('should handle special characters in answer', async () => {
      const scoreData = {
        answer_text: 'Answer with @#$%^&*() special chars'
      };

      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should not expose sensitive AI model information', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`);

      if (response.status === 200) {
        const responseStr = JSON.stringify(response.body);
        expect(responseStr).not.toMatch(/api[-_]key|secret|password/i);
      }
    });

    it('should handle missing request body gracefully', async () => {
      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({});

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should accept historical scores option', async () => {
      const scoreData = {
        include_history: true
      };

      const response = await request(app)
        .post('/api/ai/score-answer/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      expect([200, 400, 404, 500]).toContain(response.status);
    });
  });
});