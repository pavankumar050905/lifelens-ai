import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, HealthData } from "../types";

const SYSTEM_PROMPT = `
You are LifeLens AI, a multimodal assistant capable of TWO distinct expert roles:
1. REPAIR EXPERT: Analyze broken items, diagnose issues, and provide repair plans.
2. NUTRITIONIST: Analyze food images, estimate calories/macros, and provide health guidance.

INPUT CONTEXT:
- If the user provides Health Data (height/weight), you MUST perform FOOD ANALYSIS.
- If the user asks about a broken item, perform REPAIR DIAGNOSIS.

RULES FOR FOOD ANALYSIS:
1. Estimate calories and macros based on the visual portion size.
2. Calculate BMI using the provided height/weight.
3. Estimate daily calorie needs (Mifflin-St Jeor) if data allows, otherwise approximate.
4. Provide practical advice (portion control, substitutions).
5. SAFETY: If BMI > 30 or meal is dangerous/excessive, add a gentle "Consult a professional" note. NO MEDICAL DIAGNOSIS.

RULES FOR REPAIR DIAGNOSIS:
1. SAFETY FIRST: If high voltage, gas, or structural danger, set safety_level='high'.
2. Be concise and actionable.
`;

// Unified schema covering both use cases
const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    is_food: { type: Type.BOOLEAN, description: "True if analyzing food, False if repairing an item." },
    
    // --- SHARED ---
    accessibility_hint: { type: Type.STRING, description: "Visual description for accessibility." },

    // --- REPAIR FIELDS ---
    problem_summary: { type: Type.STRING, nullable: true },
    safety_level: { type: Type.STRING, enum: ["low", "medium", "high"], nullable: true },
    safety_warning: { type: Type.STRING, nullable: true },
    estimated_cost: { type: Type.STRING, nullable: true },
    estimated_time_minutes: { type: Type.INTEGER, nullable: true },
    parts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          search_query: { type: Type.STRING },
        }
      },
      nullable: true
    },
    steps: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },

    // --- FOOD FIELDS ---
    summary: { type: Type.STRING, nullable: true, description: "Description of the meal." },
    calories_estimate: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        value: { type: Type.NUMBER },
        unit: { type: Type.STRING },
        confidence: { type: Type.STRING, enum: ["low", "medium", "high"] }
      }
    },
    serving_size: { type: Type.STRING, nullable: true },
    macros: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        carbs_g: { type: Type.NUMBER },
        protein_g: { type: Type.NUMBER },
        fat_g: { type: Type.NUMBER }
      }
    },
    estimated_daily_need: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        value: { type: Type.NUMBER },
        unit: { type: Type.STRING },
        method: { type: Type.STRING }
      }
    },
    bmi: {
      type: Type.OBJECT,
      nullable: true,
      properties: {
        value: { type: Type.NUMBER },
        category: { type: Type.STRING }
      }
    },
    nutrition_recommendation: { type: Type.STRING, nullable: true },
    follow_up_questions: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true }
  },
  required: ["is_food", "accessibility_hint"]
};

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key not found");
  return new GoogleGenAI({ apiKey });
};

/**
 * Lightweight classification to detect if image is Food or Other.
 */
export const classifyImage = async (base64Image: string): Promise<boolean> => {
  try {
    const ai = getAIClient();
    // Use flash for speed on classification
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Is this image primarily of FOOD/MEAL or a BROKEN/REPAIRABLE OBJECT? Respond with JSON: { \"is_food\": boolean }" }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: { is_food: { type: Type.BOOLEAN } }
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    return !!result.is_food;
  } catch (e) {
    console.warn("Classification failed, defaulting to repair mode", e);
    return false;
  }
};

export const analyzeImage = async (base64Image: string, userDescription: string, healthData?: HealthData): Promise<AnalysisResult> => {
  try {
    const ai = getAIClient();
    const modelId = "gemini-3-pro-preview"; // High reasoning model

    let promptText = "";
    
    if (healthData) {
      promptText = `
        User Health Data:
        - Height: ${healthData.heightCm} cm
        - Weight: ${healthData.weightKg} kg
        - Age: ${healthData.age || 'Not specified'}
        - Sex: ${healthData.sex || 'Not specified'}
        - Activity: ${healthData.activityLevel || 'Not specified'}
        
        Task: Analyze this food image. Provide calorie estimates, macros, BMI analysis, and dietary advice.
        User Notes: "${userDescription}"
      `;
    } else {
      promptText = `
        Task: Diagnose this repair issue.
        User Notes: "${userDescription}"
      `;
    }

    const response = await ai.models.generateContent({
      model: modelId,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: promptText }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.4,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const result = JSON.parse(text) as AnalysisResult;
    return result;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};