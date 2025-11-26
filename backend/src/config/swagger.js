const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'APTIS API Documentation',
      version: '1.0.0',
      description: 'API documentation for APTIS - English Learning Platform with AI Integration',
      contact: {
        name: 'APTIS Team',
        email: 'support@aptis.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      }
    ],
    security: [
      {
        BearerAuth: []
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            full_name: {
              type: 'string',
              description: 'User full name'
            },
            role: {
              type: 'string',
              enum: ['admin', 'teacher', 'student'],
              description: 'User role'
            },
            avatar_url: {
              type: 'string',
              nullable: true,
              description: 'URL to user avatar image'
            },
            is_active: {
              type: 'boolean',
              description: 'Whether user account is active'
            },
            email_verified: {
              type: 'boolean',
              description: 'Whether email is verified'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp'
            }
          }
        },
        Skill: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Skill ID'
            },
            name: {
              type: 'string',
              enum: ['Listening', 'Speaking', 'Reading', 'Writing'],
              description: 'Skill name'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Skill description'
            }
          }
        },
        Level: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'Level ID'
            },
            name: {
              type: 'string',
              enum: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
              description: 'CEFR level name'
            },
            description: {
              type: 'string',
              nullable: true,
              description: 'Level description'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string'
                  },
                  message: {
                    type: 'string'
                  }
                }
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication endpoints'
      },
      {
        name: 'Users',
        description: 'User profile management'
      },
      {
        name: 'Admin - User Management',
        description: 'Admin endpoints for managing users'
      },
      {
        name: 'Admin - System Management',
        description: 'Admin endpoints for system configuration and health'
      },
      {
        name: 'Questions',
        description: 'Question bank management for teachers and admins'
      },
      {
        name: 'Exams',
        description: 'Exam management for teachers and admins'
      },
      {
        name: 'Student - Exams',
        description: 'Student endpoints for browsing and viewing exams'
      },
      {
        name: 'Student - Exam Taking',
        description: 'Student endpoints for taking exams'
      },
      {
        name: 'Student - Practice',
        description: 'Student practice mode endpoints'
      },
      {
        name: 'Student - Results',
        description: 'Student exam results and history'
      },
      {
        name: 'Student - Progress',
        description: 'Student progress tracking'
      },
      {
        name: 'Student - Statistics',
        description: 'Student performance statistics'
      },
      {
        name: 'Student - Audio',
        description: 'Student audio recording and submission'
      },
      {
        name: 'Teacher/Admin - Audio Review',
        description: 'Teacher and admin audio answer review'
      },
      {
        name: 'Teacher - Review',
        description: 'Teacher review and feedback management'
      },
      {
        name: 'Admin - Reporting',
        description: 'Admin reporting and analytics endpoints'
      },
      {
        name: 'AI Scoring',
        description: 'AI-powered scoring endpoints'
      },
      {
        name: 'Rubrics',
        description: 'AI scoring rubrics management'
      }
    ]
  },
  apis: ['./src/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

