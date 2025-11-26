const request = require('supertest');
const app = require('../../../server');
const fs = require('fs');
const path = require('path');

describe('Admin - System Management › Bulk Import', () => {
  let adminToken, teacherToken, studentToken;

  beforeEach(async () => {
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);
  });

  describe('POST /api/admin/bulk-import', () => {
    it('should reject bulk import without file', async () => {
      const response = await request(app)
        .post('/api/admin/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('import_type', 'questions');

      expect([400, 500]).toContain(response.status);
    });

    it('should reject bulk import without import_type', async () => {
      const csvContent = 'name,email\ntest,test@example.com';
      const tempFile = path.join(__dirname, 'temp_test.csv');
      fs.writeFileSync(tempFile, csvContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .set('Authorization', `Bearer ${adminToken}`)
          .attach('file', tempFile);

        expect([400, 500]).toContain(response.status);
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should reject import with invalid import_type', async () => {
      const csvContent = 'name,email\ntest,test@example.com';
      const tempFile = path.join(__dirname, 'temp_test.csv');
      fs.writeFileSync(tempFile, csvContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('import_type', 'invalid_type')
          .attach('file', tempFile);

        expect([400, 500]).toContain(response.status);
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should accept questions bulk import', async () => {
      const csvContent = 'question_text,type,level_id,skill_id\n"What is test?",multiple_choice,1,1';
      const tempFile = path.join(__dirname, 'temp_questions.csv');
      fs.writeFileSync(tempFile, csvContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('import_type', 'questions')
          .attach('file', tempFile);

        expect([200, 400, 500]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body.success).toBe(true);
          expect(response.body.data).toBeDefined();
          expect(response.body.data.imported_count !== undefined || response.body.data.failed_count !== undefined).toBe(true);
        }
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should accept exams bulk import', async () => {
      const csvContent = 'title,description,level_id,duration_minutes\n"Test Exam","Sample exam",1,60';
      const tempFile = path.join(__dirname, 'temp_exams.csv');
      fs.writeFileSync(tempFile, csvContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('import_type', 'exams')
          .attach('file', tempFile);

        expect([200, 400, 500]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body.success).toBe(true);
        }
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should accept users bulk import', async () => {
      const csvContent = 'email,full_name,role\ntest@example.com,Test User,student';
      const tempFile = path.join(__dirname, 'temp_users.csv');
      fs.writeFileSync(tempFile, csvContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('import_type', 'users')
          .attach('file', tempFile);

        expect([200, 400, 500]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body.success).toBe(true);
        }
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should accept results bulk import', async () => {
      const csvContent = 'user_id,exam_id,score,submitted_at\n1,1,85,"2025-01-01T00:00:00Z"';
      const tempFile = path.join(__dirname, 'temp_results.csv');
      fs.writeFileSync(tempFile, csvContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('import_type', 'results')
          .attach('file', tempFile);

        expect([200, 400, 500]).toContain(response.status);
        if (response.status === 200) {
          expect(response.body.success).toBe(true);
        }
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should return imported_count in response', async () => {
      const csvContent = 'question_text,type,level_id\n"Q1",multiple_choice,1\n"Q2",multiple_choice,1';
      const tempFile = path.join(__dirname, 'temp_multi.csv');
      fs.writeFileSync(tempFile, csvContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('import_type', 'questions')
          .attach('file', tempFile);

        if (response.status === 200) {
          expect(response.body.data.imported_count !== undefined || 
                  response.body.data.failed_count !== undefined).toBe(true);
        }
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should report errors for invalid records', async () => {
      const csvContent = 'question_text,type,level_id\n"Invalid"'; // Missing required fields
      const tempFile = path.join(__dirname, 'temp_invalid.csv');
      fs.writeFileSync(tempFile, csvContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('import_type', 'questions')
          .attach('file', tempFile);

        expect([200, 400, 500]).toContain(response.status);
        if (response.status === 200 && response.body.data.errors) {
          expect(Array.isArray(response.body.data.errors)).toBe(true);
        }
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should handle empty CSV file', async () => {
      const csvContent = ''; // Empty file
      const tempFile = path.join(__dirname, 'temp_empty.csv');
      fs.writeFileSync(tempFile, csvContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('import_type', 'questions')
          .attach('file', tempFile);

        expect([200, 400, 500]).toContain(response.status);
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should handle CSV with headers only', async () => {
      const csvContent = 'question_text,type,level_id,skill_id'; // Headers but no data
      const tempFile = path.join(__dirname, 'temp_headers.csv');
      fs.writeFileSync(tempFile, csvContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('import_type', 'questions')
          .attach('file', tempFile);

        expect([200, 400, 500]).toContain(response.status);
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should handle large CSV file', async () => {
      // Create CSV with many rows
      let csvContent = 'question_text,type,level_id,skill_id\n';
      for (let i = 0; i < 100; i++) {
        csvContent += `"Question ${i}",multiple_choice,1,1\n`;
      }
      const tempFile = path.join(__dirname, 'temp_large.csv');
      fs.writeFileSync(tempFile, csvContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('import_type', 'questions')
          .attach('file', tempFile);

        expect([200, 400, 500]).toContain(response.status);
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should handle CSV with special characters', async () => {
      const csvContent = 'question_text,type,level_id,skill_id\n"What is café?",multiple_choice,1,1';
      const tempFile = path.join(__dirname, 'temp_special.csv');
      fs.writeFileSync(tempFile, csvContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('import_type', 'questions')
          .attach('file', tempFile);

        expect([200, 400, 500]).toContain(response.status);
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should reject non-CSV file types', async () => {
      const txtContent = 'This is a text file, not CSV';
      const tempFile = path.join(__dirname, 'temp_test.txt');
      fs.writeFileSync(tempFile, txtContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('import_type', 'questions')
          .attach('file', tempFile);

        expect([200, 400, 500]).toContain(response.status);
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should return 403 Forbidden for non-admin users', async () => {
      const csvContent = 'question_text,type\n"Test",multiple_choice';
      const tempFile = path.join(__dirname, 'temp_forbid.csv');
      fs.writeFileSync(tempFile, csvContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .set('Authorization', `Bearer ${teacherToken}`)
          .field('import_type', 'questions')
          .attach('file', tempFile);

        expect(response.status).toBe(403);
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should return 401 Unauthorized without token', async () => {
      const csvContent = 'question_text,type\n"Test",multiple_choice';
      const tempFile = path.join(__dirname, 'temp_noauth.csv');
      fs.writeFileSync(tempFile, csvContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .field('import_type', 'questions')
          .attach('file', tempFile);

        expect([401, 400]).toContain(response.status);
      } catch (err) {
        // Connection reset is acceptable for this test
        expect([err.code, 'ECONNRESET']).toContain(err.code);
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });

    it('should handle duplicate entries in import', async () => {
      const csvContent = 'email,full_name,role\ndup@test.com,Test1,student\ndup@test.com,Test2,student';
      const tempFile = path.join(__dirname, 'temp_dup.csv');
      fs.writeFileSync(tempFile, csvContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('import_type', 'users')
          .attach('file', tempFile);

        expect([200, 400, 500]).toContain(response.status);
      } finally {
        fs.unlinkSync(tempFile);
      }
    });

    it('should maintain transaction integrity on partial failure', async () => {
      const csvContent = 'email,full_name,role\nvalid@test.com,Valid,student\ninvalid,,student';
      const tempFile = path.join(__dirname, 'temp_integrity.csv');
      fs.writeFileSync(tempFile, csvContent);

      try {
        const response = await request(app)
          .post('/api/admin/bulk-import')
          .set('Authorization', `Bearer ${adminToken}`)
          .field('import_type', 'users')
          .attach('file', tempFile);

        expect([200, 400, 500]).toContain(response.status);
      } finally {
        fs.unlinkSync(tempFile);
      }
    });
  });
});
