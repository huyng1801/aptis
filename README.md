# APTIS - Hệ Thống Học và Thi Tiếng Anh Trực Tuyến

## Giới Thiệu

APTIS là một nền tảng học và thi tiếng Anh trực tuyến hiện đại, tích hợp trí tuệ nhân tạo Google Gemini AI để tự động chấm điểm và đưa ra phản hồi chi tiết cho người học. Hệ thống hỗ trợ đầy đủ 4 kỹ năng: Nghe (Listening), Nói (Speaking), Đọc (Reading), và Viết (Writing).

## Công Nghệ Sử Dụng

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MySQL** - Cơ sở dữ liệu quan hệ
- **Sequelize** - ORM (Object-Relational Mapping)
- **JWT** - Xác thực và phân quyền
- **Multer** - Upload file (audio, images)
- **Google Gemini AI API** - Chấm điểm và feedback tự động

### Frontend
- **Next.js** - React framework
- **Material-UI (MUI)** - Component library
- **Vite** - Build tool
- **Axios** - HTTP client
- **React Query** - Data fetching và caching
- **Zustand/Redux** - State management

## Kiến Trúc Hệ Thống

```
aptis/
├── backend/                 # Backend API
│   ├── src/
│   │   ├── config/         # Cấu hình database, JWT, AI
│   │   ├── models/         # Database models
│   │   ├── controllers/    # Business logic
│   │   ├── routes/         # API routes
│   │   ├── middlewares/    # Authentication, validation
│   │   ├── services/       # AI integration, scoring
│   │   └── utils/          # Helper functions
│   └── package.json
│
├── frontend-admin/         # Admin & Giảng viên portal
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Next.js pages
│   │   ├── services/       # API calls
│   │   ├── hooks/          # Custom hooks
│   │   └── utils/          # Utilities
│   └── package.json
│
└── frontend-student/       # Học viên portal
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── utils/
    └── package.json
```

---

## PHẦN 1 - BACKEND CORE (ExpressJS + MySQL)

### Mô Tả
Xây dựng nền tảng backend cơ bản với các chức năng quản lý người dùng, xác thực, và cấu trúc dữ liệu.

### Chức Năng Chính

#### 1.1 Quản Lý Người Dùng & Xác Thực
- **Đăng ký tài khoản**
  - Validation email, password
  - Hash password (bcrypt)
  - Gửi email xác thực
  
- **Đăng nhập**
  - JWT token generation
  - Refresh token mechanism
  - Session management
  
- **Quản lý Profile**
  - Cập nhật thông tin cá nhân
  - Upload avatar
  - Đổi mật khẩu
  
- **Phân quyền (Role-Based Access Control)**
  - Admin: Toàn quyền hệ thống
  - Giảng viên: Quản lý câu hỏi, bài thi
  - Học viên: Làm bài thi, xem kết quả

#### 1.2 Database Schema

**Users Table**
```sql
- id (PK)
- email (unique)
- password_hash
- full_name
- role (enum: admin, teacher, student)
- avatar_url
- created_at, updated_at
```

**Skills Table**
```sql
- id (PK)
- name (Listening, Speaking, Reading, Writing)
- description
```

**Levels Table**
```sql
- id (PK)
- name (A1, A2, B1, B2, C1, C2)
- description
```

#### 1.3 API Endpoints

```
Authentication:
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh-token
POST   /api/auth/forgot-password
POST   /api/auth/reset-password

Users:
GET    /api/users/profile
PUT    /api/users/profile
PUT    /api/users/password
POST   /api/users/avatar

Admin - User Management:
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
```

## PHẦN 2 - BACKEND NÂNG CAO (Chức Năng Học & Thi)

### Mô Tả
Phát triển các chức năng core về quản lý câu hỏi, bài thi, và quy trình làm bài.

### Chức Năng Chính

#### 2.1 Quản Lý Ngân Hàng Câu Hỏi (Question Bank)

