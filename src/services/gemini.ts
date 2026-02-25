import { GoogleGenerativeAI } from "@google/generative-ai";

// Prefer environment variable; fallback to provided key if not set.
const API_KEY = process.env.GENAI_API_KEY || 'AIzaSyAm4kBgwFmITj3Glwkxlv4xEU8Vt5GRhq4';
const genAI = new GoogleGenerativeAI(API_KEY);

/**
 * Detects clothing items and their counts from a base64 image.
 * @param base64Data The base64 encoded image string (without the prefix).
 * @param mimeType The format of the image (e.g., 'image/jpeg').
 */
export const detectClothing = async (base64Data: string, mimeType: string = "image/jpeg") => {
    try {
        // Strip any base64 prefix if it exists
        const cleanBase64 = base64Data.includes("base64,")
            ? base64Data.split("base64,")[1]
            : base64Data;

        const DEFAULT_MODEL = process.env.GENAI_MODEL || "gemini-1.5-flash";

        const resolveModel = async (modelName: string) => {
            try {
                return genAI.getGenerativeModel({ model: modelName });
            } catch (err) {
                // Try to discover a supported model via listModels if available
                try {
                    if (typeof (genAI as any).listModels === 'function') {
                        const list = await (genAI as any).listModels();
                        // list may be { models: [...] } or an array depending on SDK version
                        const models = list?.models ?? list;
                        const candidate = (models || []).find((m: any) => {
                            const name = m?.name || m;
                            if (!name) return false;
                            // prefer any gemini model that contains 'gemini' in the name
                            return String(name).toLowerCase().includes('gemini');
                        });
                        const pick = candidate?.name ?? candidate;
                        if (pick) return genAI.getGenerativeModel({ model: pick });
                    }
                } catch (e) {
                    // ignore discovery errors, rethrow original
                }
                throw err;
            }
        };

        const model = await resolveModel(DEFAULT_MODEL);

        const prompt = `
      Analyze this image of laundry/clothing. 
      Identify all distinct types of clothing (e.g., T-shirt, Jeans, Socks, Dress, Jacket, etc.).
      Count how many of each category are present.
      Return the result strictly as a JSON object where keys are the category names and values are the counts.
      Example: {"T-shirt": 3, "Pants": 2, "Socks": 5}
      If no clothing is found, return {}.
      Do not include any markdown formatting or extra text, just the JSON.
    `;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    data: cleanBase64,
                    mimeType,
                },
            },
        ]);

        const response = await result.response;
        const text = response.text().trim();
        console.log("Gemini Raw Response:", text);

        // Clean up markdown if AI included it
        const jsonString = text.replace(/```json|```/g, "").trim();
        return JSON.parse(jsonString) as Record<string, number>;
    } catch (error: any) {
        console.error("Gemini detectClothing Error:", error);
        if (error.response) {
            console.error("Gemini Error Response:", await error.response.text());
        }
        throw error;
    }
};

/**
 * Generates a travel itinerary based on destination, duration, and budget.
 */
export const generateItinerary = async (destination: string, days: number, budget: number) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
      Create a travel itinerary for a trip to ${destination}.
      Duration: ${days} days.
      Budget: RM ${budget}.
      Provide daily activities, recommended local food, and estimated costs for major items.
      Format the response in a beautiful, structured Markdown format with headings for each day.
      Include a "Budget Breakdown" section at the end.
      Make it fun and practical for a university student.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Gemini generateItinerary Error:", error);
        throw error;
    }
};
