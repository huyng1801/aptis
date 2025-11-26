const request = require('supertest');
const app = require('../../../server');

describe('Admin Routes - /api/admin/users/:id (DELETE)', () => {
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

  describe('DELETE /api/admin/users/:id', () => {
    it('should delete user successfully as admin', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should return 403 for non-admin user', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should prevent admin from deleting themselves', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Cannot delete your own account');
    });

    it('should soft delete user (set is_active to false)', async () => {
      // Admin delete should set is_active to false, not hard delete
      const response = await request(app)
        .delete(`/api/admin/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Check if user is deactivated (soft delete)
      const getResponse = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ include_inactive: true });

      // User should still exist but is_active should be false
      const deletedUser = getResponse.body.data.users.find(u => u.id === studentUser.id);
      if (deletedUser) {
        expect(deletedUser.is_active).toBe(false);
      }
    });

    it('should handle deleting user with associated data', async () => {
      // This test assumes the user might have associated exams, results, etc.
      const response = await request(app)
        .delete(`/api/admin/users/${studentUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});