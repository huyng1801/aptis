const request = require('supertest');
const app = require('../../../server');

describe('User Routes - /api/users/profile (GET)', () => {
  let user, authToken;

  beforeEach(async () => {
    user = await testHelpers.createTestUser('student', {
      full_name: 'Test Student',
      email: 'student@test.com'
    });
    authToken = testHelpers.getAuthToken(user);
  });

  describe('GET /api/users/profile', () => {
    it('should get user profile successfully', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toMatchObject({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_active: user.is_active
      });
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should include created_at timestamp', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.user).toHaveProperty('created_at');
      expect(new Date(response.body.data.user.created_at)).toBeInstanceOf(Date);
    });

    it('should work for admin user', async () => {
      const adminUser = await testHelpers.createTestUser('admin');
      const adminToken = testHelpers.getAuthToken(adminUser);

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('admin');
    });

    it('should work for teacher user', async () => {
      const teacherUser = await testHelpers.createTestUser('teacher');
      const teacherToken = testHelpers.getAuthToken(teacherUser);

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('teacher');
    });
  });
});