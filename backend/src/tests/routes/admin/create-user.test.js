const request = require('supertest');
const app = require('../../../server');

describe('Admin Routes - /api/admin/users (CREATE)', () => {
  let adminUser, adminToken;
  let teacherToken;

  beforeEach(async () => {
    adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);
    
    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);
  });

  describe('POST /api/admin/users', () => {
    it('should create new user as admin', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'Password123!',
        full_name: 'New Test User',
        role: 'teacher'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user.role).toBe(userData.role);
      expect(response.body.data.user.full_name).toBe(userData.full_name);
      expect(response.body.data.user.password_hash).toBeUndefined();
    });

    it('should create admin user', async () => {
      const userData = {
        email: 'admin@test.com',
        password: 'Password123!',
        full_name: 'Admin User',
        role: 'admin'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('admin');
    });

    it('should return 400 for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'Password123!',
        full_name: 'Test User',
        role: 'student'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid role', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'Password123!',
        full_name: 'Test User',
        role: 'invalid_role'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for duplicate email', async () => {
      await testHelpers.createTestUser('student', { email: 'existing@test.com' });

      const userData = {
        email: 'existing@test.com',
        password: 'Password123!',
        full_name: 'Test User',
        role: 'student'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should return 403 for non-admin user', async () => {
      const userData = {
        email: 'test@test.com',
        password: 'Password123!',
        full_name: 'Test User',
        role: 'student'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(userData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });
});