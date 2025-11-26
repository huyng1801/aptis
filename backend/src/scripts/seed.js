const { 
  User, Skill, Level, Question, Exam, ExamQuestion, 
  ExamAttempt, AttemptAnswer, PracticeSession, AIScoringRubric 
} = require('../models');
const sequelize = require('../models').sequelize;
const bcrypt = require('bcryptjs');
const { REAL_APTIS_QUESTIONS } = require('../data/realAptisQuestions');

// Helper function to hash password
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Main seed function
async function seed() {
  try {
    console.log('\n📊 APTIS Comprehensive Seed Started...\n');

    // 1. Create Skills (APTIS Standard Format)
    console.log('📝 Creating Skills...');
    const skills = await Skill.bulkCreate([
      { 
        id: 1,
        name: 'Grammar & Vocabulary', 
        description: 'Grammar and Vocabulary component - 50 questions, 25 minutes' 
      },
      { 
        id: 2,
        name: 'Listening', 
        description: 'Listening component - 25 questions, 4 parts, 40 minutes' 
      },
      { 
        id: 3,
        name: 'Reading', 
        description: 'Reading component - 25 questions, 4 parts, 35 minutes' 
      },
      { 
        id: 4,
        name: 'Writing', 
        description: 'Writing component - 4 parts, 50 minutes' 
      },
      { 
        id: 5,
        name: 'Speaking', 
        description: 'Speaking component - 4 parts, 12 minutes' 
      }
    ], { ignoreDuplicates: true });
    console.log('✅ Created 5 APTIS skills');

    // Extract skill references for easy access
    const grammarVocabSkill = skills.find(s => s.name === 'Grammar & Vocabulary');
    const listeningSkill = skills.find(s => s.name === 'Listening');
    const readingSkill = skills.find(s => s.name === 'Reading');
    const writingSkill = skills.find(s => s.name === 'Writing');
    const speakingSkill = skills.find(s => s.name === 'Speaking');

    // 2. Create Levels (CEFR Standard)
    console.log('📝 Creating Levels...');
    const levels = await Level.bulkCreate([
      { 
        id: 1,
        name: 'A1', 
        description: 'Beginner - Can understand basic phrases and expressions',
        level_value: 1,
        order_number: 1,
        cefr_description: 'Basic user'
      },
      { 
        id: 2,
        name: 'A2', 
        description: 'Elementary - Can communicate in simple routine tasks',
        level_value: 2,
        order_number: 2,
        cefr_description: 'Basic user'
      },
      { 
        id: 3,
        name: 'B1', 
        description: 'Intermediate - Can handle main points on familiar topics',
        level_value: 3,
        order_number: 3,
        cefr_description: 'Independent user'
      },
      { 
        id: 4,
        name: 'B2', 
        description: 'Upper Intermediate - Can understand complex texts',
        level_value: 4,
        order_number: 4,
        cefr_description: 'Independent user'
      },
      { 
        id: 5,
        name: 'C1', 
        description: 'Advanced - Can use language flexibly and effectively',
        level_value: 5,
        order_number: 5,
        cefr_description: 'Proficient user'
      },
      { 
        id: 6,
        name: 'C2', 
        description: 'Mastery - Near-native proficiency',
        level_value: 6,
        order_number: 6,
        cefr_description: 'Proficient user'
      }
    ], { ignoreDuplicates: true });
    console.log('✅ Created 6 CEFR levels');

    // Extract level references for easy access
    const a1Level = levels.find(l => l.name === 'A1');
    const a2Level = levels.find(l => l.name === 'A2');
    const b1Level = levels.find(l => l.name === 'B1');
    const b2Level = levels.find(l => l.name === 'B2');
    const c1Level = levels.find(l => l.name === 'C1');
    const c2Level = levels.find(l => l.name === 'C2');

    // 3. Create Users
    console.log('📝 Creating Users...');
    const hashedAdminPass = await hashPassword('Admin@123');
    const hashedTeacherPass = await hashPassword('Teacher@123');
    const hashedStudentPass = await hashPassword('Student@123');

    const users = await User.bulkCreate([
      {
        email: 'admin@aptis.com',
        password_hash: hashedAdminPass,
        full_name: 'System Admin',
        role: 'admin',
        is_active: true,
        email_verified: true
      },
      {
        email: 'teacher@aptis.com',
        password_hash: hashedTeacherPass,
        full_name: 'John Teacher',
        role: 'teacher',
        is_active: true,
        email_verified: true
      },
      {
        email: 'teacher2@aptis.com',
        password_hash: hashedTeacherPass,
        full_name: 'Sarah Instructor',
        role: 'teacher',
        is_active: true,
        email_verified: true
      },
      {
        email: 'student@aptis.com',
        password_hash: hashedStudentPass,
        full_name: 'Alice Student',
        role: 'student',
        is_active: true,
        email_verified: true
      },
      {
        email: 'student2@aptis.com',
        password_hash: hashedStudentPass,
        full_name: 'Bob Learner',
        role: 'student',
        is_active: true,
        email_verified: true
      },
      {
        email: 'student3@aptis.com',
        password_hash: hashedStudentPass,
        full_name: 'Carol Student',
        role: 'student',
        is_active: true,
        email_verified: true
      }
    ], { ignoreDuplicates: true });
    console.log('✅ Created 6 users (1 admin, 2 teachers, 3 students)');

    // Extract user references for easy access
    const teacher = users.find(u => u.email === 'teacher@aptis.com');

    // 4. Create AI Scoring Rubrics
    console.log('📝 Creating AI Scoring Rubrics...');
    
    // Writing Rubrics
    await AIScoringRubric.bulkCreate([
      {
        skill_id: writingSkill.id,
        criteria_name: 'Task Achievement',
        weight: 25,
        description: 'Response fully addresses the task with relevant main ideas and supporting details'
      },
      {
        skill_id: writingSkill.id,
        criteria_name: 'Coherence and Cohesion',
        weight: 25,
        description: 'Ideas are organized logically with clear progression and appropriate linking'
      },
      {
        skill_id: writingSkill.id,
        criteria_name: 'Lexical Resource',
        weight: 25,
        description: 'Uses varied vocabulary appropriately and accurately for the task'
      },
      {
        skill_id: writingSkill.id,
        criteria_name: 'Grammatical Range and Accuracy',
        weight: 25,
        description: 'Uses a range of grammatical structures accurately and appropriately'
      }
    ], { ignoreDuplicates: true });

    // Speaking Rubrics
    await AIScoringRubric.bulkCreate([
      {
        skill_id: speakingSkill.id,
        criteria_name: 'Fluency and Coherence',
        weight: 30,
        description: 'Speaks with clear pronunciation and natural flow without excessive pausing'
      },
      {
        skill_id: speakingSkill.id,
        criteria_name: 'Lexical Resource',
        weight: 25,
        description: 'Uses vocabulary accurately and flexibly with appropriate word choices'
      },
      {
        skill_id: speakingSkill.id,
        criteria_name: 'Grammatical Range and Accuracy',
        weight: 25,
        description: 'Uses varied grammatical structures with control and flexibility'
      },
      {
        skill_id: speakingSkill.id,
        criteria_name: 'Pronunciation',
        weight: 20,
        description: 'Uses English phonemes appropriately with stress and intonation for clarity'
      }
    ], { ignoreDuplicates: true });

    console.log('✅ Created AI Scoring Rubrics');

    // 5. Create APTIS Questions (Real Test Format)
    console.log('📝 Creating Real APTIS Questions...');
    
    // Helper function to create questions with proper skill and level references
    const createQuestionsWithSkillId = (questionArray, skillName) => {
      const skill = skills.find(s => s.name === skillName);
      return questionArray.map(q => {
        // Find level by name (A1, A2, B1, B2, C1, C2)
        const level = levels.find(l => l.name === q.level) || b2Level;
        return {
          skill_id: skill.id,
          level_id: level.id,
          type: q.type,
          question_text: q.question_text,
          options: q.options ? JSON.stringify(q.options) : null,
          correct_answer: q.correct_answer || null,
          points: q.points || 1,
          media_url: q.media_url || null,
          passage_id: q.passage_id || null,
          part_number: q.part_number || null,
          passage_text: q.passage_text || null,
          time_limit_seconds: q.time_limit_seconds || null,
          created_by: teacher.id
        };
      });
    };

    // All Real APTIS Questions
    let allQuestions = [];
    
    // Grammar & Vocabulary Questions (50 questions, 25 minutes)
    console.log('  📚 Adding Grammar & Vocabulary questions...');
    allQuestions.push(...createQuestionsWithSkillId(REAL_APTIS_QUESTIONS.GRAMMAR_VOCABULARY, 'Grammar & Vocabulary'));
    
    // Listening Questions (25 questions, 4 parts, 40 minutes)
    console.log('  🎧 Adding Listening questions...');  
    allQuestions.push(...createQuestionsWithSkillId(REAL_APTIS_QUESTIONS.LISTENING, 'Listening'));
    
    // Reading Questions (25 questions, 4 parts, 35 minutes)
    console.log('  📖 Adding Reading questions...');
    allQuestions.push(...createQuestionsWithSkillId(REAL_APTIS_QUESTIONS.READING, 'Reading'));
    
    // Writing Questions (4 parts, 50 minutes)
    console.log('  ✍️ Adding Writing questions...');
    allQuestions.push(...createQuestionsWithSkillId(REAL_APTIS_QUESTIONS.WRITING, 'Writing'));
    
    // Speaking Questions (4 parts, 12 minutes)
    console.log('  🎤 Adding Speaking questions...');
    allQuestions.push(...createQuestionsWithSkillId(REAL_APTIS_QUESTIONS.SPEAKING, 'Speaking'));

    // Create all questions
    await Question.bulkCreate(allQuestions);
    console.log(`✅ Created ${allQuestions.length} Real APTIS Questions`);
    console.log(`✅ Created ${allQuestions.length} Real APTIS Questions`);

    // 6. Create Exams
    console.log('📝 Creating Exams...');
    const exams = await Exam.bulkCreate([
      {
        title: 'APTIS General - Practice Test 1',
        description: 'Complete APTIS General exam: Grammar & Vocabulary (50q, 25min), Listening (25q, 40min), Reading (25q, 35min), Writing (4 parts, 50min), Speaking (4 parts, 12min)',
        level_id: b2Level.id,
        duration_minutes: 162, // Total: 25+40+35+50+12 = 162 minutes
        total_points: 100,
        is_published: true,
        created_by: teacher.id
      },
      {
        title: 'APTIS General - Practice Test 2', 
        description: 'Complete APTIS General exam with alternative question set',
        level_id: b2Level.id,
        duration_minutes: 162,
        total_points: 100,
        is_published: true,
        created_by: teacher.id
      },
      {
        title: 'APTIS Advanced - Practice Test 1',
        description: 'APTIS Advanced level exam for C1 proficiency',
        level_id: c1Level.id,
        duration_minutes: 162,
        total_points: 100,
        is_published: true,
        created_by: teacher.id
      }
    ], { ignoreDuplicates: true });
    console.log(`✅ Created ${exams.length} exams`);

    // 7. Get created questions for exam association  
    console.log('📝 Getting created questions for exam association...');
    const createdQuestions = await Question.findAll();
    
    // Group questions by skill ID
    const questionsBySkillId = {
      1: createdQuestions.filter(q => q.skill_id === 1), // Grammar & Vocabulary
      2: createdQuestions.filter(q => q.skill_id === 2), // Listening
      3: createdQuestions.filter(q => q.skill_id === 3), // Reading
      4: createdQuestions.filter(q => q.skill_id === 4), // Writing
      5: createdQuestions.filter(q => q.skill_id === 5)  // Speaking
    };
    
    // For each exam, associate questions from all 5 skills
    for (let examIndex = 0; examIndex < exams.length; examIndex++) {
      const exam = exams[examIndex];
      let orderNumber = 1;
      
      // Add questions from each skill to create complete APTIS exam
      const examQuestions = [
        ...questionsBySkillId[1].slice(0, 10), // 10 Grammar & Vocabulary questions
        ...questionsBySkillId[2].slice(0, 5),  // 5 Listening questions
        ...questionsBySkillId[3].slice(0, 5),  // 5 Reading questions
        ...questionsBySkillId[4].slice(0, 2),  // 2 Writing tasks
        ...questionsBySkillId[5].slice(0, 2)   // 2 Speaking tasks
      ];
      
      for (const question of examQuestions) {
        await ExamQuestion.findOrCreate({
          where: {
            exam_id: exam.id,
            question_id: question.id
          },
          defaults: {
            order_number: orderNumber++,
            points_override: question.points
          }
        });
      }
    }
    console.log('✅ Associated questions with exams');

    // 8. Create Exam Attempts (Practice data for students)
    console.log('📝 Creating Exam Attempts...');
    const student1 = users.find(u => u.email === 'student@aptis.com');
    const student2 = users.find(u => u.email === 'student2@aptis.com');

    const attempts = await ExamAttempt.bulkCreate([
      {
        exam_id: exams[0].id,
        user_id: student1.id,
        start_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        end_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
        status: 'submitted',
        total_score: 75
      },
      {
        exam_id: exams[1].id,
        user_id: student1.id,
        start_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        end_time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 120 * 60 * 1000),
        status: 'submitted',
        total_score: 82
      },
      {
        exam_id: exams[0].id,
        user_id: student2.id,
        start_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        end_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 65 * 60 * 1000),
        status: 'submitted',
        total_score: 68
      }
    ], { ignoreDuplicates: true });
    console.log(`✅ Created ${attempts.length} exam attempts`);

    // 9. Create Attempt Answers
    console.log('📝 Creating Attempt Answers...');
    
    // Create sample answers for first attempt
    const answers = [];
    const firstAttempt = attempts[0];
    
    // Get first 5 questions for sample answers
    const sampleQuestions = createdQuestions.slice(0, 5);
    
    for (let i = 0; i < sampleQuestions.length; i++) {
      const question = sampleQuestions[i];
      answers.push({
        attempt_id: firstAttempt.id,
        question_id: question.id,
        answer_text: `Student answer for APTIS question ${i + 1}`,
        is_correct: i % 2 === 0,
        score: i % 2 === 0 ? 5 : 3
      });
    }

    if (answers.length > 0) {
      await AttemptAnswer.bulkCreate(answers, { ignoreDuplicates: true });
    }
    console.log(`✅ Created ${answers.length} attempt answers`);

    // 10. Create Practice Sessions
    console.log('📝 Creating Practice Sessions...');
    const practiceSessions = await PracticeSession.bulkCreate([
      {
        user_id: users.find(u => u.email === 'student@aptis.com').id,
        skill_id: skills.find(s => s.name === 'Reading').id,
        level_id: b1Level.id,
        questions_answered: 10,
        correct_answers: 8
      },
      {
        user_id: users.find(u => u.email === 'student@aptis.com').id,
        skill_id: skills.find(s => s.name === 'Writing').id,
        level_id: b2Level.id,
        questions_answered: 5,
        correct_answers: 4
      },
      {
        user_id: users.find(u => u.email === 'student2@aptis.com').id,
        skill_id: skills.find(s => s.name === 'Listening').id,
        level_id: b1Level.id,
        questions_answered: 8,
        correct_answers: 6
      }
    ], { ignoreDuplicates: true });
    console.log(`✅ Created ${practiceSessions.length} practice sessions`);

    console.log('\n' + '='.repeat(50));
    console.log('✅ APTIS SEED COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📊 Summary:');
    console.log('  • 5 Skills (Grammar & Vocabulary, Listening, Reading, Writing, Speaking)');
    console.log('  • 6 Levels (A1-C2 with CEFR descriptions)');
    console.log('  • 6 Users (1 admin, 2 teachers, 3 students)');
    console.log('  • 8 AI Scoring Rubrics');
    console.log(`  • ${allQuestions.length} APTIS Questions (realistic format)`);
    console.log(`  • ${exams.length} Complete APTIS Exams (162 min duration)`);
    console.log(`  • ${attempts.length} Exam Attempts`);
    console.log(`  • ${answers.length} Attempt Answers`);
    console.log(`  • ${practiceSessions.length} Practice Sessions`);
    console.log('\n📋 APTIS Exam Structure:');
    console.log('  • Grammar & Vocabulary: 50 questions (25 minutes)');
    console.log('  • Listening: 25 questions (40 minutes)');  
    console.log('  • Reading: 25 questions (35 minutes)');
    console.log('  • Writing: 4 parts (50 minutes)');
    console.log('  • Speaking: 4 parts (12 minutes)');
    console.log('  • Total Duration: 162 minutes');
    console.log('\n🔑 Test Credentials:');
    console.log('  Admin:   admin@aptis.com / Admin@123');
    console.log('  Teacher: teacher@aptis.com / Teacher@123');
    console.log('  Student: student@aptis.com / Student@123');
    console.log('\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ SEED FAILED:');
    console.error(error);
    process.exit(1);
  }
}

// Run seed
if (require.main === module) {
  seed();
}

module.exports = seed;
