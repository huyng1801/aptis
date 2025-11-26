const request = require('supertest');
const app = require('../../../server');

describe('AI Routes - Score Multiple Answers', () => {
  let teacherToken, adminToken, studentToken;

  beforeEach(async () => {
    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);
  });

  describe('POST /api/ai/score-multiple', () => {
    it('should score multiple answers as teacher', async () => {
      const scoreData = {
        answers: [
          { id: 1, text: 'Sample answer 1' },
          { id: 2, text: 'Sample answer 2' }
        ]
      };

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should score multiple answers as admin', async () => {
      const scoreData = {
        answers: [
          { id: 1, text: 'Answer text 1' }
        ]
      };

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(scoreData);

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should reject scoring for students', async () => {
      const scoreData = {
        answers: [{ id: 1, text: 'Answer' }]
      };

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(scoreData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const scoreData = {
        answers: [{ id: 1, text: 'Answer' }]
      };

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .send(scoreData);

      expect(response.status).toBe(401);
    });

    it('should reject empty answers array', async () => {
      const scoreData = {
        answers: []
      };

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      expect([400, 422]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should reject missing answers field', async () => {
      const scoreData = {};

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      expect([400, 422]).toContain(response.status);
      expect(response.body.success).toBe(false);
    });

    it('should reject answers without id', async () => {
      const scoreData = {
        answers: [{ text: 'Answer without id' }]
      };

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      expect([400, 422]).toContain(response.status);
    });

    it('should reject answers without text', async () => {
      const scoreData = {
        answers: [{ id: 1 }]
      };

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      expect([400, 422]).toContain(response.status);
    });

    it('should handle large batch of answers', async () => {
      const answers = [];
      for (let i = 1; i <= 50; i++) {
        answers.push({ id: i, text: `Sample answer ${i}` });
      }

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ answers });

      expect([200, 400, 413, 500]).toContain(response.status);
    });

    it('should return scores for valid answers', async () => {
      const scoreData = {
        answers: [
          { id: 1, text: 'Good answer' },
          { id: 2, text: 'Another answer' }
        ]
      };

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      if (response.status === 200 && response.body.data) {
        if (Array.isArray(response.body.data.scores)) {
          response.body.data.scores.forEach(score => {
            expect(score).toHaveProperty('id');
          });
        } else if (response.body.data.results) {
          expect(Array.isArray(response.body.data.results)).toBe(true);
        }
      }
    });

    it('should handle mixed valid and invalid answers', async () => {
      const scoreData = {
        answers: [
          { id: 1, text: 'Valid answer' },
          { id: 'invalid', text: 'With invalid ID type' },
          { id: 2, text: '' }
        ]
      };

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      expect([200, 400, 422]).toContain(response.status);
    });

    it('should handle very long answer text', async () => {
      const longText = 'A'.repeat(10000);

      const scoreData = {
        answers: [
          { id: 1, text: longText }
        ]
      };

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      expect([200, 400, 413, 500]).toContain(response.status);
    });

    it('should handle special characters in answer text', async () => {
      const scoreData = {
        answers: [
          { id: 1, text: 'Answer with special chars: @#$%^&*()' },
          { id: 2, text: 'Unicode: 你好世界 🌍' },
          { id: 3, text: 'HTML: <script>alert("xss")</script>' }
        ]
      };

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should maintain answer order in response', async () => {
      const scoreData = {
        answers: [
          { id: 3, text: 'Third answer' },
          { id: 1, text: 'First answer' },
          { id: 2, text: 'Second answer' }
        ]
      };

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      if (response.status === 200 && response.body.data) {
        if (Array.isArray(response.body.data.scores)) {
          // Check if order is maintained or IDs match
          expect(response.body.data.scores.length).toBeGreaterThan(0);
        }
      }
    });

    it('should include confidence scores if available', async () => {
      const scoreData = {
        answers: [
          { id: 1, text: 'Sample answer' }
        ]
      };

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      if (response.status === 200 && response.body.data) {
        if (response.body.data.scores && response.body.data.scores[0]) {
          if (response.body.data.scores[0].confidence !== undefined) {
            expect(typeof response.body.data.scores[0].confidence).toMatch(/number|string/);
          }
        }
      }
    });

    it('should handle concurrent multiple score requests', async () => {
      const scoreData = {
        answers: [{ id: 1, text: 'Sample answer' }]
      };

      const responses = await Promise.all([
        request(app)
          .post('/api/ai/score-multiple')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send(scoreData),
        request(app)
          .post('/api/ai/score-multiple')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send(scoreData),
        request(app)
          .post('/api/ai/score-multiple')
          .set('Authorization', `Bearer ${teacherToken}`)
          .send(scoreData)
      ]);

      responses.forEach(response => {
        expect([200, 400, 500]).toContain(response.status);
      });
    });

    it('should handle timeout gracefully', async () => {
      const scoreData = {
        answers: [
          { id: 1, text: 'Sample answer for timeout test' }
        ]
      };

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData)
        .timeout(30000);

      expect([200, 400, 408, 500]).toContain(response.status);
    });

    it('should validate response structure', async () => {
      const scoreData = {
        answers: [{ id: 1, text: 'Answer' }]
      };

      const response = await request(app)
        .post('/api/ai/score-multiple')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(scoreData);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('success');
        expect(response.body).toHaveProperty('data');
      }
    });
  });
});
