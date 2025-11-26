const request = require('supertest');
const app = require('../../../server');

describe('Exam Routes - /api/exams/:id (PUT UPDATE)', () => {
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

    testLevel = await testHelpers.getTestLevel();
    
    const examData = {
      title: 'Test Exam for Update',
      description: 'Original description',
      level_id: testLevel.id,
      duration_minutes: 60
    };

    const examResponse = await request(app)
      .post('/api/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send(examData);

    testExam = examResponse.body.data.exam;
  });

  describe('PUT /api/exams/:id', () => {
    it('should update exam successfully as creator', async () => {
      const updateData = {
        title: 'Updated Exam Title',
        description: 'Updated description',
        duration_minutes: 90,
        passing_score: 80
      };

      const response = await request(app)
        .put(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.exam.title).toBe(updateData.title);
      expect(response.body.data.exam.duration_minutes).toBe(updateData.duration_minutes);
    });

    it('should allow admin to update other user exams', async () => {
      const updateData = {
        title: 'Admin Updated Title'
      };

      const response = await request(app)
        .put(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.exam.title).toBe(updateData.title);
    });

    it('should return 404 for non-existent exam', async () => {
      const updateData = {
        title: 'Updated Title'
      };

      const response = await request(app)
        .put('/api/exams/99999')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-admin non-creator', async () => {
      const otherTeacher = await testHelpers.createTestUser('teacher');
      const otherToken = testHelpers.getAuthToken(otherTeacher);

      const updateData = {
        title: 'Unauthorized Update'
      };

      const response = await request(app)
        .put(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for students', async () => {
      const updateData = {
        title: 'Student Update'
      };

      const response = await request(app)
        .put(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should validate passing score range', async () => {
      const updateData = {
        passing_score: 150
      };

      const response = await request(app)
        .put(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should allow partial updates', async () => {
      const updateData = {
        title: 'Only Title Changed'
      };

      const response = await request(app)
        .put(`/api/exams/${testExam.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(updateData)
        .expect(200);

      const exam = response.body.data.exam;
      expect(exam.title).toBe(updateData.title);
      expect(exam.description).toBe('Original description'); // Original
    });
  });
});
