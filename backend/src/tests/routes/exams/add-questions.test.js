const request = require('supertest');
const app = require('../../../server');

describe('Exam Routes - /api/exams/:id/questions (POST ADD QUESTIONS)', () => {
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
      title: 'Test Exam for Questions',
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
  });

  describe('POST /api/exams/:id/questions', () => {
    it('should add questions to exam successfully as teacher', async () => {
      const questionData = {
        questions: [
          {
            question_id: testQuestion.id,
            order_number: 1
          }
        ]
      };

      const response = await request(app)
        .post(`/api/exams/${testExam.id}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('questions');
      expect(Array.isArray(response.body.data.questions)).toBe(true);
      expect(response.body.data.questions.length).toBe(1);
    });

    it('should add multiple questions to exam', async () => {
      const question2 = await testHelpers.createTestQuestion(testLevel.id);

      const questionData = {
        questions: [
          {
            question_id: testQuestion.id,
            order_number: 1
          },
          {
            question_id: question2.id,
            order_number: 2
          }
        ]
      };

      const response = await request(app)
        .post(`/api/exams/${testExam.id}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.questions.length).toBe(2);
    });

    it('should add questions as admin', async () => {
      const questionData = {
        questions: [
          {
            question_id: testQuestion.id,
            order_number: 1
          }
        ]
      };

      const response = await request(app)
        .post(`/api/exams/${testExam.id}/questions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(questionData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should return 403 for students', async () => {
      const questionData = {
        questions: [
          {
            question_id: testQuestion.id,
            order_number: 1
          }
        ]
      };

      const response = await request(app)
        .post(`/api/exams/${testExam.id}/questions`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(questionData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const questionData = {
        questions: [
          {
            question_id: testQuestion.id,
            order_number: 1
          }
        ]
      };

      const response = await request(app)
        .post(`/api/exams/${testExam.id}/questions`)
        .send(questionData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 404 for non-existent exam', async () => {
      const questionData = {
        questions: [
          {
            question_id: testQuestion.id,
            order_number: 1
          }
        ]
      };

      const response = await request(app)
        .post('/api/exams/99999/questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid question_id', async () => {
      const questionData = {
        questions: [
          {
            question_id: 99999,
            order_number: 1
          }
        ]
      };

      const response = await request(app)
        .post(`/api/exams/${testExam.id}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing required fields', async () => {
      const questionData = {
        questions: [
          {
            // Missing question_id
            order_number: 1
          }
        ]
      };

      const response = await request(app)
        .post(`/api/exams/${testExam.id}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should prevent teacher from adding questions to other teacher exam', async () => {
      const otherTeacher = await testHelpers.createTestUser('teacher');
      const otherTeacherToken = testHelpers.getAuthToken(otherTeacher);

      const questionData = {
        questions: [
          {
            question_id: testQuestion.id,
            order_number: 1
          }
        ]
      };

      const response = await request(app)
        .post(`/api/exams/${testExam.id}/questions`)
        .set('Authorization', `Bearer ${otherTeacherToken}`)
        .send(questionData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should maintain question order', async () => {
      const question2 = await testHelpers.createTestQuestion(testLevel.id);
      const question3 = await testHelpers.createTestQuestion(testLevel.id);

      const questionData = {
        questions: [
          {
            question_id: testQuestion.id,
            order_number: 3
          },
          {
            question_id: question2.id,
            order_number: 1
          },
          {
            question_id: question3.id,
            order_number: 2
          }
        ]
      };

      const response = await request(app)
        .post(`/api/exams/${testExam.id}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)
        .expect(200);

      const questions = response.body.data.questions;
      expect(questions[0].order_number).toBe(1);
      expect(questions[1].order_number).toBe(2);
      expect(questions[2].order_number).toBe(3);
    });

    it('should prevent duplicate questions in same request', async () => {
      const questionData = {
        questions: [
          {
            question_id: testQuestion.id,
            order_number: 1
          },
          {
            question_id: testQuestion.id,
            order_number: 2
          }
        ]
      };

      const response = await request(app)
        .post(`/api/exams/${testExam.id}/questions`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(questionData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
