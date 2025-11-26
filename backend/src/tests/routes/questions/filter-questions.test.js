const request = require('supertest');
const app = require('../../../server');

describe('Question Routes - /api/questions/filter (GET FILTER)', () => {
  let teacherUser, teacherToken;
  let adminToken;
  let studentToken;
  let testLevel;
  let testSkill;
  let testQuestions;

  beforeEach(async () => {
    teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);
    
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);

    testLevel = await testHelpers.getTestLevel();
    testSkill = await testHelpers.getTestSkill();

    // Create multiple test questions
    testQuestions = [];
    for (let i = 0; i < 5; i++) {
      const q = await testHelpers.createTestQuestion(testLevel.id);
      testQuestions.push(q);
    }
  });

  describe('GET /api/questions/filter', () => {
    it('should filter questions as teacher', async () => {
      const response = await request(app)
        .get('/api/questions/filter')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter questions as admin', async () => {
      const response = await request(app)
        .get('/api/questions/filter')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .get('/api/questions/filter')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/questions/filter')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should filter questions by level_id', async () => {
      const response = await request(app)
        .get(`/api/questions/filter?level_id=${testLevel.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        response.body.data.forEach(q => {
          expect(q.level_id).toBe(testLevel.id);
        });
      }
    });

    it('should filter questions by skill_id', async () => {
      const response = await request(app)
        .get(`/api/questions/filter?skill_id=${testSkill.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter questions by skill_id', async () => {
      const response = await request(app)
        .get('/api/questions/filter?type=multiple_choice')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        response.body.data.forEach(q => {
          expect(q.type).toBe('multiple_choice');
        });
      }
    });

    it('should filter by multiple criteria', async () => {
      const response = await request(app)
        .get(`/api/questions/filter?level_id=${testLevel.id}&type=multiple_choice`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support limit parameter', async () => {
      const response = await request(app)
        .get('/api/questions/filter?limit=10')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });

    it('should return only active questions', async () => {
      const response = await request(app)
        .get('/api/questions/filter')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      if (response.body.data.length > 0) {
        response.body.data.forEach(q => {
          expect(q.is_active).toBe(true);
        });
      }
    });

    it('should return empty array for non-matching filters', async () => {
      const response = await request(app)
        .get('/api/questions/filter?skill_id=999999&level_id=999999')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should include question details', async () => {
      const response = await request(app)
        .get('/api/questions/filter')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        const q = response.body.data[0];
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('question_text');
        expect(q).toHaveProperty('type');
        expect(q).toHaveProperty('level_id');
      }
    });
  });
});