**Các loại câu hỏi:**
- **Reading**: Multiple choice, True/False, Fill in the blanks
- **Listening**: Multiple choice, Note completion (với file audio)
- **Writing**: Short answer, Essay (yêu cầu AI chấm)
- **Speaking**: Mô tả ảnh, Trả lời câu hỏi (yêu cầu AI chấm)

**Questions Table**
```sql
- id (PK)
- skill_id (FK)
- level_id (FK)
- type (multiple_choice, essay, audio_response, etc.)
- question_text
- media_url (audio/image URL)
- options (JSON for multiple choice)
- correct_answer
- points
- created_by (FK to Users)
- created_at, updated_at
```

**API Endpoints:**
```
Questions Management (Teacher):
GET    /api/questions
POST   /api/questions
PUT    /api/questions/:id
DELETE /api/questions/:id
GET    /api/questions/filter?skill=&level=

Question Import/Export:
POST   /api/questions/import (CSV/Excel)
GET    /api/questions/export
```

#### 2.2 Quản Lý Bài Thi

**Exams Table**
```sql
- id (PK)
- title
- description
- level_id (FK)
- duration_minutes
- total_points
- is_published (boolean)
- created_by (FK)
- created_at, updated_at
```

**Exam_Questions Table** (Many-to-Many)
```sql
- exam_id (FK)
- question_id (FK)
- order_number
- points_override
```

**API Endpoints:**
```
Exams Management (Teacher):
GET    /api/exams
POST   /api/exams
PUT    /api/exams/:id
DELETE /api/exams/:id
POST   /api/exams/:id/questions (Add questions to exam)
PUT    /api/exams/:id/publish

Exams for Students:
GET    /api/student/exams (Browse available exams)
GET    /api/student/exams/:id (Get exam details)
```

#### 2.3 Quy Trình Làm Bài & Nộp Bài

**Exam_Attempts Table**
```sql
- id (PK)
- exam_id (FK)
- user_id (FK)
- start_time
- end_time
- status (in_progress, submitted, graded)
- total_score
- created_at
```

**Attempt_Answers Table**
```sql
- id (PK)
- attempt_id (FK)
- question_id (FK)
- answer_text
- audio_url (for speaking)
- is_correct (boolean, NULL for essay/speaking)
- score
- ai_feedback (JSON)
```

**API Endpoints:**
```
Exam Taking:
POST   /api/student/exams/:id/start (Start new attempt)
GET    /api/student/attempts/:id (Get current attempt)
POST   /api/student/attempts/:id/answers (Save answer)
POST   /api/student/attempts/:id/submit (Submit exam)

Progress Tracking:
GET    /api/student/attempts/:id/progress
POST   /api/student/attempts/:id/auto-save
```

#### 2.4 Ôn Tập Theo Kỹ Năng

**Practice_Sessions Table**
```sql
- id (PK)
- user_id (FK)
- skill_id (FK)
- level_id (FK)
- questions_answered
- correct_answers
- session_date
```

**API Endpoints:**
```
Practice Mode:
POST   /api/student/practice/start
GET    /api/student/practice/questions?skill=&level=
POST   /api/student/practice/answer
GET    /api/student/practice/history
```

#### 2.5 Xem Lịch Sử & Kết Quả

**API Endpoints:**
```
Results & History:
GET    /api/student/results (All exam results)
GET    /api/student/results/:attemptId (Detailed result)
GET    /api/student/progress (Overall progress dashboard)
GET    /api/student/statistics?skill=&period=
```

## PHẦN 3 - TÍCH HỢP API AI GEMINI (Feedback & Scoring)

### Mô Tả
Sử dụng Google Gemini AI để tự động chấm điểm và đưa ra phản hồi chi tiết cho bài Writing và Speaking.

### Chức Năng Chính

#### 3.1 Cấu Hình AI Service

**AI_Scoring_Rubrics Table**
```sql
- id (PK)
- skill_id (FK)
- criteria_name (grammar, vocabulary, fluency, etc.)
- max_score
- description
- ai_prompt_template
- created_by (FK)
```

