const request = require('supertest');
const app = require('../../../server');

describe('Exam Routes - /api/exams/:id/publish (PUT PUBLISH)', () => {
  let teacherUser, teacherToken;
  let adminToken;
  let studentToken;
  let testLevel;
  let testExam;
  let testQuestion;

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
      title: 'Test Exam for Publish',
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

    // Create and add test question
    testQuestion = await testHelpers.createTestQuestion(testLevel.id);

    const questionData = {
      questions: [
        {
          question_id: testQuestion.id,
          order_number: 1
        }
      ]
    };

    await request(app)
      .post(`/api/exams/${testExam.id}/questions`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(questionData);
  });

  describe('PUT /api/exams/:id/publish', () => {
    it('should publish exam successfully as creator', async () => {
      const response = await request(app)
        .put(`/api/exams/${testExam.id}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('exam');
      expect(response.body.data.exam.is_published).toBe(true);
    });

    it('should unpublish exam when already published', async () => {
      // Publish exam first
      await request(app)
        .put(`/api/exams/${testExam.id}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // Unpublish it
      const response = await request(app)
        .put(`/api/exams/${testExam.id}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.exam.is_published).toBe(false);
    });

    it('should publish exam as admin', async () => {
      const response = await request(app)
        .put(`/api/exams/${testExam.id}/publish`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.exam.is_published).toBe(true);
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .put(`/api/exams/${testExam.id}/publish`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .put(`/api/exams/${testExam.id}/publish`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent exam', async () => {
      const response = await request(app)
        .put('/api/exams/99999/publish')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should prevent teacher from publishing other teacher exam', async () => {
      const otherTeacher = await testHelpers.createTestUser('teacher');
      const otherTeacherToken = testHelpers.getAuthToken(otherTeacher);

      const response = await request(app)
        .put(`/api/exams/${testExam.id}/publish`)
        .set('Authorization', `Bearer ${otherTeacherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 if exam has no questions', async () => {
      // Create exam without questions
      const examData = {
        title: 'Empty Exam',
        level_id: testLevel.id,
        duration_minutes: 60
      };

      const examResponse = await request(app)
        .post('/api/exams')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(examData);

      const emptyExam = examResponse.body.data.exam;

      const response = await request(app)
        .put(`/api/exams/${emptyExam.id}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('questions');
    });

    it('should allow unpublishing even without questions', async () => {
      // Publish exam with questions
      await request(app)
        .put(`/api/exams/${testExam.id}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // Remove all questions
      const getResponse = await request(app)
        .get(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const questions = getResponse.body.data.exam.examQuestions || [];
      for (const q of questions) {
        await request(app)
          .delete(`/api/exams/${testExam.id}/questions/${q.exam_question_id}`)
          .set('Authorization', `Bearer ${teacherToken}`);
      }

      // Should still allow unpublishing
      const response = await request(app)
        .put(`/api/exams/${testExam.id}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.exam.is_published).toBe(false);
    });

    it('should preserve exam settings after publishing', async () => {
      const response = await request(app)
        .put(`/api/exams/${testExam.id}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const exam = response.body.data.exam;
      expect(exam.title).toBe(testExam.title);
      expect(exam.description).toBe(testExam.description);
      expect(exam.level_id).toBe(testExam.level_id);
      expect(exam.duration_minutes).toBe(testExam.duration_minutes);
      expect(exam.passing_score).toBe(testExam.passing_score);
    });

    it('should allow editing unpublished exam', async () => {
      // Make sure exam is unpublished
      const updateResponse = await request(app)
        .put(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ title: 'Updated Title' })
        .expect(200);

      expect(updateResponse.body.data.exam.title).toBe('Updated Title');
    });

    it('should include updated_at timestamp after publish', async () => {
      const beforePublish = new Date();

      const response = await request(app)
        .put(`/api/exams/${testExam.id}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const exam = response.body.data.exam;
      expect(exam).toHaveProperty('updated_at');
      const updatedAt = new Date(exam.updated_at);
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(beforePublish.getTime());
    });

    it('should toggle publish status correctly', async () => {
      // Start unpublished
      let getResponse = await request(app)
        .get(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(getResponse.body.data.exam.is_published).toBe(false);

      // Publish
      await request(app)
        .put(`/api/exams/${testExam.id}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      getResponse = await request(app)
        .get(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(getResponse.body.data.exam.is_published).toBe(true);

      // Unpublish
      await request(app)
        .put(`/api/exams/${testExam.id}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      getResponse = await request(app)
        .get(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(getResponse.body.data.exam.is_published).toBe(false);
    });
  });
});
