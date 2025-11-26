const request = require('supertest');
const app = require('../../../server');

describe('User Routes - /api/users/profile (PUT)', () => {
  let user, authToken;

  beforeEach(async () => {
    user = await testHelpers.createTestUser('student', {
      full_name: 'Test Student',
      email: 'student@test.com'
    });
    authToken = testHelpers.getAuthToken(user);
  });

  describe('PUT /api/users/profile', () => {
    it('should update profile successfully', async () => {
      const updateData = {
        full_name: 'Updated Student Name'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.full_name).toBe(updateData.full_name);
      expect(response.body.data.user.email).toBe(user.email); // Email should remain unchanged
    });

    it('should trim whitespace from full_name', async () => {
      const updateData = {
        full_name: '  Trimmed Name  '
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.full_name).toBe('Trimmed Name');
    });

    it('should return 400 for invalid full_name (too short)', async () => {
      const updateData = {
        full_name: 'A'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid full_name (too long)', async () => {
      const updateData = {
        full_name: 'A'.repeat(256)
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const updateData = {
        full_name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.full_name).toBe(user.full_name); // Should remain unchanged
    });

    it('should ignore attempts to change email', async () => {
      const updateData = {
        full_name: 'Updated Name',
        email: 'hacker@test.com'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(user.email); // Should remain original email
    });

    it('should ignore attempts to change role', async () => {
      const updateData = {
        full_name: 'Updated Name',
        role: 'admin'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(user.role); // Should remain original role
    });

    it('should work for all user roles', async () => {
      const adminUser = await testHelpers.createTestUser('admin');
      const adminToken = testHelpers.getAuthToken(adminUser);

      const updateData = {
        full_name: 'Updated Admin Name'
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.full_name).toBe(updateData.full_name);
    });
  });
});