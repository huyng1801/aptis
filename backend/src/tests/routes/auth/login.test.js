const request = require('supertest');
const app = require('../../../server');

describe('Auth Routes - /api/auth/login', () => {
  let studentUser, teacherUser, adminUser;
  let studentToken, teacherToken, adminToken;

  beforeEach(async () => {
    studentUser = await testHelpers.createTestUser('student', {
      email: `student-${Date.now()}@test.com`,
      password: 'password123'
    });
    studentToken = testHelpers.getAuthToken(studentUser);

    teacherUser = await testHelpers.createTestUser('teacher', {
      email: `teacher-${Date.now()}@test.com`,
      password: 'password123'
    });
    teacherToken = testHelpers.getAuthToken(teacherUser);

    adminUser = await testHelpers.createTestUser('admin', {
      email: `admin-${Date.now()}@test.com`,
      password: 'password123'
    });
    adminToken = testHelpers.getAuthToken(adminUser);
  });

  describe('POST /api/auth/login', () => {
    it('should login student with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: studentUser.email,
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('student');
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should login teacher with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: teacherUser.email,
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('teacher');
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should login admin with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: adminUser.email,
          password: 'password123'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('admin');
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should return 401 for invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: studentUser.email,
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});