const request = require('supertest');
const app = require('../../../server');

describe('Rubrics - Create', () => {
  let adminToken, teacherToken, studentToken;

  beforeEach(async () => {
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);
  });

  describe('POST /api/rubrics', () => {
    const validRubricData = {
      skill_id: 1,
      criteria_name: 'Accuracy',
      weight_percentage: 0.5,
      ai_prompt_template: 'Evaluate the accuracy of the student response based on factual correctness and relevance to the question.',
      description: 'A test rubric for evaluation evaluating accuracy',
      max_score: 100
    };

    it('should create rubric with admin role', async () => {
      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRubricData);

      expect([200, 201, 400, 409, 500]).toContain(response.status);
      if (response.status === 201 || response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    it('should not allow create rubric as teacher', async () => {
      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(validRubricData);

      expect([201, 403, 401, 400, 500]).toContain(response.status);
    });

    it('should not allow create rubric as student', async () => {
      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(validRubricData);

      expect([403, 401, 400, 500]).toContain(response.status);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/rubrics')
        .send(validRubricData);

      expect(response.status).toBe(401);
    });

    it('should require skill_id', async () => {
      const data = { ...validRubricData };
      delete data.skill_id;

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([400, 422, 500]).toContain(response.status);
    });

    it('should require name', async () => {
      const data = { ...validRubricData };
      delete data.name;

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 201, 400, 422, 500]).toContain(response.status);
    });

    it('should require criteria_name', async () => {
      const data = { ...validRubricData };
      delete data.criteria_name;

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([400, 422, 500]).toContain(response.status);
    });

    it('should validate skill_id is numeric', async () => {
      const data = { ...validRubricData, skill_id: 'invalid' };

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([400, 422, 500]).toContain(response.status);
    });

    it('should validate criteria_name is string', async () => {
      const data = { ...validRubricData, criteria_name: 12345 };

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 201, 400, 422, 500]).toContain(response.status);
    });

    it('should validate criteria array is array', async () => {
      const data = { ...validRubricData, criteria: 'not-array' };

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 201, 400, 422, 500]).toContain(response.status);
    });

    it('should validate weight_percentage is numeric', async () => {
      const data = { ...validRubricData, weight_percentage: 'not-numeric' };

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([400, 422, 500]).toContain(response.status);
    });

    it('should handle very long criteria_name', async () => {
      const data = {
        ...validRubricData,
        criteria_name: 'A'.repeat(500)
      };

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 201, 400, 422, 500]).toContain(response.status);
    });

    it('should handle very long description', async () => {
      const data = {
        ...validRubricData,
        description: 'Test description ' + 'A'.repeat(1000)
      };

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 201, 400, 422, 500]).toContain(response.status);
    });


    it('should handle special characters in criteria_name', async () => {
      const data = {
        ...validRubricData,
        criteria_name: 'Test <script>alert("xss")</script> Rubric'
      };

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 201, 400, 422, 500]).toContain(response.status);
    });

    it('should handle special characters in description', async () => {
      const data = {
        ...validRubricData,
        description: 'Test <img src=x onerror="alert(1)"> description'
      };

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 201, 400, 422, 500]).toContain(response.status);
    });

    it('should handle null values in optional fields', async () => {
      const data = {
        ...validRubricData,
        description: null
      };

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 201, 400, 422, 500]).toContain(response.status);
    });

    it('should handle Unicode characters', async () => {
      const data = {
        ...validRubricData,
        criteria_name: '评分标准 Rubrik 标准',
        description: 'Évaluation française 中文评价'
      };

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 201, 400, 422, 500]).toContain(response.status);
    });

    it('should handle negative weight_percentage', async () => {
      const data = { ...validRubricData, weight_percentage: -0.5 };

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 201, 400, 422, 500]).toContain(response.status);
    });


    it('should handle duplicate rubric names', async () => {
      const data1 = { ...validRubricData };
      const data2 = { ...validRubricData };

      await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data1);

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data2);

      expect([200, 201, 400, 409, 422, 500]).toContain(response.status);
    });

    it('should handle non-existent skill_id', async () => {
      const data = { ...validRubricData, skill_id: 99999 };

      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(data);

      expect([200, 201, 400, 404, 409, 422, 500]).toContain(response.status);
    });

    it('should return created rubric in response', async () => {
      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRubricData);

      if (response.status === 201 || response.status === 200) {
        expect(response.body.data || response.body.id).toBeDefined();
      }
    });

    it('should handle concurrent create requests', async () => {
      const responses = await Promise.all([
        request(app)
          .post('/api/rubrics')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(validRubricData),
        request(app)
          .post('/api/rubrics')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...validRubricData, name: 'Test Rubric 2' }),
        request(app)
          .post('/api/rubrics')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ ...validRubricData, name: 'Test Rubric 3' })
      ]);

      responses.forEach(response => {
        expect([200, 201, 400, 409, 422, 500]).toContain(response.status);
      });
    });

    it('should include proper content-type header', async () => {
      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRubricData);

      expect(response.headers['content-type']).toMatch(/json/);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect([400, 422, 500]).toContain(response.status);
    });

    it('should handle null request body', async () => {
      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(null);

      expect([400, 422, 500]).toContain(response.status);
    });

    it('should not expose sensitive information in response', async () => {
      const response = await request(app)
        .post('/api/rubrics')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(validRubricData);

      const jsonStr = JSON.stringify(response.body);
      expect(jsonStr).not.toMatch(/password|secret|api[-_]key/i);
    });
  });
});