**Tiêu chí chấm điểm:**

**Writing:**
- Task Achievement (25%)
- Coherence and Cohesion (25%)
- Lexical Resource (Vocabulary) (25%)
- Grammatical Range and Accuracy (25%)

**Speaking:**
- Pronunciation (20%)
- Fluency and Coherence (30%)
- Lexical Resource (25%)
- Grammatical Range and Accuracy (25%)

#### 3.2 AI Scoring Service

**Workflow:**
1. Học viên nộp bài Writing (text) hoặc Speaking (audio URL)
2. Backend gửi request đến Gemini AI với:
   - Câu hỏi gốc
   - Câu trả lời của học viên
   - Rubric chấm điểm
   - Context (level, skill type)
3. Gemini AI phân tích và trả về:
   - Điểm số cho từng tiêu chí
   - Feedback chi tiết
   - Gợi ý cải thiện
   - Highlight lỗi (nếu có)
4. Lưu kết quả vào database


## PHẦN 4 - FRONTEND ADMIN & GIẢNG VIÊN (Next.js + MUI + Vite)

### Mô Tả
Xây dựng giao diện quản trị cho Admin và Giảng viên với các công cụ quản lý mạnh mẽ.

### Chức Năng Chính

#### 4.1 Dashboard

**Admin Dashboard:**
- Tổng quan hệ thống (users, exams, submissions)
- Biểu đồ thống kê theo thời gian
- Activity logs
- System health monitoring

**Teacher Dashboard:**
- Số lượng câu hỏi đã tạo
- Bài thi đang active
- Bài nộp chờ review
- Thống kê điểm số học viên

#### 4.2 Quản Lý Người Dùng (Admin)

**Chức năng:**
- Danh sách người dùng (table với pagination, filter)
- Tạo/Sửa/Xóa người dùng
- Phân quyền (role assignment)
- Tìm kiếm nâng cao
- Export danh sách (CSV, Excel)

**Components:**
```
/components/admin/
  ├── UserTable.jsx
  ├── UserForm.jsx
  ├── UserFilters.jsx
  └── RoleManagement.jsx
```

#### 4.3 Quản Lý Ngân Hàng Câu Hỏi (Teacher)

**Chức năng:**
- CRUD questions với rich text editor
- Upload media (images, audio files)
- Preview câu hỏi
- Tag và categorize questions
- Bulk import từ Excel/CSV
- Question bank với search và filter

**Components:**
```
/components/teacher/questions/
  ├── QuestionList.jsx
  ├── QuestionEditor.jsx
  ├── MediaUploader.jsx
  ├── QuestionPreview.jsx
  ├── BulkImport.jsx
  └── QuestionFilters.jsx
```

**Question Editor Features:**
- Rich text formatting (bold, italic, underline)
- Insert images, audio
- Add answer options
- Set correct answer
- Points configuration
- Difficulty level selection

#### 4.4 Quản Lý Bài Thi (Teacher)

**Chức năng:**
- Tạo bài thi mới
- Exam builder (drag-and-drop questions)
- Cấu hình bài thi:
  - Duration
  - Pass threshold
  - Randomize questions
  - Attempt limits
- Preview exam
- Publish/Unpublish exams

**Components:**
```
/components/teacher/exams/
  ├── ExamList.jsx
  ├── ExamBuilder.jsx
  ├── QuestionSelector.jsx
  ├── ExamSettings.jsx
  └── ExamPreview.jsx
```

#### 4.5 Quản Lý Rubrics & AI Settings (Teacher)

**Chức năng:**
- Định nghĩa tiêu chí chấm điểm
- Cấu hình trọng số cho từng tiêu chí
- Template prompts cho AI
- Test AI scoring với sample answers

**Components:**
```
/components/teacher/rubrics/
  ├── RubricList.jsx
  ├── RubricEditor.jsx
  ├── CriteriaConfig.jsx
  └── AIPromptTester.jsx
```

