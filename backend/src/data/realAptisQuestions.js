// APTIS Real Test Structure Questions
// Based on actual APTIS exam format

const REAL_APTIS_QUESTIONS = {
  // GRAMMAR & VOCABULARY (50 questions, 25 minutes)
  GRAMMAR_VOCABULARY: [
    // Part 1: Grammar (25 questions)
    {
      part_number: 1,
      type: 'multiple_choice',
      question_text: 'I _____ to London three times this year.',
      options: ['have been', 'was', 'went', 'am going'],
      correct_answer: 'have been',
      level: 'B1',
      points: 1
    },
    {
      part_number: 1,
      type: 'multiple_choice', 
      question_text: 'If I _____ you, I would accept the job offer.',
      options: ['am', 'was', 'were', 'will be'],
      correct_answer: 'were',
      level: 'B2',
      points: 1
    },
    {
      part_number: 1,
      type: 'sentence_transformation',
      question_text: 'Complete the second sentence so that it has a similar meaning to the first sentence.\n"It\'s possible that she is at home."\nShe _____ at home.',
      correct_answer: 'might be',
      level: 'B2',
      points: 2
    },
    
    // Part 2: Vocabulary (25 questions)
    {
      part_number: 2,
      type: 'multiple_choice',
      question_text: 'The company\'s _____ approach to innovation led to breakthrough products.',
      options: ['conventional', 'traditional', 'revolutionary', 'ordinary'],
      correct_answer: 'revolutionary',
      level: 'C1',
      points: 1
    },
    {
      part_number: 2,
      type: 'word_formation',
      question_text: 'Complete the sentence with the correct form of the word in brackets.\nHer _____ (PERFORM) in the interview was outstanding.',
      correct_answer: 'performance',
      level: 'B2',
      points: 1
    }
  ],

  // LISTENING (25 questions, 40 minutes, 4 parts)
  LISTENING: [
    // Part 1: Short exchanges (5 questions)
    {
      part_number: 1,
      passage_id: 'L1_conversation1',
      type: 'listening_multiple_choice',
      media_url: '/audio/aptis/listening/part1_conv1.mp3',
      question_text: 'What time does the meeting start?',
      options: ['9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM'],
      correct_answer: '9:30 AM',
      level: 'A2',
      points: 1
    },
    {
      part_number: 1,
      passage_id: 'L1_conversation1', // Same audio
      type: 'listening_multiple_choice',
      media_url: '/audio/aptis/listening/part1_conv1.mp3',
      question_text: 'Where will they meet?',
      options: ['Conference room A', 'Main lobby', 'Coffee shop', 'Reception desk'],
      correct_answer: 'Conference room A',
      level: 'A2',
      points: 1
    },

    // Part 2: Matching (5 questions) - 1 audio, 5 questions
    {
      part_number: 2,
      passage_id: 'L2_announcements',
      type: 'listening_matching',
      media_url: '/audio/aptis/listening/part2_announcements.mp3',
      passage_text: 'You will hear 5 short announcements. Match each announcement to the correct location.',
      question_text: 'Announcement 1 - Match to location:',
      options: ['Airport', 'Train station', 'Shopping mall', 'Hospital', 'University'],
      correct_answer: 'Airport',
      level: 'B1',
      points: 1
    },

    // Part 3: Note completion (10 questions) - 1 longer audio
    {
      part_number: 3,
      passage_id: 'L3_lecture',
      type: 'listening_note_completion',
      media_url: '/audio/aptis/listening/part3_lecture.mp3',
      passage_text: 'Listen to a lecture about climate change and complete the notes.',
      question_text: 'Global temperature has risen by _____ degrees since 1900.',
      correct_answer: '1.1',
      level: 'B2',
      points: 1
    },

    // Part 4: Multiple choice (5 questions) - 1 conversation
    {
      part_number: 4,
      passage_id: 'L4_interview',
      type: 'listening_multiple_choice',
      media_url: '/audio/aptis/listening/part4_interview.mp3',
      question_text: 'What is the main reason the candidate wants to change jobs?',
      options: ['Better salary', 'Career development', 'Work-life balance', 'Company reputation'],
      correct_answer: 'Career development',
      level: 'B2',
      points: 2
    }
  ],

  // READING (25 questions, 35 minutes, 4 parts)
  READING: [
    // Part 1: Multiple choice (5 questions) - 1 text
    {
      part_number: 1,
      passage_id: 'R1_article',
      type: 'reading_multiple_choice',
      passage_text: 'Artificial Intelligence is transforming the way we work and live. From virtual assistants to autonomous vehicles, AI technology is becoming increasingly sophisticated...',
      question_text: 'According to the article, what is the main impact of AI?',
      options: ['Replacing human workers', 'Transforming work and life', 'Creating virtual assistants', 'Developing vehicles'],
      correct_answer: 'Transforming work and life',
      level: 'B1',
      points: 1
    },

    // Part 2: Gapped text (5 questions) - 1 text with missing sentences
    {
      part_number: 2,
      passage_id: 'R2_gapped',
      type: 'reading_gapped_text',
      passage_text: 'The benefits of renewable energy are becoming increasingly clear. (1) _____ Solar and wind power are now cost-competitive with fossil fuels in many regions.',
      question_text: 'Choose the sentence that best fits gap (1):',
      options: [
        'However, there are still challenges to overcome.',
        'Governments worldwide are investing heavily in clean technology.',
        'Traditional energy sources remain popular.',
        'The technology is still in development.'
      ],
      correct_answer: 'Governments worldwide are investing heavily in clean technology.',
      level: 'B2',
      points: 2
    },

    // Part 3: Matching headings (10 questions) - Multiple short texts
    {
      part_number: 3,
      passage_id: 'R3_headings',
      type: 'reading_matching',
      passage_text: 'Text A: Online learning has revolutionized education, making it accessible to millions worldwide...',
      question_text: 'Match this paragraph to the correct heading:',
      options: [
        'The future of traditional classrooms',
        'Benefits of digital education',
        'Challenges in remote learning',
        'Technology costs in schools'
      ],
      correct_answer: 'Benefits of digital education',
      level: 'B2',
      points: 1
    },

    // Part 4: True/False/Not Given (5 questions) - 1 longer text
    {
      part_number: 4,
      passage_id: 'R4_scientific',
      type: 'reading_true_false',
      passage_text: 'Recent research from Cambridge University suggests that regular exercise can improve cognitive function in older adults. The study followed 500 participants over two years...',
      question_text: 'The study involved participants from different age groups.',
      correct_answer: 'False',
      level: 'B2',
      points: 1
    }
  ],

  // WRITING (4 tasks, 50 minutes total)
  WRITING: [
    // Part 1: Short message (5 minutes, 20-30 words)
    {
      part_number: 1,
      type: 'short_message',
      question_text: 'You want to meet your friend for coffee tomorrow. Write a short message to your friend. (20-30 words)',
      time_limit_seconds: 300,
      level: 'A2',
      points: 5
    },

    // Part 2: Informal email (10 minutes, 30-40 words) 
    {
      part_number: 2,
      type: 'informal_email',
      question_text: 'You received a birthday invitation from your colleague. Write an email accepting the invitation. (30-40 words)',
      time_limit_seconds: 600,
      level: 'B1',
      points: 10
    },

    // Part 3: Formal email (20 minutes, 120-150 words)
    {
      part_number: 3,
      type: 'formal_email',
      question_text: 'Write an email to your manager requesting time off for a family event. Explain the reason and suggest how to cover your responsibilities. (120-150 words)',
      time_limit_seconds: 1200,
      level: 'B2',
      points: 15
    },

    // Part 4: Opinion essay (15 minutes, 150+ words)
    {
      part_number: 4,
      type: 'essay_opinion',
      question_text: 'Some people think social media has more negative effects than positive ones. Do you agree or disagree? Give reasons and examples. (150+ words)',
      time_limit_seconds: 900,
      level: 'B2',
      points: 20
    }
  ],

  // SPEAKING (4 parts, 12 minutes total)
  SPEAKING: [
    // Part 1: Personal information (3 minutes)
    {
      part_number: 1,
      type: 'personal_information',
      question_text: 'Tell me about yourself and your hometown. What do you like most about where you live?',
      time_limit_seconds: 30,
      level: 'A2',
      points: 5
    },

    // Part 2: Describe, express opinion (2 minutes)
    {
      part_number: 2,
      type: 'describing_photo',
      question_text: 'Look at the photograph. Describe what you can see and say what you think the people are doing.',
      media_url: '/images/aptis/speaking/part2_photo1.jpg',
      time_limit_seconds: 45,
      level: 'B1',
      points: 10
    },

    // Part 3: Compare and provide reasons (3 minutes)
    {
      part_number: 3,
      type: 'comparing_situations',
      question_text: 'Look at the two pictures. Compare them and say which situation you would prefer and why.',
      media_url: '/images/aptis/speaking/part3_comparison.jpg',
      time_limit_seconds: 90,
      level: 'B2',
      points: 15
    },

    // Part 4: Discussion (4 minutes)
    {
      part_number: 4,
      type: 'discussion_topic',
      question_text: 'Do you think technology is making people more or less social? Discuss your opinion with examples from your own experience.',
      time_limit_seconds: 120,
      level: 'B2',
      points: 20
    }
  ]
};

// Helper function to create questions with skill assignment
function createQuestionsWithSkillId(questions, skillName) {
  return questions.map(q => ({
    ...q,
    skill_name: skillName
  }));
}

module.exports = {
  REAL_APTIS_QUESTIONS,
  createQuestionsWithSkillId
};