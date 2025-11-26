const geminiAIService = require('./geminiAI.service');
const { AIScoringRubric, AttemptAnswer, Question, Skill, Level, ExamAttempt, User } = require('../models');

class AIScoringService {
  /**
   * Process AI scoring for an attempt answer
   * @param {number} attemptAnswerId - ID of the attempt answer
   * @returns {Object} Scoring result
   */
  async scoreAnswer(attemptAnswerId) {
    try {
      // Get attempt answer with question and user details
      const attemptAnswer = await AttemptAnswer.findByPk(attemptAnswerId, {
        include: [
          {
            model: Question,
            as: 'question',
            include: [
              { model: Skill, as: 'skill' },
              { model: Level, as: 'level' }
            ]
          },
          {
            model: ExamAttempt,
            as: 'attempt',
            include: [
              { model: User, as: 'user' }
            ]
          }
        ]
      });

      if (!attemptAnswer) {
        throw new Error('Attempt answer not found');
      }

      const question = attemptAnswer.question;
      const skill = question.skill;
      const level = question.level;
      
      // Check if this question type requires AI scoring
      if (!this.requiresAIScoring(question.type)) {
        throw new Error('Question type does not require AI scoring');
      }

      // Get scoring rubrics for this skill
      const rubrics = await AIScoringRubric.findAll({
        where: { skill_id: skill.id },
        order: [['criteria_name', 'ASC']]
      });

      if (rubrics.length === 0) {
        throw new Error(`No scoring rubrics found for skill: ${skill.name}`);
      }

      let scoringResult;
      
      if (skill.name.toLowerCase() === 'writing') {
        scoringResult = await this.scoreWritingAnswer(
          question, 
          attemptAnswer, 
          rubrics, 
          level.name
        );
      } else if (skill.name.toLowerCase() === 'speaking') {
        scoringResult = await this.scoreSpeakingAnswer(
          question, 
          attemptAnswer, 
          rubrics, 
          level.name
        );
      } else {
        throw new Error(`AI scoring not supported for skill: ${skill.name}`);
      }

      // Update attempt answer with AI feedback
      await attemptAnswer.update({
        score: scoringResult.total_score,
        ai_feedback: scoringResult,
        is_correct: scoringResult.total_score >= 60, // Pass threshold (out of 100)
        graded_by: null, // AI grading - no teacher ID
        graded_at: new Date()
      });

      return {
        success: true,
        attempt_answer_id: attemptAnswerId,
        score: scoringResult.total_score,
        feedback: scoringResult
      };

    } catch (error) {
      console.error('Error in AI scoring:', error);
      
      // Update attempt answer to indicate scoring failure
      await AttemptAnswer.update(
        { 
          ai_feedback: { 
            error: error.message,
            timestamp: new Date() 
          } 
        },
        { where: { id: attemptAnswerId } }
      );

      throw error;
    }
  }

  /**
   * Score a Writing answer
   */
  async scoreWritingAnswer(question, attemptAnswer, rubrics, level) {
    return await geminiAIService.scoreWriting({
      questionText: question.question_text,
      answerText: attemptAnswer.answer_text,
      rubrics: rubrics,
      level: level
    });
  }

  /**
   * Score a Speaking answer
   */
  async scoreSpeakingAnswer(question, attemptAnswer, rubrics, level) {
    // For speaking, we need the audio transcript
    // This would typically come from a speech-to-text service
    const audioTranscript = attemptAnswer.answer_text || '[Audio transcript unavailable]';
    
    return await geminiAIService.scoreSpeaking({
      questionText: question.question_text,
      audioTranscript: audioTranscript,
      rubrics: rubrics,
      level: level
    });
  }

  /**
   * Check if question type requires AI scoring
   */
  requiresAIScoring(questionType) {
    const aiScoringTypes = [
      'essay',
      'short_answer',
      'audio_response',
      'image_description'
    ];
    return aiScoringTypes.includes(questionType);
  }

  /**
   * Bulk scoring for multiple answers
   */
  async scoreMultipleAnswers(attemptAnswerIds) {
    const results = [];
    
    for (const id of attemptAnswerIds) {
      try {
        const result = await this.scoreAnswer(id);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          attempt_answer_id: id,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Re-score an answer (for quality control)
   */
  async rescoreAnswer(attemptAnswerId, teacherOverride = false) {
    // Same as scoreAnswer but with override flag
    const result = await this.scoreAnswer(attemptAnswerId);
    
    if (teacherOverride) {
      // Log that this was teacher-initiated rescoring
      console.log(`Answer ${attemptAnswerId} rescored by teacher request`);
    }
    
    return result;
  }
}

module.exports = new AIScoringService();