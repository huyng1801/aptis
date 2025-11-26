const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiConfig {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required in environment variables');
    }
    
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.maxTokens = parseInt(process.env.GEMINI_MAX_TOKENS) || 8192;
    this.temperature = parseFloat(process.env.GEMINI_TEMPERATURE) || 0.7;
  }

  getModel() {
    return this.genAI.getGenerativeModel({ 
      model: this.model,
      generationConfig: {
        maxOutputTokens: this.maxTokens,
        temperature: this.temperature
      }
    });
  }

  getConfig() {
    return {
      model: this.model,
      maxTokens: this.maxTokens,
      temperature: this.temperature,
      timeout: parseInt(process.env.AI_TIMEOUT_MS) || 30000,
      retryAttempts: parseInt(process.env.AI_RETRY_ATTEMPTS) || 3
    };
  }
}

module.exports = new GeminiConfig();