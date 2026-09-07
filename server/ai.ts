import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { requireAuth } from './auth.ts';

export const aiRouter = express.Router();

const geminiApiKey = process.env.GEMINI_API_KEY;

// Create a singleton client to avoid creating multiple clients
let aiClient: GoogleGenAI | null = null;
if (geminiApiKey) {
  aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
}

aiRouter.post('/chat', requireAuth, async (req, res) => {
  try {
    if (!aiClient) {
      return res.status(503).json({ 
        error: 'AI is not configured. GEMINI_API_KEY is missing from environment variables.' 
      });
    }

    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // Convert client messages to Gemini format
    const history = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // The last message is the current one we want to send
    const currentMessage = history.pop();
    if (!currentMessage) {
       return res.status(400).json({ error: 'No messages provided' });
    }

    const systemInstruction = `You are a specialized AI assistant focused specifically on Amazon KDP (Kindle Direct Publishing) research and publishing.
You help authors with: Niche ideas, Keyword ideas, Audience ideas, Book concepts, Titles, Subtitles, Descriptions, Research interpretation, Cover concepts, and Publishing checklists.

CRITICAL CONSTRAINTS:
1. You MUST NOT fabricate or invent market statistics (e.g. search volumes, specific BSRs, precise sales figures).
2. If you do not have verified, up-to-date data for a specific market statistic, you MUST explicitly state that you do not have that data. 
3. You MUST format your responses to strictly separate information into distinct sections. 

Every response you provide should clearly delineate between:
- [USER CONTEXT]: Acknowledge the user's provided information.
- [VERIFIED MARKET DATA]: Any real facts, known historical trends, or explicit lack of data.
- [AI SUGGESTIONS]: Your creative ideas, concepts, and advice.

Use Markdown headings or bold labels to make these sections visually distinct.
Example format:

### User Context
You want to publish a children's activity book for ages 4-8.

### Verified Market Data
I do not have access to real-time Amazon BSR or search volume statistics. However, children's activity books are generally known to peak around holidays and back-to-school seasons.

### AI Suggestions
**Book Concepts:**
- Space Explorer Activity Book...
`;

    // Using generateContent with history array is more stateless and robust for REST APIs.
    // Implement retry logic for 503 (high demand) errors
    let response;
    let maxRetries = 3;
    let currentTry = 0;
    let delayMs = 1500;

    while (currentTry < maxRetries) {
      try {
        response = await aiClient.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: [...history, currentMessage],
            config: {
                systemInstruction,
                temperature: 0.7
            }
        });
        break; // Success, exit the retry loop
      } catch (error: any) {
        const isUnavailable = 
          error?.status === 503 || 
          error?.status === 'UNAVAILABLE' ||
          error?.message?.includes('503') ||
          error?.message?.includes('UNAVAILABLE');

        if (isUnavailable && currentTry < maxRetries - 1) {
          console.warn(`Model API unavailable (503), retrying in ${delayMs}ms... (Attempt ${currentTry + 1} of ${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs *= 2; // Exponential backoff
          currentTry++;
        } else {
          throw error; // Throw if it's not a 503 or we ran out of retries
        }
      }
    }

    if (!response) {
      throw new Error('Failed to generate content after retries.');
    }

    res.json({
      role: 'assistant',
      content: response.text
    });
    
  } catch (error: any) {
    console.error('Chat API Error:', error);
    
    const isUnavailable = 
      error?.status === 503 || 
      error?.status === 'UNAVAILABLE' ||
      error?.message?.includes('503') ||
      error?.message?.includes('UNAVAILABLE');
      
    if (isUnavailable) {
      return res.status(429).json({ error: 'The AI model is currently experiencing high demand. Please try again in a few moments.' });
    }
    
    res.status(500).json({ error: error.message || 'Failed to process chat request' });
  }
});
