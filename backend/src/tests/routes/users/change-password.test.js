const request = require('supertest');
const app = require('../../../server');
const bcryptjs = require('bcryptjs');

describe('User Routes - /api/users/password (PUT)', () => {
  let user, authToken;
  const originalPassword = 'Password123!';

  beforeEach(async () => {
    user = await testHelpers.createTestUser('student', {
      password: originalPassword
    });
    authToken = testHelpers.getAuthToken(user);
  });

  describe('PUT /api/users/password', () => {
    it('should change password successfully with valid current password', async () => {
      const passwordData = {
        currentPassword: originalPassword,
        newPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Password changed successfully');
    });

    it('should return 400 with incorrect current password', async () => {
      const passwordData = {
        currentPassword: 'WrongPassword123!',
        newPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Current password is incorrect');
    });

    it('should return 400 for missing current password', async () => {
      const passwordData = {
        newPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing new password', async () => {
      const passwordData = {
        currentPassword: originalPassword
      };

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for weak new password (too short)', async () => {
      const passwordData = {
        currentPassword: originalPassword,
        newPassword: 'Pass1!'
      };

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation');
    });

    it('should return 400 for weak new password (no uppercase)', async () => {
      const passwordData = {
        currentPassword: originalPassword,
        newPassword: 'password123!'
      };

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation');
    });

    it('should return 400 for weak new password (no lowercase)', async () => {
      const passwordData = {
        currentPassword: originalPassword,
        newPassword: 'PASSWORD123!'
      };

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation');
    });

    it('should return 400 for weak new password (no number)', async () => {
      const passwordData = {
        currentPassword: originalPassword,
        newPassword: 'Password!'
      };

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Validation');
    });

    it('should return 401 without authentication', async () => {
      const passwordData = {
        currentPassword: originalPassword,
        newPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .put('/api/users/password')
        .send(passwordData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should allow same password as new password', async () => {
      const passwordData = {
        currentPassword: originalPassword,
        newPassword: originalPassword
      };

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should work for all user roles', async () => {
      const teacherUser = await testHelpers.createTestUser('teacher', {
        password: originalPassword
      });
      const teacherToken = testHelpers.getAuthToken(teacherUser);

      const passwordData = {
        currentPassword: originalPassword,
        newPassword: 'NewTeacherPassword123!'
      };

      const response = await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(passwordData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should hash the new password securely', async () => {
      const passwordData = {
        currentPassword: originalPassword,
        newPassword: 'NewPassword123!'
      };

      await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      // Verify that the password was actually changed by trying to login with new password
      const loginData = {
        email: user.email,
        password: passwordData.newPassword
      };

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.data).toHaveProperty('accessToken');
    });
  });
});