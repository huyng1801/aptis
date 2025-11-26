const geminiConfig = require('../config/gemini');
const FormData = require('form-data');

class GeminiAIService {
  constructor() {
    this.model = geminiConfig.getModel();
    this.config = geminiConfig.getConfig();
  }

  /**
   * Score Writing submission using Gemini AI
   * @param {Object} params - Scoring parameters
   * @param {string} params.questionText - Original question
   * @param {string} params.answerText - Student's answer
   * @param {Array} params.rubrics - Scoring criteria
   * @param {string} params.level - Student level (A1, A2, etc.)
   * @returns {Object} Scoring result
   */
  async scoreWriting({ questionText, answerText, rubrics, level }) {
    try {
      const prompt = this.buildWritingPrompt(questionText, answerText, rubrics, level);
      
      const result = await this.callGemini(prompt);
      
      return this.parseWritingResponse(result, rubrics);
    } catch (error) {
      console.error('Error scoring writing:', error);
      throw new Error(`AI scoring failed: ${error.message}`);
    }
  }

  /**
   * Score Speaking submission using Gemini AI
   * @param {Object} params - Scoring parameters
   * @param {string} params.questionText - Original question
   * @param {string} params.audioTranscript - Transcribed speech
   * @param {Array} params.rubrics - Scoring criteria
   * @param {string} params.level - Student level
   * @returns {Object} Scoring result
   */
  async scoreSpeaking({ questionText, audioTranscript, rubrics, level }) {
    try {
      const prompt = this.buildSpeakingPrompt(questionText, audioTranscript, rubrics, level);
      
      const result = await this.callGemini(prompt);
      
      return this.parseSpeakingResponse(result, rubrics);
    } catch (error) {
      console.error('Error scoring speaking:', error);
      throw new Error(`AI scoring failed: ${error.message}`);
    }
  }

  /**
   * Call Gemini AI with retry mechanism
   */
  async callGemini(prompt, retryCount = 0) {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      if (retryCount < this.config.retryAttempts) {
        console.warn(`Retrying Gemini call (attempt ${retryCount + 1})`);
        await this.delay(1000 * (retryCount + 1));
        return this.callGemini(prompt, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * Build prompt for Writing assessment
   */
  buildWritingPrompt(questionText, answerText, rubrics, level) {
    const rubricPrompts = rubrics.map(r => 
      `${r.criteria_name} (${r.weight_percentage}%): ${r.ai_prompt_template}`
    ).join('\n');

    return `
You are an expert IELTS Writing examiner. Please score this writing response according to the following criteria:

QUESTION: ${questionText}

STUDENT LEVEL: ${level}

STUDENT RESPONSE:
${answerText}

SCORING CRITERIA:
${rubricPrompts}

Please provide your assessment in the following JSON format:
{
  "scores": [
    {
      "criteria": "criteria_name",
      "score": numeric_score,
      "feedback": "detailed_feedback"
    }
  ],
  "overall_feedback": "general_feedback_and_suggestions",
  "strengths": ["strength1", "strength2"],
  "areas_for_improvement": ["area1", "area2"],
  "suggestions": ["suggestion1", "suggestion2"]
}

Score each criterion out of 10, considering the student's level. Provide specific, constructive feedback.
    `;
  }

  /**
   * Build prompt for Speaking assessment
   */
  buildSpeakingPrompt(questionText, audioTranscript, rubrics, level) {
    const rubricPrompts = rubrics.map(r => 
      `${r.criteria_name} (${r.weight_percentage}%): ${r.ai_prompt_template}`
    ).join('\n');

    return `
You are an expert IELTS Speaking examiner. Please score this speaking response according to the following criteria:

QUESTION: ${questionText}

STUDENT LEVEL: ${level}

TRANSCRIBED RESPONSE:
${audioTranscript}

SCORING CRITERIA:
${rubricPrompts}

Please provide your assessment in the following JSON format:
{
  "scores": [
    {
      "criteria": "criteria_name", 
      "score": numeric_score,
      "feedback": "detailed_feedback"
    }
  ],
  "overall_feedback": "general_feedback_and_suggestions",
  "strengths": ["strength1", "strength2"],
  "areas_for_improvement": ["area1", "area2"],
  "suggestions": ["suggestion1", "suggestion2"]
}

Score each criterion out of 10, considering the student's level. Provide specific, constructive feedback.
    `;
  }

  /**
   * Parse Gemini response for Writing
   */
  parseWritingResponse(responseText, rubrics) {
    try {
      // Clean response and extract JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Calculate total score
      const totalScore = parsed.scores.reduce((sum, score) => {
        const rubric = rubrics.find(r => r.criteria_name === score.criteria);
        const weight = rubric ? rubric.weight_percentage / 100 : 0;
        return sum + (score.score * weight);
      }, 0);

      return {
        scores: parsed.scores,
        total_score: Math.round(totalScore * 100) / 100,
        overall_feedback: parsed.overall_feedback,
        strengths: parsed.strengths || [],
        areas_for_improvement: parsed.areas_for_improvement || [],
        suggestions: parsed.suggestions || [],
        ai_confidence: 0.85 // Static for now
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  /**
   * Parse Gemini response for Speaking
   */
  parseSpeakingResponse(responseText, rubrics) {
    // Same logic as Writing for now
    return this.parseWritingResponse(responseText, rubrics);
  }

  /**
   * Utility delay function
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new GeminiAIService();