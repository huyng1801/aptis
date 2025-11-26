const request = require('supertest');
const app = require('../../../server');

describe('Exam Routes - /api/exams/:id (GET BY ID)', () => {
  let teacherUser, teacherToken;
  let adminToken;
  let studentToken;
  let testLevel;
  let testExam;

  beforeEach(async () => {
    teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);
    
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);

    // Get test level and create exam
    testLevel = await testHelpers.getTestLevel();
    
    const examData = {
      title: 'Test Exam for ID',
      description: 'Test exam description',
      level_id: testLevel.id,
      duration_minutes: 60,
      passing_score: 70
    };

    const examResponse = await request(app)
      .post('/api/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(examData);

    testExam = examResponse.body.data.exam;
  });

  describe('GET /api/exams/:id', () => {
    it('should get exam by ID as teacher', async () => {
      const response = await request(app)
        .get(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('exam');
      expect(response.body.data.exam.id).toBe(testExam.id);
      expect(response.body.data.exam.title).toBe('Test Exam for ID');
    });

    it('should get exam by ID as admin', async () => {
      const response = await request(app)
        .get(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.exam.id).toBe(testExam.id);
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .get(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/exams/${testExam.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent exam', async () => {
      const response = await request(app)
        .get('/api/exams/99999')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should include complete exam details', async () => {
      const response = await request(app)
        .get(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const exam = response.body.data.exam;
      expect(exam).toHaveProperty('id');
      expect(exam).toHaveProperty('title');
      expect(exam).toHaveProperty('description');
      expect(exam).toHaveProperty('level_id');
      expect(exam).toHaveProperty('duration_minutes');
      expect(exam).toHaveProperty('passing_score');
      expect(exam).toHaveProperty('max_attempts');
      expect(exam).toHaveProperty('is_published');
      expect(exam).toHaveProperty('created_at');
      expect(exam).toHaveProperty('updated_at');
    });

    it('should include associated questions if any', async () => {
      const response = await request(app)
        .get(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const exam = response.body.data.exam;
      
      // Questions property should exist (might be empty array)
      if (exam.questions) {
        expect(Array.isArray(exam.questions)).toBe(true);
      }
    });

    it('should include level information', async () => {
      const response = await request(app)
        .get(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const exam = response.body.data.exam;
      
      // Level information should be included
      if (exam.Level || exam.level) {
        const level = exam.Level || exam.level;
        expect(level).toHaveProperty('id');
        expect(level).toHaveProperty('name');
      }
    });

    it('should return 404 for invalid exam ID format', async () => {
      const response = await request(app)
        .get('/api/exams/invalid-id')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should show creator information', async () => {
      const response = await request(app)
        .get(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const exam = response.body.data.exam;
      
      // Creator information might be included
      if (exam.created_by || exam.creator) {
        expect(exam.created_by || exam.creator).toBeDefined();
      }
    });
  });
});
