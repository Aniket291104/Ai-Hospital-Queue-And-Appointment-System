import { env } from '../../config/env';
import { GeminiAIService } from './gemini.service';
import { MockAIService } from './mock.service';
import { IAIService } from './ai.interface';
import { logger } from '../../utils/logger';

let activeAIService: IAIService;

// Fallback to Mock AI service if key is not configured, or set to placeholder/invalid format
const isKeyConfigured = env.GEMINI_API_KEY &&
  env.GEMINI_API_KEY !== 'your_gemini_api_key' &&
  !env.GEMINI_API_KEY.startsWith('your_');

const hasValidPrefix = env.GEMINI_API_KEY && (
  env.GEMINI_API_KEY.startsWith('AIzaSy') ||
  env.GEMINI_API_KEY.startsWith('AQ.')
);

if (!isKeyConfigured || !hasValidPrefix) {
  logger.info('⚡ Using Mock AI Service (GEMINI_API_KEY is not configured or set to placeholder/invalid format)');
  activeAIService = new MockAIService();
} else {
  logger.info('🤖 Using Gemini AI Service (Google Generative AI)');
  activeAIService = new GeminiAIService();
}

export { activeAIService as aiService };
