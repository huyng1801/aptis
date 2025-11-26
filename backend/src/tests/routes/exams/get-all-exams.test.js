const request = require('supertest');
const app = require('../../../server');

describe('Exam Routes - /api/exams (GET ALL)', () => {
  let teacherUser, teacherToken;
  let adminUser, adminToken;
  let studentToken;
  let testLevel;

  beforeEach(async () => {
    teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);
    
    adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);

    // Get test level for creating exams
    testLevel = await testHelpers.getTestLevel();
  });

  describe('GET /api/exams', () => {
    it('should get all exams as teacher', async () => {
      // Create test exam first
      const examData = {
        title: 'Test Exam',
        description: 'Test exam description',
        level_id: testLevel.id,
        duration_minutes: 60,
        passing_score: 70,
        max_attempts: 3
      };

      await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(examData);

      const response = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('exams');
      expect(Array.isArray(response.body.data.exams)).toBe(true);
      expect(response.body.data.exams.length).toBeGreaterThan(0);
    });

    it('should get all exams as admin', async () => {
      const response = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('exams');
      expect(Array.isArray(response.body.data.exams)).toBe(true);
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/exams')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should filter exams by level_id', async () => {
      const response = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ level_id: testLevel.id })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      if (response.body.data.exams.length > 0) {
        response.body.data.exams.forEach(exam => {
          expect(exam.level_id).toBe(testLevel.id);
        });
      }
    });

    it('should filter exams by published status', async () => {
      const response = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ is_published: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      
      if (response.body.data.exams.length > 0) {
        response.body.data.exams.forEach(exam => {
          expect(exam.is_published).toBe(true);
        });
      }
    });

    it('should search exams by title', async () => {
      // Create exam with specific title
      const examData = {
        title: 'Unique Search Title',
        description: 'Searchable exam',
        level_id: testLevel.id,
        duration_minutes: 60
      };

      await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(examData);

      const response = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ search: 'Unique Search' })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .query({ page: 1, limit: 5 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page');
      expect(response.body.data.pagination).toHaveProperty('limit');
      expect(response.body.data.pagination).toHaveProperty('total');
    });

    it('should include exam metadata', async () => {
      // Create a test exam
      const examData = {
        title: 'Metadata Test Exam',
        description: 'Test exam for metadata',
        level_id: testLevel.id,
        duration_minutes: 60
      };

      await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(examData);

      const response = await request(app)
        .get('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      
      if (response.body.data.exams.length > 0) {
        const exam = response.body.data.exams[0];
        expect(exam).toHaveProperty('id');
        expect(exam).toHaveProperty('title');
        expect(exam).toHaveProperty('level_id');
        expect(exam).toHaveProperty('duration_minutes');
        expect(exam).toHaveProperty('created_at');
        expect(exam).toHaveProperty('is_published');
      }
    });
  });
});
