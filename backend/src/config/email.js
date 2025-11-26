require('dotenv').config();

module.exports = {
  smtp: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  },
  from: process.env.EMAIL_FROM || 'noreply@aptis.com',
  frontendUrls: {
    admin: process.env.FRONTEND_ADMIN_URL,
    student: process.env.FRONTEND_STUDENT_URL
  }
};
