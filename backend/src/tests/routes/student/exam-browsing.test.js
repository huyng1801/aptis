const request = require('supertest');
const app = require('../../../server');

describe('Student Routes - Exam Browsing', () => {
  let studentUser, studentToken;
  let teacherUser, teacherToken;
  let testLevel, testSkill;
  let publishedExam;

  beforeEach(async () => {
    // Create test users
    studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);

    teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    // Get test data
    testLevel = await testHelpers.getTestLevel();
    testSkill = await testHelpers.getTestSkill();

    // Create exam with proper setup
    publishedExam = await testHelpers.createTestExam(teacherUser.id, testLevel.id, {
      title: 'Student Test Exam',
      description: 'Test exam for students',
      duration_minutes: 60,
      passing_score: 70,
      is_published: true
    });

    // Create and add a question to make exam complete
    const testQuestion = await testHelpers.createTestQuestion(testLevel.id, {
      skill_id: testSkill.id,
      type: 'reading_multiple_choice',
      question_text: 'Test question for exam',
      correct_answer: 'A',
      points: 10
    });

    // Add question to exam via ExamQuestion
    const { ExamQuestion } = require('../../../models');
    await ExamQuestion.create({
      exam_id: publishedExam.id,
      question_id: testQuestion.id,
      order_number: 1
    });
  });

  describe('GET /api/student/exams', () => {
    it('should get available exams for student', async () => {
      const response = await request(app)
        .get('/api/student/exams')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('exams');
      expect(Array.isArray(response.body.data.exams)).toBe(true);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/student/exams')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-student users', async () => {
      const response = await request(app)
        .get('/api/student/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should support filtering by level', async () => {
      const response = await request(app)
        .get('/api/student/exams')
        .query({ level_id: testLevel.id })
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.exams)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/student/exams')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
    });

    it('should only show published exams', async () => {
      // Create unpublished exam
      const unpublishedExam = await testHelpers.createTestExam(teacherUser.id, testLevel.id, {
        title: 'Unpublished Exam',
        is_published: false
      });

      const response = await request(app)
        .get('/api/student/exams')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const exams = response.body.data.exams;
      const unpublishedFound = exams.find(exam => exam.id === unpublishedExam.id);
      expect(unpublishedFound).toBeUndefined();
    });

    it('should include exam metadata', async () => {
      const response = await request(app)
        .get('/api/student/exams')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      if (response.body.data.exams.length > 0) {
        const exam = response.body.data.exams[0];
        expect(exam).toHaveProperty('id');
        expect(exam).toHaveProperty('title');
        expect(exam).toHaveProperty('description');
        expect(exam).toHaveProperty('duration_minutes');
        expect(exam).toHaveProperty('level_id');
        expect(exam).toHaveProperty('level');
      }
    });

    it('should support search functionality', async () => {
      const response = await request(app)
        .get('/api/student/exams')
        .query({ search: 'Student' })
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/student/exams/{id}', () => {
    it('should get exam details for student', async () => {
      const response = await request(app)
        .get(`/api/student/exams/${publishedExam.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('exam');
      expect(response.body.data.exam.id).toBe(publishedExam.id);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/student/exams/${publishedExam.id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-student users', async () => {
      const response = await request(app)
        .get(`/api/student/exams/${publishedExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent exam', async () => {
      const response = await request(app)
        .get('/api/student/exams/999999')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should not show unpublished exams', async () => {
      const unpublishedExam = await testHelpers.createTestExam(teacherUser.id, testLevel.id, {
        title: 'Unpublished Exam',
        is_published: false
      });

      const response = await request(app)
        .get(`/api/student/exams/${unpublishedExam.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should include exam details but hide sensitive data', async () => {
      const response = await request(app)
        .get(`/api/student/exams/${publishedExam.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const exam = response.body.data.exam;
      expect(exam).toHaveProperty('id');
      expect(exam).toHaveProperty('title');
      expect(exam).toHaveProperty('description');
      expect(exam).toHaveProperty('duration_minutes');
      expect(exam).toHaveProperty('passing_score');
      
      // Should include question count but not answers
      if (exam.questions) {
        exam.questions.forEach(question => {
          expect(question).not.toHaveProperty('correct_answer');
        });
      }
    });

    it('should include level information', async () => {
      const response = await request(app)
        .get(`/api/student/exams/${publishedExam.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const exam = response.body.data.exam;
      if (exam.level) {
        expect(exam.level).toHaveProperty('id');
        expect(exam.level).toHaveProperty('name');
      }
    });

    it('should show attempt information for student', async () => {
      const response = await request(app)
        .get(`/api/student/exams/${publishedExam.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      const exam = response.body.data.exam;
      // Should show passing score and other details
      expect(exam).toHaveProperty('passing_score');
      expect(exam).toHaveProperty('max_attempts');
    });
  });
});