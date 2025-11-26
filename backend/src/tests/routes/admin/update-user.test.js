const request = require('supertest');
const app = require('../../../server');

describe('Admin Routes - /api/admin/users/:id (UPDATE)', () => {
  let adminUser, adminToken;
  let teacherUser, teacherToken;
  let studentUser;

  beforeEach(async () => {
    adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);
    
    teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    studentUser = await testHelpers.createTestUser('student');
  });

  describe('PUT /api/admin/users/:id', () => {
    it('should update user successfully as admin', async () => {
      const updateData = {
        full_name: 'Updated Name',
        role: 'teacher',
        is_active: false
      };

      const response = await request(app)
        .put(`/api/admin/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.full_name).toBe(updateData.full_name);
      expect(response.body.data.user.role).toBe(updateData.role);
      expect(response.body.data.user.is_active).toBe(updateData.is_active);
    });

    it('should update only provided fields', async () => {
      const originalFullName = studentUser.full_name;
      const updateData = {
        role: 'teacher'
      };

      const response = await request(app)
        .put(`/api/admin/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(updateData.role);
      expect(response.body.data.user.full_name).toBe(originalFullName);
    });

    it('should return 404 for non-existent user', async () => {
      const updateData = {
        full_name: 'Updated Name'
      };

      const response = await request(app)
        .put('/api/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should return 400 for invalid role', async () => {
      const updateData = {
        role: 'invalid_role'
      };

      const response = await request(app)
        .put(`/api/admin/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 403 for non-admin user', async () => {
      const updateData = {
        full_name: 'Updated Name'
      };

      const response = await request(app)
        .put(`/api/admin/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should prevent admin from demoting themselves', async () => {
      const updateData = {
        role: 'student'
      };

      const response = await request(app)
        .put(`/api/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot modify');
    });

    it('should prevent admin from deactivating themselves', async () => {
      const updateData = {
        is_active: false
      };

      const response = await request(app)
        .put(`/api/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot modify');
    });
  });
});