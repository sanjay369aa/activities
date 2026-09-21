import { GoogleGenAI, Type } from '@google/genai';
import { TaskCategory } from '../types';

// Lazy init client to prevent startup crash if key is missing
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in secrets/environment.');
  }
  return new GoogleGenAI({ apiKey });
}

export interface GeneratedScheduleItem {
  title: string;
  time: string; // HH:mm format (24h)
  category: TaskCategory;
  description: string;
  selected?: boolean;
}

export interface FoodNutritionEstimate {
  foodName: string;
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  confidence: string;
  notes: string;
}

// Generate schedule from prompt
export async function generateScheduleFromPrompt(prompt: string): Promise<GeneratedScheduleItem[]> {
  const ai = getGeminiClient();

  const systemInstruction = `You are an expert daily routine and productivity planner.
Given a user's schedule request, generate a realistic, well-paced daily routine formatted as a structured list of tasks.
Requirements:
1. Each task must have:
   - title: concise action (e.g. "Morning Walk", "College Lectures", "Python Practice", "Dinner", "Sleep")
   - time: 24-hour string format "HH:mm" (e.g. "06:00", "08:30", "17:00", "22:30")
   - category: One of ['Personal', 'Study', 'College', 'Exercise', 'Food', 'Sleep', 'Other']
   - description: brief helpful 1-sentence tip or context.
2. Order chronologically from early morning to night.
3. Balance focus, meals, recreation, and sleep.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        description: 'Chronological list of daily schedule tasks',
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            time: { type: Type.STRING, description: '24-hour HH:mm time' },
            category: {
              type: Type.STRING,
              enum: ['Personal', 'Study', 'College', 'Exercise', 'Food', 'Sleep', 'Other'],
            },
            description: { type: Type.STRING },
          },
          required: ['title', 'time', 'category'],
        },
      },
    },
  });

  const text = response.text;
  if (!text) return [];

  try {
    const parsed = JSON.parse(text) as GeneratedScheduleItem[];
    return parsed.map((item) => ({ ...item, selected: true }));
  } catch (err) {
    console.error('Failed to parse Gemini schedule response:', err);
    return [];
  }
}

// Analyze food photo using Gemini Vision
export async function analyzeFoodImage(
  base64Data: string,
  mimeType: string = 'image/jpeg'
): Promise<FoodNutritionEstimate> {
  const ai = getGeminiClient();

  const prompt = `Analyze this food image in detail.
Estimate:
1. Food name / dish description
2. Approximate portion size (e.g., '1 medium bowl (approx 350g)', '2 slices')
3. Estimated total Calories (kcal)
4. Estimated Protein (grams)
5. Estimated Carbohydrates (grams)
6. Estimated Total Fat (grams)
7. Any health or nutritional notes.

Keep the numbers realistic for the visible portion.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          foodName: { type: Type.STRING },
          portion: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          protein: { type: Type.NUMBER },
          carbs: { type: Type.NUMBER },
          fat: { type: Type.NUMBER },
          confidence: { type: Type.STRING, enum: ['high', 'medium', 'estimated'] },
          notes: { type: Type.STRING },
        },
        required: ['foodName', 'portion', 'calories', 'protein', 'carbs', 'fat'],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Gemini could not analyze the image.');
  }

  return JSON.parse(text) as FoodNutritionEstimate;
}
