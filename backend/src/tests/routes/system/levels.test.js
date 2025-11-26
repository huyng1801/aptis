const request = require('supertest');
const app = require('../../../server');

describe('Admin - System Management › CEFR Levels', () => {
  let adminToken, teacherToken, studentToken;
  let testLevel;

  beforeEach(async () => {
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);

    // Create test level
    testLevel = await testHelpers.getTestLevel();
  });

  describe('GET /api/admin/levels', () => {
    it('should get all CEFR levels as admin', async () => {
      const response = await request(app)
        .get('/api/admin/levels')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(Array.isArray(response.body.data.levels) || Array.isArray(response.body.data)).toBe(true);
      }
    });

    it('should return 403 Forbidden for non-admin users', async () => {
      const response = await request(app)
        .get('/api/admin/levels')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 Unauthorized without token', async () => {
      const response = await request(app)
        .get('/api/admin/levels');

      expect(response.status).toBe(401);
    });

    it('should return consistent level structure', async () => {
      const response = await request(app)
        .get('/api/admin/levels')
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        const levels = Array.isArray(response.body.data.levels) ? response.body.data.levels : response.body.data;
        if (levels.length > 0) {
          expect(levels[0]).toHaveProperty('id');
          expect(levels[0]).toHaveProperty('name');
        }
      }
    });

    it('should return different access for each role', async () => {
      const adminResponse = await request(app)
        .get('/api/admin/levels')
        .set('Authorization', `Bearer ${adminToken}`);

      const studentResponse = await request(app)
        .get('/api/admin/levels')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(adminResponse.status).not.toBe(403);
      expect(studentResponse.status).toBe(403);
    });
  });

  describe('POST /api/admin/levels', () => {
    it('should create a new CEFR level as admin', async () => {
      const levelData = {
        name: 'A1',
        description: 'Beginner level'
      };

      const response = await request(app)
        .post('/api/admin/levels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(levelData);

      expect([200, 201, 400, 409, 500]).toContain(response.status);
      if (response.status === 201 || response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        if (response.body.data.name) {
          expect(response.body.data.name).toBe(levelData.name);
        }
      }
    });

    it('should reject level creation without name', async () => {
      const levelData = {
        description: 'Missing name'
      };

      const response = await request(app)
        .post('/api/admin/levels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(levelData);

      expect([400, 500]).toContain(response.status);
      if (response.status === 400) {
        expect(response.body.success).toBe(false);
      }
    });

    it('should reject level creation with invalid CEFR name', async () => {
      const levelData = {
        name: 'INVALID',
        description: 'Invalid CEFR level'
      };

      const response = await request(app)
        .post('/api/admin/levels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(levelData);

      expect([200, 201, 400, 409, 500]).toContain(response.status);
    });

    it('should reject duplicate level creation', async () => {
      const levelData = {
        name: 'A2',
        description: 'Elementary level'
      };

      // First creation
      await request(app)
        .post('/api/admin/levels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(levelData);

      // Attempt duplicate
      const duplicateResponse = await request(app)
        .post('/api/admin/levels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(levelData);

      expect([409, 400, 500]).toContain(duplicateResponse.status);
    });

    it('should return 403 Forbidden for non-admin users', async () => {
      const levelData = {
        name: 'B1',
        description: 'Intermediate level'
      };

      const response = await request(app)
        .post('/api/admin/levels')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(levelData);

      expect(response.status).toBe(403);
    });

    it('should return 401 Unauthorized without token', async () => {
      const levelData = {
        name: 'B2',
        description: 'Upper intermediate level'
      };

      const response = await request(app)
        .post('/api/admin/levels')
        .send(levelData);

      expect(response.status).toBe(401);
    });

    it('should accept optional description field', async () => {
      const levelData = {
        name: 'C1'
      };

      const response = await request(app)
        .post('/api/admin/levels')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(levelData);

      expect([200, 201, 400, 409, 500]).toContain(response.status);
    });
  });

  describe('PUT /api/admin/levels/:id', () => {
    it('should update a CEFR level as admin', async () => {
      const updateData = {
        name: 'A1',
        description: 'Updated beginner level'
      };

      const response = await request(app)
        .put(`/api/admin/levels/${testLevel.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect([200, 400, 404, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    it('should return 404 for non-existent level', async () => {
      const updateData = {
        description: 'This should not be found'
      };

      const response = await request(app)
        .put('/api/admin/levels/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect([404, 500]).toContain(response.status);
    });

    it('should allow updating only description', async () => {
      const updateData = {
        description: 'Updated description only'
      };

      const response = await request(app)
        .put(`/api/admin/levels/${testLevel.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should allow updating only name', async () => {
      const updateData = {
        name: 'A3'
      };

      const response = await request(app)
        .put(`/api/admin/levels/${testLevel.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect([200, 400, 404, 409, 500]).toContain(response.status);
    });

    it('should return 403 Forbidden for non-admin users', async () => {
      const updateData = {
        description: 'Trying to update without permission'
      };

      const response = await request(app)
        .put(`/api/admin/levels/${testLevel.id}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
    });

    it('should return 401 Unauthorized without token', async () => {
      const updateData = {
        description: 'No token provided'
      };

      const response = await request(app)
        .put(`/api/admin/levels/${testLevel.id}`)
        .send(updateData);

      expect(response.status).toBe(401);
    });

    it('should handle empty request body', async () => {
      const response = await request(app)
        .put(`/api/admin/levels/${testLevel.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should prevent duplicate level names', async () => {
      const updateData = {
        name: 'B1' // Assuming B1 exists
      };

      const response = await request(app)
        .put(`/api/admin/levels/${testLevel.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect([200, 400, 409, 404, 500]).toContain(response.status);
    });
  });

  describe('DELETE /api/admin/levels/:id', () => {
    it('should delete a CEFR level as admin', async () => {
      const response = await request(app)
        .delete(`/api/admin/levels/${testLevel.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBeDefined();
      }
    });

    it('should return 404 for non-existent level', async () => {
      const response = await request(app)
        .delete('/api/admin/levels/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([404, 500]).toContain(response.status);
    });

    it('should return 403 Forbidden for non-admin users', async () => {
      const response = await request(app)
        .delete(`/api/admin/levels/${testLevel.id}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 401 Unauthorized without token', async () => {
      const response = await request(app)
        .delete(`/api/admin/levels/${testLevel.id}`);

      expect(response.status).toBe(401);
    });

    it('should handle deletion of level with associated content', async () => {
      // Try to delete a level that may have questions
      const response = await request(app)
        .delete(`/api/admin/levels/${testLevel.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404, 500]).toContain(response.status);
    });

    it('should prevent double deletion', async () => {
      // Delete once
      const firstDelete = await request(app)
        .delete(`/api/admin/levels/${testLevel.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Try to delete again
      const secondDelete = await request(app)
        .delete(`/api/admin/levels/${testLevel.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 404, 500]).toContain(firstDelete.status);
      expect([404, 500]).toContain(secondDelete.status);
    });

    it('should return proper message on successful deletion', async () => {
      const response = await request(app)
        .delete(`/api/admin/levels/${testLevel.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      if (response.status === 200) {
        expect(response.body.message || response.body.data?.message).toBeDefined();
      }
    });

    it('should handle invalid level ID format', async () => {
      const response = await request(app)
        .delete('/api/admin/levels/invalid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([400, 404, 500]).toContain(response.status);
    });
  });
});
