const request = require('supertest');
const app = require('../../../server');

describe('Exam Routes - /api/exams (POST CREATE)', () => {
  let teacherUser, teacherToken;
  let adminToken;
  let studentToken;
  let testLevel;

  beforeEach(async () => {
    teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);
    
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);

    // Get test level for creating exams
    testLevel = await testHelpers.getTestLevel();
  });

  describe('POST /api/exams', () => {
    it('should create exam successfully as teacher', async () => {
      const examData = {
        title: 'New Test Exam',
        description: 'A new test exam description',
        level_id: testLevel.id,
        duration_minutes: 90,
        passing_score: 75,
        max_attempts: 2,
        shuffle_questions: true,
        show_results_immediately: false
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(examData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('exam');
      
      const exam = response.body.data.exam;
      expect(exam.title).toBe(examData.title);
      expect(exam.description).toBe(examData.description);
      expect(exam.level_id).toBe(examData.level_id);
      expect(exam.duration_minutes).toBe(examData.duration_minutes);
      expect(parseFloat(exam.passing_score)).toBe(examData.passing_score);
      expect(exam.max_attempts).toBe(examData.max_attempts);
      expect(exam.shuffle_questions).toBe(examData.shuffle_questions);
      expect(exam.show_results_immediately).toBe(examData.show_results_immediately);
    });

    it('should create exam successfully as admin', async () => {
      const examData = {
        title: 'Admin Created Exam',
        level_id: testLevel.id,
        duration_minutes: 60
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(examData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.exam.title).toBe(examData.title);
    });

    it('should return 403 for students', async () => {
      const examData = {
        title: 'Student Attempt',
        level_id: testLevel.id,
        duration_minutes: 60
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(examData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const examData = {
        title: 'Unauthorized Exam',
        level_id: testLevel.id,
        duration_minutes: 60
      };

      const response = await request(app)
        .post('/api/exams')
        .send(examData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      // Send only optional field, missing all required fields
      const examData = {
        description: 'This should fail'
        // Missing: title, level_id, duration_minutes
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(examData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid level_id', async () => {
      const examData = {
        title: 'Invalid Level Test',
        level_id: 99999,
        duration_minutes: 60
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(examData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid duration', async () => {
      const examData = {
        title: 'Invalid Duration Test',
        level_id: testLevel.id,
        duration_minutes: -10
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(examData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should set default values for optional fields', async () => {
      const examData = {
        title: 'Default Values Test',
        level_id: testLevel.id,
        duration_minutes: 60
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(examData)
        .expect(201);

      const exam = response.body.data.exam;
      expect(exam.max_attempts).toBe(1); // Default value
      expect(exam.shuffle_questions).toBe(false); // Default value
      expect(exam.show_results_immediately).toBe(true); // Default value
      expect(exam.is_published).toBe(false); // Should be unpublished by default
    });

    it('should handle date range for exam availability', async () => {
      const startDate = new Date(Date.now() + 86400000); // Tomorrow
      const endDate = new Date(Date.now() + 86400000 * 7); // Next week

      const examData = {
        title: 'Date Range Test',
        level_id: testLevel.id,
        duration_minutes: 60,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(examData)
        .expect(201);

      const exam = response.body.data.exam;
      expect(Math.abs(new Date(exam.start_date).getTime() - startDate.getTime())).toBeLessThan(1000);
      expect(Math.abs(new Date(exam.end_date).getTime() - endDate.getTime())).toBeLessThan(1000);
    });

    it('should return 400 for end date before start date', async () => {
      const startDate = new Date(Date.now() + 86400000 * 7); // Next week
      const endDate = new Date(Date.now() + 86400000); // Tomorrow

      const examData = {
        title: 'Invalid Date Range',
        level_id: testLevel.id,
        duration_minutes: 60,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(examData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate passing score range', async () => {
      const examData = {
        title: 'Invalid Passing Score',
        level_id: testLevel.id,
        duration_minutes: 60,
        passing_score: 150 // Invalid: over 100
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(examData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should assign creator to the exam', async () => {
      const examData = {
        title: 'Creator Assignment Test',
        level_id: testLevel.id,
        duration_minutes: 60
      };

      const response = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(examData)
        .expect(201);

      const exam = response.body.data.exam;
      expect(exam.created_by).toBe(teacherUser.id);
    });
  });
});