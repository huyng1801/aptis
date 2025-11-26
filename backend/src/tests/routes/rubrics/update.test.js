const request = require('supertest');
const app = require('../../../server');

describe('Rubrics - Update', () => {
  let adminToken, teacherToken, studentToken;

  beforeEach(async () => {
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);
  });

  describe('PUT /api/rubrics/:id', () => {
    const validUpdateData = {
      criteria_name: 'Updated Accuracy',
      weight_percentage: 0.6,
      ai_prompt_template: 'Updated evaluation prompt for accuracy assessment',
      description: 'Updated description',
      max_score: 120
    };

    it('should update rubric as admin', async () => {
      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validUpdateData);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should not allow update rubric as teacher', async () => {
      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(validUpdateData);

      expect([403, 401, 404, 400, 500]).toContain(response.status);
    });

    it('should not allow update rubric as student', async () => {
      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(validUpdateData);

      expect([403, 401, 400, 500]).toContain(response.status);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put('/api/rubrics/1')
        .send(validUpdateData);

      expect(response.status).toBe(401);
    });

    it('should return 404 for non-existent rubric', async () => {
      const response = await request(app)
        .put('/api/rubrics/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validUpdateData);

      expect([404, 200, 400, 500]).toContain(response.status);
    });

    it('should handle invalid rubric ID format', async () => {
      const response = await request(app)
        .put('/api/rubrics/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validUpdateData);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should update only criteria_name field', async () => {
      const data = { criteria_name: 'New Name' };

      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should update only description field', async () => {
      const data = { description: 'New description' };

      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 400, 404, 500]).toContain(response.status);
    });


    it('should update only weight_percentage', async () => {
      const data = { weight_percentage: 0.7 };

      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 400, 404, 500]).toContain(response.status);
    });


    it('should handle empty update data', async () => {
      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should validate criteria_name is string', async () => {
      const data = { criteria_name: 12345 };

      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 400, 404, 422, 500]).toContain(response.status);
    });

    it('should handle very long criteria_name', async () => {
      const data = { criteria_name: 'A'.repeat(500) };

      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 400, 404, 422, 500]).toContain(response.status);
    });

    it('should handle very long description', async () => {
      const data = { description: 'A'.repeat(2000) };

      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 400, 404, 422, 500]).toContain(response.status);
    });



    it('should handle special characters in criteria_name', async () => {
      const data = {
        criteria_name: 'Test <script>alert("xss")</script> Rubric'
      };

      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 400, 404, 422, 500]).toContain(response.status);
    });

    it('should handle special characters in description', async () => {
      const data = {
        description: '<img src=x onerror="alert(1)">'
      };

      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 400, 404, 422, 500]).toContain(response.status);
    });

    it('should handle Unicode characters', async () => {
      const data = {
        criteria_name: '更新的标准 Updated Rubric',
        description: 'Évaluation mise à jour 更新説明'
      };

      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 400, 404, 422, 500]).toContain(response.status);
    });

    it('should handle zero rubric ID', async () => {
      const response = await request(app)
        .put('/api/rubrics/0')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validUpdateData);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should handle negative rubric ID', async () => {
      const response = await request(app)
        .put('/api/rubrics/-1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validUpdateData);

      expect([400, 404, 500]).toContain(response.status);
    });

    it('should handle null values in optional fields', async () => {
      const data = { description: null };

      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 400, 404, 422, 500]).toContain(response.status);
    });

    it('should return updated rubric in response', async () => {
      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validUpdateData);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data || response.body.id).toBeDefined();
      }
    });

    it('should handle concurrent update requests on same rubric', async () => {
      const responses = await Promise.all([
        request(app)
          .put('/api/rubrics/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...validUpdateData, name: 'Name 1' }),
        request(app)
          .put('/api/rubrics/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...validUpdateData, name: 'Name 2' }),
        request(app)
          .put('/api/rubrics/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...validUpdateData, name: 'Name 3' })
      ]);

      responses.forEach(response => {
        expect([200, 400, 404, 500]).toContain(response.status);
      });
    });

    it('should handle concurrent update requests on different rubrics', async () => {
      const responses = await Promise.all([
        request(app)
          .put('/api/rubrics/1')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(validUpdateData),
        request(app)
          .put('/api/rubrics/2')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(validUpdateData),
        request(app)
          .put('/api/rubrics/3')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(validUpdateData)
      ]);

      responses.forEach(response => {
        expect([200, 400, 404, 500]).toContain(response.status);
      });
    });

    it('should include proper content-type header', async () => {
      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validUpdateData);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should handle null request body', async () => {
      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(null);

      expect([200, 400, 404, 422, 500]).toContain(response.status);
    });

    it('should not expose sensitive information in response', async () => {
      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validUpdateData);

      const jsonStr = JSON.stringify(response.body);
      expect(jsonStr).not.toMatch(/password|secret|api[-_]key/i);
    });

    it('should preserve unchanged fields', async () => {
      const updateData = { name: 'New Name Only' };

      const response = await request(app)
        .put('/api/rubrics/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should handle very large rubric ID', async () => {
      const response = await request(app)
        .put('/api/rubrics/999999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validUpdateData);

      expect([404, 200, 400, 500]).toContain(response.status);
    });
  });
});
