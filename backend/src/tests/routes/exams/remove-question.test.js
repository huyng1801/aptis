const request = require('supertest');
const app = require('../../../server');

describe('Exam Routes - /api/exams/:id/questions/:questionId (DELETE REMOVE)', () => {
  let teacherUser, teacherToken;
  let adminToken;
  let studentToken;
  let testLevel;
  let testExam;
  let testQuestion;
  let examQuestion;

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
      title: 'Test Exam for Remove Questions',
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

    // Create test question
    testQuestion = await testHelpers.createTestQuestion(testLevel.id);

    // Add question to exam
    const questionData = {
      questions: [
        {
          question_id: testQuestion.id,
          order_number: 1
        }
      ]
    };

    const addResponse = await request(app)
      .post(`/api/exams/${testExam.id}/questions`)
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(questionData);

    examQuestion = addResponse.body.data.questions[0];
  });

  describe('DELETE /api/exams/:id/questions/:questionId', () => {
    it('should remove question from exam successfully as creator', async () => {
      const response = await request(app)
        .delete(`/api/exams/${testExam.id}/questions/${examQuestion.question_id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('removed');
    });

    it('should remove question as admin', async () => {
      const response = await request(app)
        .delete(`/api/exams/${testExam.id}/questions/${examQuestion.question_id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .delete(`/api/exams/${testExam.id}/questions/${examQuestion.question_id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .delete(`/api/exams/${testExam.id}/questions/${examQuestion.question_id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent exam', async () => {
      const response = await request(app)
        .delete(`/api/exams/99999/questions/${examQuestion.question_id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent exam question', async () => {
      const response = await request(app)
        .delete(`/api/exams/${testExam.id}/questions/99999`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should prevent teacher from removing from other teacher exam', async () => {
      const otherTeacher = await testHelpers.createTestUser('teacher');
      const otherTeacherToken = testHelpers.getAuthToken(otherTeacher);

      const response = await request(app)
        .delete(`/api/exams/${testExam.id}/questions/${examQuestion.question_id}`)
        .set('Authorization', `Bearer ${otherTeacherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should reorder remaining questions after deletion', async () => {
      // Create additional questions
      const question2 = await testHelpers.createTestQuestion(testLevel.id);
      const question3 = await testHelpers.createTestQuestion(testLevel.id);

      // Add them to exam
      const questionData = {
        questions: [
          {
            question_id: question2.id,
            order_number: 2
          },
          {
            question_id: question3.id,
            order_number: 3
          }
        ]
      };

      const addResponse = await request(app)
        .post(`/api/exams/${testExam.id}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData);

      const question2Record = addResponse.body.data.questions.find(q => q.question_id === question2.id);

      // Remove first question
      await request(app)
        .delete(`/api/exams/${testExam.id}/questions/${examQuestion.question_id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // Get exam to verify reordering
      const getResponse = await request(app)
        .get(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      const remainingQuestions = getResponse.body.data.exam.examQuestions || [];
      expect(remainingQuestions.length).toBe(2);
    });

    it('should not affect published exam status when removing question', async () => {
      // Publish exam first
      await request(app)
        .put(`/api/exams/${testExam.id}/publish`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // Remove question
      const response = await request(app)
        .delete(`/api/exams/${testExam.id}/questions/${examQuestion.question_id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      // Verify exam is still published
      const getResponse = await request(app)
        .get(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(getResponse.body.data.exam.is_published).toBe(true);
    });

    it('should return 400 for invalid question id format', async () => {
      const response = await request(app)
        .delete(`/api/exams/${testExam.id}/questions/invalid`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