#### 4.6 Review Bài Nộp (Teacher)

**Chức năng:**
- Danh sách bài nộp cần review
- View student submission
- AI-generated feedback
- Override/Adjust scores
- Add manual comments
- Approve/Reject AI scoring

**Components:**
```
/components/teacher/review/
  ├── SubmissionQueue.jsx
  ├── SubmissionDetail.jsx
  ├── ScoreAdjustment.jsx
  ├── FeedbackEditor.jsx
  └── AudioPlayer.jsx (for speaking submissions)
```

#### 4.7 Báo Cáo & Thống Kê

**Chức năng:**
- Student performance reports
- Exam statistics (average, pass rate)
- Question difficulty analysis
- Skill-based analytics
- Export reports (PDF, Excel)

**Components:**
```
/components/reports/
  ├── PerformanceChart.jsx
  ├── SkillAnalysis.jsx
  ├── ExamStatistics.jsx
  └── ReportExporter.jsx
```

### Cấu Trúc Thư Mục

```
frontend-admin/
├── src/
│   ├── components/
│   │   ├── common/          # Shared components
│   │   ├── admin/           # Admin-specific
│   │   ├── teacher/         # Teacher-specific
│   │   └── layout/          # Layout components
│   ├── pages/
│   │   ├── admin/
│   │   │   ├── dashboard.jsx
│   │   │   ├── users.jsx
│   │   │   └── system.jsx
│   │   └── teacher/
│   │       ├── dashboard.jsx
│   │       ├── questions.jsx
│   │       ├── exams.jsx
│   │       ├── rubrics.jsx
│   │       └── review.jsx
│   ├── services/
│   │   ├── api.js           # Axios instance
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   ├── question.service.js
│   │   └── exam.service.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useQuestions.js
│   │   └── useExams.js
│   ├── store/               # State management
│   │   ├── authSlice.js
│   │   └── uiSlice.js
│   ├── utils/
│   │   ├── validators.js
│   │   └── formatters.js
│   └── styles/
│       └── theme.js         # MUI theme
├── public/
├── package.json
└── vite.config.js

## PHẦN 5 - FRONTEND HỌC VIÊN

### Mô Tả
Xây dựng giao diện thân thiện và trực quan cho học viên để làm bài thi, ôn tập và theo dõi tiến độ.

### Chức Năng Chính

#### 5.1 Landing Page & Authentication

**Chức năng:**
- Trang chủ giới thiệu
- Đăng ký/Đăng nhập
- Forgot password flow
- Social login (optional: Google, Facebook)

**Pages:**
```
/pages/
  ├── index.jsx              # Landing page
  ├── login.jsx
  ├── register.jsx
  └── forgot-password.jsx
```

#### 5.2 Student Dashboard

**Chức năng:**
- Welcome message
- Quick stats (exams taken, average score)
- Recent activities
- Recommended exams
- Progress overview

**Components:**
```
/components/student/dashboard/
  ├── StatsCard.jsx
  ├── RecentActivity.jsx
  ├── ProgressChart.jsx
  └── RecommendedExams.jsx
```

#### 5.3 Duyệt Danh Sách Bài Thi

**Chức năng:**
- Grid/List view bài thi
- Filter by level, skill
- Search functionality
- Exam preview
- Start exam button

**Components:**
```
/components/student/exams/
  ├── ExamGrid.jsx
  ├── ExamCard.jsx
  ├── ExamFilters.jsx
  └── ExamPreview.jsx
