import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Google Generative AI (Gemini) API key resolution.
 * Expo bundles only `EXPO_PUBLIC_*` vars — use EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY in .env for the app.
 * `GOOGLE_GENERATIVE_AI_API_KEY` without prefix is checked for tooling; it is not available in Expo client unless duplicated as EXPO_PUBLIC_*.
 */
function resolveGoogleGenerativeAiApiKey(): string {
    return (
        process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.EXPO_PUBLIC_GENAI_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GENAI_API_KEY ||
        ''
    );
}

const API_KEY = resolveGoogleGenerativeAiApiKey();
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

/** True when a Gemini key is configured (for laundry image analysis, etc.). */
export function isGeminiConfigured(): boolean {
    return !!resolveGoogleGenerativeAiApiKey();
}

const MISSING_KEY_HINT =
    'Set EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY (or EXPO_PUBLIC_GENAI_API_KEY) in .env and restart Expo.';

/** gemini-1.5-flash often returns 404 on current API; use 2.5 family. https://ai.google.dev/gemini-api/docs/models/gemini */
const GEMINI_MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-flash-latest'] as const;

function configuredGeminiModel(): string {
    return (
        process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_MODEL ||
        process.env.EXPO_PUBLIC_GENAI_MODEL ||
        process.env.GENAI_MODEL ||
        'gemini-2.5-flash'
    );
}

function geminiModelCandidates(): string[] {
    const preferred = configuredGeminiModel();
    return [...new Set([preferred, ...GEMINI_MODEL_FALLBACKS])];
}

function isGeminiModelNotFoundError(err: unknown): boolean {
    const msg = String((err as Error)?.message ?? err);
    return msg.includes('404') && (msg.includes('not found') || msg.includes('is not found'));
}

/**
 * Detects clothing items and their counts from a base64 image.
 * @param base64Data The base64 encoded image string (without the prefix).
 * @param mimeType The format of the image (e.g., 'image/jpeg').
 */
export const detectClothing = async (base64Data: string, mimeType: string = "image/jpeg") => {
    const cleanBase64 = base64Data.includes("base64,")
        ? base64Data.split("base64,")[1]
        : base64Data;

    if (!genAI) {
        throw new Error(`Gemini API key missing. ${MISSING_KEY_HINT}`);
    }

    const prompt = `
      Analyze this image of laundry/clothing. 
      Identify all distinct types of clothing (e.g., T-shirt, Jeans, Socks, Dress, Jacket, etc.).
      Count how many of each category are present.
      Return the result strictly as a JSON object where keys are the category names and values are the counts.
      Example: {"T-shirt": 3, "Pants": 2, "Socks": 5}
      If no clothing is found, return {}.
      Do not include any markdown formatting or extra text, just the JSON.
    `;

    const contentPayload = [
        prompt,
        {
            inlineData: {
                data: cleanBase64,
                mimeType,
            },
        },
    ] as const;

    let lastError: unknown;
    for (const modelName of geminiModelCandidates()) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent([...contentPayload]);
            const response = await result.response;
            const text = response.text().trim();
            console.log(`Gemini (${modelName}) laundry response:`, text);

            const cleaned = text.replace(/```json|```/g, '').trim();
            try {
                return JSON.parse(cleaned) as Record<string, number>;
            } catch {
                const match = cleaned.match(/\{[\s\S]*\}/);
                if (match) {
                    return JSON.parse(match[0]) as Record<string, number>;
                }
                throw new Error('Gemini response was not valid JSON');
            }
        } catch (err: unknown) {
            if (isGeminiModelNotFoundError(err)) {
                console.warn(`Gemini model "${modelName}" unavailable (404), trying next…`);
                lastError = err;
                continue;
            }
            console.error('Gemini detectClothing Error:', err);
            throw err;
        }
    }

    console.error('Gemini detectClothing Error:', lastError);
    throw lastError instanceof Error
        ? lastError
        : new Error('All Gemini model candidates failed. Set EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_MODEL in .env.');
};

/**
 * Generates a travel itinerary based on destination, duration, and budget.
 */
export const generateItinerary = async (destination: string, days: number, budget: number) => {
    try {
        if (!genAI) {
            throw new Error(`Gemini API key missing. ${MISSING_KEY_HINT}`);
        }
        const model = genAI.getGenerativeModel({ model: configuredGeminiModel() });

        const prompt = `
      Create a travel itinerary for a trip to ${destination}.
      Duration: ${days} days.
      Budget: RS ${budget}.
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
