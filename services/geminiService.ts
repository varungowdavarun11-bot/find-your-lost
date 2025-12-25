
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIAnalysisResult } from "../types";

// Helper to remove the data URL prefix for Gemini
const cleanBase64 = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: "A short, concise title for the found item (e.g., 'Blue Nike Water Bottle').",
    },
    description: {
      type: Type.STRING,
      description: "A detailed description of the item including color, brand, condition, and distinctive features.",
    },
    category: {
      type: Type.STRING,
      description: "Category of the item (e.g., Electronics, Clothing, Accessories, Stationery).",
    },
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "5-7 keywords to help search for this item.",
    },
    suggestedLocation: {
        type: Type.STRING,
        description: "Infer a possible context or type of location based on the background if visible (e.g., 'Library desk', 'Outdoor bench'), otherwise leave empty."
    },
    isLikelyAI: {
      type: Type.BOOLEAN,
      description: "True if the image appears to be AI-generated, synthetic, or non-photographic. False if it looks like a real-world photo of a physical object."
    }
  },
  required: ["name", "description", "category", "tags", "isLikelyAI"],
};

export const analyzeItemImage = async (base64Image: string): Promise<AIAnalysisResult> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API Key not found");
      throw new Error("API Key is missing. Please ensure process.env.API_KEY is set.");
    }

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", 
              data: cleanBase64(base64Image),
            },
          },
          {
            text: "Analyze this image. First, determine if it is a real-world photograph of a lost item. If it is AI-generated, synthetic, or a digitally created illustration, flag it using the isLikelyAI field. Otherwise, provide a structured description.",
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        systemInstruction: "You are a quality control assistant for a college Lost and Found system. Your primary job is to ensure only real photos of physical lost items are uploaded. You must detect and reject AI-generated or synthetic images.",
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    return JSON.parse(text) as AIAnalysisResult;

  } catch (error) {
    console.error("Gemini analysis failed:", error);
    // Return a fallback so the app doesn't crash, allowing manual entry
    return {
      name: "",
      description: "",
      category: "Uncategorized",
      tags: [],
      isLikelyAI: false
    };
  }
};