```

#### 5.4 Làm Bài Thi

**Exam Interface Features:**
- Timer countdown
- Question navigation (sidebar)
- Progress indicator
- Auto-save answers
- Flag questions for review
- Section tabs (Reading, Listening, Writing, Speaking)

**Reading Section:**
- Display passage
- Multiple choice questions
- Highlight text feature

**Listening Section:**
- Audio player controls
- Play/Pause/Replay
- Volume control
- Question display

**Writing Section:**
- Rich text editor
- Word counter
- Save draft
- Character limit indicator

**Speaking Section:**
- Audio recorder
- Record/Stop/Replay
- Countdown timer
- Upload recorded audio

**Components:**
```
/components/student/exam-taking/
  ├── ExamHeader.jsx         # Timer, submit button
  ├── QuestionNavigation.jsx
  ├── ExamContent.jsx
  ├── sections/
  │   ├── ReadingSection.jsx
  │   ├── ListeningSection.jsx
  │   ├── WritingSection.jsx
  │   └── SpeakingSection.jsx
  ├── AudioPlayer.jsx
  ├── AudioRecorder.jsx
  └── TextEditor.jsx
```

#### 5.5 Xem Kết Quả & Feedback

**Chức năng:**
- Overall score display
- Score breakdown by skill
- Detailed feedback from AI
- Correct/Incorrect answers
- Time spent on exam
- Comparison with average
- Download certificate (if passed)

**Components:**
```
/components/student/results/
  ├── ScoreCard.jsx
  ├── SkillBreakdown.jsx
  ├── AIFeedback.jsx
  ├── AnswerReview.jsx
  └── Certificate.jsx
```

#### 5.6 Ôn Tập Theo Kỹ Năng

**Chức năng:**
- Select skill (Listening, Speaking, Reading, Writing)
- Select level (A1-C2)
- Practice mode (unlimited questions)
- Instant feedback
- Track practice statistics

**Components:**
```
/components/student/practice/
  ├── SkillSelector.jsx
  ├── LevelSelector.jsx
  ├── PracticeQuestion.jsx
  ├── InstantFeedback.jsx
  └── PracticeStats.jsx
```

#### 5.7 Lịch Sử & Thống Kê

**Chức năng:**
- List of all completed exams
- Timeline view
- Score trends chart
- Skill radar chart
- Strengths and weaknesses analysis
- Download history report

**Components:**
```
/components/student/history/
  ├── ExamHistory.jsx
  ├── ScoreTrendChart.jsx
  ├── SkillRadarChart.jsx
  ├── ProgressTimeline.jsx
  └── AnalysisReport.jsx
```

#### 5.8 Profile Management

**Chức năng:**
- View/Edit personal info
- Change password
- Upload avatar
- Notification settings
- Learning preferences

**Components:**
```
/components/student/profile/
  ├── ProfileView.jsx
  ├── ProfileEdit.jsx
  ├── PasswordChange.jsx
  ├── AvatarUpload.jsx
  └── Settings.jsx
```

### Cấu Trúc Thư Mục

```
frontend-student/
├── src/
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Loading.jsx
│   │   └── student/
│   │       ├── dashboard/
│   │       ├── exams/
│   │       ├── exam-taking/
│   │       ├── results/
│   │       ├── practice/
│   │       ├── history/
│   │       └── profile/
│   ├── pages/
│   │   ├── index.jsx
│   │   ├── dashboard.jsx
│   │   ├── exams/
│   │   │   ├── index.jsx
│   │   │   └── [id]/
│   │   │       ├── take.jsx
│   │   │       └── result.jsx
│   │   ├── practice.jsx
│   │   ├── history.jsx
│   │   └── profile.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── auth.service.js
│   │   ├── exam.service.js
│   │   ├── practice.service.js
│   │   └── result.service.js
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useExam.js
│   │   ├── useAudioRecorder.js
│   │   └── useTimer.js
│   ├── store/
│   │   ├── authSlice.js
│   │   ├── examSlice.js
│   │   └── uiSlice.js
│   ├── utils/
│   │   ├── formatters.js
│   │   ├── validators.js
│   │   └── audioProcessor.js
│   └── styles/
│       ├── theme.js
│       └── globals.css
├── public/
│   ├── images/
│   └── audio/
├── package.json
└── vite.config.js
```
