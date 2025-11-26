const aiScoringService = require('../services/aiScoring.service');
const geminiAIService = require('../services/geminiAI.service');

class AIController {
  /**
   * Score a single answer using AI
   */
  async scoreAnswer(req, res) {
    try {
      const { id } = req.params;
      
      const result = await aiScoringService.scoreAnswer(parseInt(id));
      
      res.json({
        success: true,
        message: 'Answer scored successfully',
        data: result
      });
    } catch (error) {
      console.error('Score answer error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to score answer',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Score multiple answers using AI
   */
  async scoreMultipleAnswers(req, res) {
    try {
      const { answer_ids } = req.body;
      
      if (!Array.isArray(answer_ids)) {
        return res.status(400).json({
          success: false,
          message: 'answer_ids must be an array'
        });
      }

      const results = await aiScoringService.scoreMultipleAnswers(answer_ids);
      
      const successful = results.filter(r => r.success).length;
      const failed = results.length - successful;
      
      res.json({
        success: true,
        message: `Scored ${successful} answers successfully, ${failed} failed`,
        data: {
          results,
          summary: {
            total: results.length,
            successful,
            failed
          }
        }
      });
    } catch (error) {
      console.error('Score multiple answers error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to score answers',
        error: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }

  /**
   * Re-score an answer using AI (admin/teacher only, does not override manual reviews)
   */
  async rescoreAnswer(req, res) {
    try {
      const { id } = req.params;
      
      // Check if answer has manual review
      const { AttemptAnswer } = require('../models');
      const answer = await AttemptAnswer.findByPk(id);
      
      if (!answer) {
        return res.status(404).json({
          success: false,
          message: 'Answer not found'
        });
      }

      // Prevent AI rescore if manually reviewed
      if (answer.manual_review_by) {
        return res.status(409).json({
          success: false,
          message: 'Cannot AI-rescore manually reviewed answers. Use teacher review dashboard instead.',
          data: {
            manual_review_by: answer.manual_review_by,
            manual_review_at: answer.manual_review_at
          }
        });
      }
      
      const result = await aiScoringService.rescoreAnswer(parseInt(id), true);
      
      res.json({
        success: true,
        message: 'Answer re-scored successfully by AI',
        data: result
      });
    } catch (error) {
      console.error('Rescore answer error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to re-score answer'
      });
    }
  }

  /**
   * Test AI service connection
   */
  async testConnection(req, res) {
    try {
      // Test with a simple prompt
      const testResult = await geminiAIService.callGemini(
        "Respond with 'AI service is working' if you can read this message."
      );
      
      res.json({
        success: true,
        message: 'AI service connection successful',
        data: {
          response: testResult,
          timestamp: new Date(),
          service: 'Google Gemini AI'
        }
      });
    } catch (error) {
      console.error('Test AI connection error:', error);
      res.status(500).json({
        success: false,
        message: 'AI service connection failed',
        error: error.message
      });
    }
  }
}

module.exports = new AIController();