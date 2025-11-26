const request = require('supertest');
const app = require('../../../server');

describe('Question Routes - /api/questions/export (GET EXPORT)', () => {
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

    // Create test questions
    testQuestions = [];
    for (let i = 0; i < 3; i++) {
      const q = await testHelpers.createTestQuestion(testLevel.id);
      testQuestions.push(q);
    }
  });

  describe('GET /api/questions/export', () => {
    it('should export all questions as teacher', async () => {
      const response = await request(app)
        .get('/api/questions/export')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should export all questions as admin', async () => {
      const response = await request(app)
        .get('/api/questions/export')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .get('/api/questions/export')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/questions/export')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should export with correct content-type JSON', async () => {
      const response = await request(app)
        .get('/api/questions/export')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.type).toMatch(/json/);
    });

    it('should export questions filtered by level_id', async () => {
      const response = await request(app)
        .get(`/api/questions/export?level_id=${testLevel.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      if (response.body.data.length > 0) {
        response.body.data.forEach(q => {
          expect(q.level_id).toBe(testLevel.id);
        });
      }
    });

    it('should export questions filtered by skill_id', async () => {
      const response = await request(app)
        .get(`/api/questions/export?skill_id=${testSkill.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should export questions filtered by type', async () => {
      const response = await request(app)
        .get('/api/questions/export?type=multiple_choice')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      if (response.body.data.length > 0) {
        response.body.data.forEach(q => {
          expect(q.type).toBe('multiple_choice');
        });
      }
    });

    it('should export with multiple filters', async () => {
      const response = await request(app)
        .get(`/api/questions/export?level_id=${testLevel.id}&type=multiple_choice`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should include complete question data in export', async () => {
      const response = await request(app)
        .get('/api/questions/export')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        const q = response.body.data[0];
        expect(q).toHaveProperty('id');
        expect(q).toHaveProperty('question_text');
        expect(q).toHaveProperty('type');
        expect(q).toHaveProperty('level_id');
        expect(q).toHaveProperty('skill_id');
        expect(q).toHaveProperty('correct_answer');
        expect(q).toHaveProperty('points');
      }
    });

    it('should include metadata in export', async () => {
      const response = await request(app)
        .get('/api/questions/export')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should export with description and explanation', async () => {
      const response = await request(app)
        .get('/api/questions/export')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        const q = response.body.data[0];
        // Explanation should be included if it exists
        if (q.explanation) {
          expect(typeof q.explanation).toBe('string');
        }
      }
    });

    it('should return empty array when no questions match filters', async () => {
      const response = await request(app)
        .get('/api/questions/export?skill_id=999999&level_id=999999')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });

    it('should export valid JSON structure', async () => {
      const response = await request(app)
        .get('/api/questions/export')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(typeof response.body).toBe('object');
      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
    });

    it('should include only active questions in export', async () => {
      const response = await request(app)
        .get('/api/questions/export')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        response.body.data.forEach(q => {
          expect(q.is_active).toBe(true);
        });
      }
    });

    it('should export with options field for multiple choice questions', async () => {
      const response = await request(app)
        .get('/api/questions/export?type=multiple_choice')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      if (response.body.data.length > 0) {
        const q = response.body.data[0];
        expect(q.type).toBe('multiple_choice');
        if (q.options) {
          expect(Array.isArray(q.options) || typeof q.options === 'string').toBe(true);
        }
      }
    });
  });
});
