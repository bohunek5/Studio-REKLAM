import { GoogleGenAI, Type, Schema } from "@google/genai";
import { ColorPalette } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

interface GeneratedCopy {
  headline: string;
  subheadline: string;
  ctaText: string;
  promoBadge?: string;
  suggestedColors?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

export const generateAdCopy = async (
  productName: string,
  description: string,
  tone: string = 'professional'
): Promise<GeneratedCopy> => {
  if (!apiKey) {
    console.warn("API Key is missing. Returning mock data.");
    return {
      headline: "Najwyższa Jakość: " + productName,
      subheadline: "Odkryj różnicę już dziś.",
      ctaText: "Kup Teraz",
      promoBadge: "Bestseller"
    };
  }

  const prompt = `
    Role: Senior Creative Director & Copywriter.
    Task: Create high-impact, professional ad copy for a social media visual design.
    LANGUAGE: POLISH (This is mandatory. All text output must be in Polish).

    Product: ${productName}
    Details: ${description}
    Vibe: ${tone}

    Requirements:
    1. Headline: MAX 5 words. Must be punchy, witty, or emotional. NOT generic. In Polish.
    2. Subheadline: MAX 10 words. Benefit-driven. In Polish.
    3. CTA: 2-3 words. Strong command. In Polish (e.g. "Kup Teraz", "Sprawdź").
    4. Promo Badge: A short tag like "Nowość", "-50%", "Limitowane", or "Hit". In Polish.
    5. Colors: Suggest a refined, designer-quality palette suitable for the vibe.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING, description: "Punchy headline in Polish, max 5 words." },
            subheadline: { type: Type.STRING, description: "Supporting text in Polish, max 10 words." },
            ctaText: { type: Type.STRING, description: "Button text in Polish." },
            promoBadge: { type: Type.STRING, description: "Short badge text in Polish (e.g. 'Nowość')." },
            suggestedColors: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.STRING },
                secondary: { type: Type.STRING },
                accent: { type: Type.STRING },
                background: { type: Type.STRING },
              }
            }
          },
          required: ["headline", "subheadline", "ctaText"]
        } as Schema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text) as GeneratedCopy;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      headline: "Najwyższa Jakość: " + productName,
      subheadline: "Sprawdź naszą ofertę już teraz.",
      ctaText: "Kup Teraz",
      promoBadge: "Hit"
    };
  }
};

export const generateBackgroundImage = async (prompt: string): Promise<string | null> => {
  if (!apiKey) return null;

  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: prompt,
    });
    
    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (error) {
    console.error("Image Gen Error:", error);
    return null;
  }
};