import { GoogleGenerativeAI } from "@google/generative-ai";

// Prefer environment variable; fallback to provided key if not set.
const API_KEY = process.env.EXPO_PUBLIC_GENAI_API_KEY || 'AIzaSyCRMIHGzZDHuT1Tw_1jduYGWIZwYquTobE';
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

        const DEFAULT_MODEL = "gemini-2.0-flash";

        const model = genAI.getGenerativeModel({ model: DEFAULT_MODEL });

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

        // Handle Quota Exceeded (429)
        if (error.message?.includes("429") || error.status === 429) {
            const quotaError = new Error("AI Quota Exceeded. Please add items manually.");
            (quotaError as any).status = 429;
            throw quotaError;
        }

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
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
