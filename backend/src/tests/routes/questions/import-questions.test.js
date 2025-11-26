const request = require('supertest');
const app = require('../../../server');

describe('Question Routes - /api/questions/import (POST IMPORT)', () => {
  let teacherUser, teacherToken;
  let adminToken;
  let studentToken;
  let testLevel;
  let testSkill;

  beforeEach(async () => {
    teacherUser = await testHelpers.createTestUser('teacher');
    teacherToken = testHelpers.getAuthToken(teacherUser);
    
    const adminUser = await testHelpers.createTestUser('admin');
    adminToken = testHelpers.getAuthToken(adminUser);

    const studentUser = await testHelpers.createTestUser('student');
    studentToken = testHelpers.getAuthToken(studentUser);

    testLevel = await testHelpers.getTestLevel();
    testSkill = await testHelpers.getTestSkill();
  });

  describe('POST /api/questions/import', () => {
    it('should import single question successfully as teacher', async () => {
      const importData = {
        questions: [
          {
            skill_id: testSkill.id,
            level_id: testLevel.id,
            type: 'multiple_choice',
            question_text: 'Imported question text',
            options: ['Option A', 'Option B', 'Option C', 'Option D'],
            correct_answer: 'A',
            points: 1.0,
            explanation: 'This is the explanation'
          }
        ]
      };

      const response = await request(app)
        .post('/api/questions/import')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(importData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('created');
      expect(response.body.data.created).toBeGreaterThan(0);
    });

    it('should import multiple questions successfully', async () => {
      const importData = {
        questions: [
          {
            skill_id: testSkill.id,
            level_id: testLevel.id,
            type: 'multiple_choice',
            question_text: 'Question 1',
            options: ['A', 'B', 'C', 'D'],
            correct_answer: 'A',
            points: 1.0
          },
          {
            skill_id: testSkill.id,
            level_id: testLevel.id,
            type: 'reading_true_false',
            question_text: 'Question 2',
            correct_answer: 'True',
            points: 1.0
          },
          {
            skill_id: testSkill.id,
            level_id: testLevel.id,
            type: 'listening_form_filling',
            question_text: 'Question 3: The capital of France is ___',
            correct_answer: 'Paris',
            points: 1.0
          }
        ]
      };

      const response = await request(app)
        .post('/api/questions/import')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(importData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.created).toBeGreaterThan(0);
    });

    it('should import questions as admin', async () => {
      const importData = {
        questions: [
          {
            skill_id: testSkill.id,
            level_id: testLevel.id,
            type: 'multiple_choice',
            question_text: 'Admin imported question',
            correct_answer: 'A',
            points: 1.0
          }
        ]
      };

      const response = await request(app)
        .post('/api/questions/import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(importData)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('should return 403 for students', async () => {
      const response = await request(app)
        .post('/api/questions/import')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ questions: [] })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/questions/import')
        .send({ questions: [] })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing questions array', async () => {
      const response = await request(app)
        .post('/api/questions/import')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should return 400 for empty questions array', async () => {
      const response = await request(app)
        .post('/api/questions/import')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ questions: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate required fields for each question', async () => {
      const importData = {
        questions: [
          {
            skill_id: testSkill.id,
            // Missing level_id
            type: 'multiple_choice',
            question_text: 'Question'
          }
        ]
      };

      const response = await request(app)
        .post('/api/questions/import')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(importData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle partial import with errors', async () => {
      const importData = {
        questions: [
          {
            skill_id: testSkill.id,
            level_id: testLevel.id,
            type: 'multiple_choice',
            question_text: 'Valid question',
            correct_answer: 'A',
            points: 1.0
          },
          {
            skill_id: testSkill.id,
            // Missing level_id
            type: 'reading_true_false',
            question_text: 'Invalid question'
          }
        ]
      };

      const response = await request(app)
        .post('/api/questions/import')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(importData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should import questions with different types', async () => {
      const importData = {
        questions: [
          {
            skill_id: testSkill.id,
            level_id: testLevel.id,
            type: 'multiple_choice',
            question_text: 'MC Question',
            correct_answer: 'A'
          },
          {
            skill_id: testSkill.id,
            level_id: testLevel.id,
            type: 'reading_true_false',
            question_text: 'TF Question',
            correct_answer: 'True'
          },
          {
            skill_id: testSkill.id,
            level_id: testLevel.id,
            type: 'short_message',
            question_text: 'SA Question',
            correct_answer: 'answer'
          },
          {
            skill_id: testSkill.id,
            level_id: testLevel.id,
            type: 'essay_opinion',
            question_text: 'Essay Question'
          }
        ]
      };

      const response = await request(app)
        .post('/api/questions/import')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(importData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.created).toBeGreaterThan(0);
    });

    it('should import questions with optional fields', async () => {
      const importData = {
        questions: [
          {
            skill_id: testSkill.id,
            level_id: testLevel.id,
            type: 'multiple_choice',
            question_text: 'Question with extras',
            options: ['A', 'B', 'C', 'D'],
            correct_answer: 'A',
            points: 2.5,
            explanation: 'Detailed explanation',
            media_url: 'https://example.com/image.jpg'
          }
        ]
      };

      const response = await request(app)
        .post('/api/questions/import')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(importData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.created).toBe(1);
    });

    it('should return import statistics', async () => {
      const importData = {
        questions: [
          {
            skill_id: testSkill.id,
            level_id: testLevel.id,
            type: 'multiple_choice',
            question_text: 'Q1',
            correct_answer: 'A'
          },
          {
            skill_id: testSkill.id,
            level_id: testLevel.id,
            type: 'multiple_choice',
            question_text: 'Q2',
            correct_answer: 'B'
          }
        ]
      };

      const response = await request(app)
        .post('/api/questions/import')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send(importData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('created');
      expect(response.body.data.created).toBe(2);
    });
  });
});
