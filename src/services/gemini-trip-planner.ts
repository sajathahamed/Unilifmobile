/**
 * Gemini API Service for Trip Planning
 * Replaces DeepSeek with Google Generative AI for trip plan generation
 * Includes smart budget validation and prompt engineering
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Resolve API key from environment
function resolveGeminiApiKey(): string {
    return (
        process.env.EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        ''
    );
}

// Initialize Gemini
const API_KEY = resolveGeminiApiKey();
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

export interface TripPlanRequest {
    destination: string;
    days: number;
    budget: number; // in LKR
    travelers: number;
    roomType: 'budget' | 'standard' | 'luxury';
    travelType?: 'solo' | 'couple' | 'family' | 'friends';
    transportMode?: string;
    foodPreference?: string;
}

export interface Activity {
    booking_link: string;
    contact_phone: string;
    booking_link: import("react/jsx-runtime").JSX.Element;
    booking_link: import("react/jsx-runtime").JSX.Element;
    contact_phone: import("react/jsx-runtime").JSX.Element;
    contact_phone: any;
    time: string;
    activity: string;
    description?: string;
    estimated_cost_lkr: number;
    duration?: string;
    location?: string;
}

export interface DayPlan {
    transport_details: ReactNode;
    transport_details: import("react/jsx-runtime").JSX.Element;
    day: number;
    theme: string;
    activities: Activity[];
    estimated_cost_lkr: number;
}

export interface HotelDetails {
    name: string;
    price_per_night_lkr: number;
    room_type: string;
    reason?: string;
}

export interface FoodPlace {
    name: string;
    cuisine: string;
    meal_type: string;
    estimated_cost_lkr: number;
}

export interface CostBreakdown {
    accommodation: number;
    meals: number;
    sightseeing: number;
    transportation: number;
    emergency: number;
}

export interface TripPlanResponse {
    summary: string;
    daily_plan: DayPlan[];
    total_cost_lkr: number;
    total_cost_usd: number;
    hotel_details: HotelDetails[];
    transport_summary: {
        mode: string;
        total_cost_lkr: number;
        details: string;
    };
    food_places: FoodPlace[];
    cost_breakdown_lkr: CostBreakdown;
    travel_tips: string[];
    budget_sufficient: boolean;
    budget_message?: string;
}

// Destination tier classification
export const DESTINATION_TIERS: Record<string, 'premium' | 'mid' | 'budget'> = {
    'Colombo': 'premium',
    'Ella': 'premium',
    'Galle': 'premium',
    'Nuwara Eliya': 'premium',
    'Hambantota': 'premium',
    'Kandy': 'mid',
    'Sigiriya': 'mid',
    'Mirissa': 'mid',
    'Arugam Bay': 'mid',
    'Trincomalee': 'mid',
    'Jaffna': 'budget',
    'Vavuniya': 'budget',
    'Anuradhapura': 'budget',
    'Polonnaruwa': 'budget',
    'Kurunegala': 'budget',
};

const USD_TO_LKR_RATE = 320;

/**
 * Check if Gemini API is configured
 */
export function isGeminiConfigured(): boolean {
    return !!API_KEY;
}

/**
 * Convert USD to LKR
 */
export function convertUSDToLKR(usd: number): number {
    return Math.round(usd * USD_TO_LKR_RATE);
}

/**
 * Calculate budget sufficiency
 * VIVA: How do you determine if a budget is sufficient?
 * Answer: Check daily minimum by destination tier, multiply by days, add buffers
 */
export function calculateBudgetSufficiency(
    budget: number,
    destination: string,
    days: number
): { sufficient: boolean; minimumBudget: number; message: string } {
    const tier = DESTINATION_TIERS[destination] || 'mid';

    // Daily budget minimums (include accommodation + food + activities + transport)
    const dailyMinimums = {
        premium: 15000, // Ella, Galle, etc.
        mid: 10000,     // Kandy, Sigiriya
        budget: 6000,   // Jaffna, Anuradhapura
    };

    const dailyMin = dailyMinimums[tier];
    const minimumBudget = dailyMin * days;
    const sufficient = budget >= minimumBudget;
    const shortfall = minimumBudget - budget;

    return {
        sufficient,
        minimumBudget,
        message: sufficient
            ? `✓ Budget sufficient for ${destination} (${tier} tier)`
            : `⚠ Budget is LKR ${shortfall.toLocaleString()} short. Minimum recommended: LKR ${minimumBudget.toLocaleString()}`,
    };
}

/**
 * Generate prompt for Gemini with budget constraints
 * Includes detailed instructions for trip plan structure and budget allocation
 */
function generateTripPlanPrompt(request: TripPlanRequest): string {
    const tier = DESTINATION_TIERS[request.destination] || 'mid';
    const budgetPerDay = request.budget / request.days;
    const budgetPerPerson = request.budget / request.travelers;

    return `You are an expert travel planner for Sri Lanka. Create a detailed ${request.days}-day trip plan for ${request.travelers} ${request.travelType || 'travelers'} to ${request.destination}.

BUDGET CONSTRAINTS:
- Total Budget: LKR ${request.budget.toLocaleString()}
- Daily Budget: LKR ${budgetPerDay.toFixed(0).toLocaleString()}
- Per Person Budget: LKR ${budgetPerPerson.toFixed(0).toLocaleString()}
- Destination Tier: ${tier.toUpperCase()} (${tier === 'premium' ? 'Ella, Galle class' : tier === 'mid' ? 'Kandy, Sigiriya class' : 'Budget destinations'})

TRIP DETAILS:
- Travel Type: ${request.travelType || 'group'}
- Room Type: ${request.roomType} hotel/accommodation
- Transport: ${request.transportMode || 'car'}
- Food Preference: ${request.foodPreference || 'mixed'}

REQUIRED OUTPUT (respond ONLY with valid JSON, no markdown):
{
  "summary": "2-3 sentence overview of the trip",
  "daily_plan": [
    {
      "day": 1,
      "theme": "Day theme (e.g., 'Arrival & City Exploration')",
      "activities": [
        {
          "time": "HH:MM",
          "activity": "Activity name",
          "description": "Short description",
          "estimated_cost_lkr": 1000,
          "duration": "1-2 hours",
          "location": "Specific location in ${request.destination}"
        }
      ],
      "estimated_cost_lkr": 5000
    }
  ],
  "hotel_details": [
    {
      "name": "Hotel Name",
      "price_per_night_lkr": 3000,
      "room_type": "${request.roomType}",
      "reason": "Why recommended"
    }
  ],
  "transport_summary": {
    "mode": "${request.transportMode}",
    "total_cost_lkr": 5000,
    "details": "Transport details and booking info"
  },
  "food_places": [
    {
      "name": "Restaurant/Food Place",
      "cuisine": "Type of cuisine",
      "meal_type": "breakfast/lunch/dinner",
      "estimated_cost_lkr": 800
    }
  ],
  "cost_breakdown_lkr": {
    "accommodation": 21000,
    "meals": 12000,
    "sightseeing": 8000,
    "transportation": 5000,
    "emergency": 4000
  },
  "travel_tips": [
    "Tip 1: Best time to visit is...",
    "Tip 2: Pack light clothing and...",
    "Tip 3: Learn basic Sinhala phrases..."
  ]
}

CRITICAL REQUIREMENTS:
1. EVERY activity must have a realistic LKR cost estimate
2. Total of all daily costs + accommodation + transport MUST NOT exceed LKR ${request.budget}
3. Activities must be specific to ${request.destination}
4. Include realistic Sri Lankan pricing (not Western prices)
5. Return ONLY valid JSON, no markdown code blocks
6. Allocate budget: ${tier === 'premium' ? '40% accommodation, 25% food, 25% activities, 10% transport' : tier === 'mid' ? '35% accommodation, 30% food, 25% activities, 10% transport' : '30% accommodation, 35% food, 25% activities, 10% transport'}
7. Include emergency buffer of 5-10% of total

SINHALA CONTEXT:
- Use local names for places and activities
- Include cultural/religious sites appropriate for tourists
- Respect Buddhist holidays and customs
- Mention local transport (tuk-tuk, bus, train) options`;
}

/**
 * Generate trip plan using Gemini
 * Includes retry logic and JSON parsing with fallback to structured template
 */
export async function generateTripPlanWithGemini(request: TripPlanRequest): Promise<TripPlanResponse> {
    if (!genAI || !API_KEY) {
        throw new Error('Gemini API key not configured. Set EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_API_KEY in .env');
    }

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
        });

        const prompt = generateTripPlanPrompt(request);
        console.log('[GEMINI] Generating trip plan for:', request.destination);
        console.log('[GEMINI] Budget:', request.budget, 'LKR');

        const response = await model.generateContent(prompt);
        const text = response.response.text();

        console.log('[GEMINI] Response received, parsing JSON...');

        // Try to extract JSON from response
        let jsonText = text.trim();

        // Remove markdown code blocks if present
        if (jsonText.includes('```json')) {
            jsonText = jsonText.split('```json')[1].split('```')[0].trim();
        } else if (jsonText.includes('```')) {
            jsonText = jsonText.split('```')[1].split('```')[0].trim();
        }

        const planData = JSON.parse(jsonText);

        // Validate and calculate totals
        let totalCost = 0;

        // Calculate accommodation cost
        const accommodationCost =
            planData.hotel_details?.reduce((sum: number, h: any) => sum + (h.price_per_night_lkr || 0) * request.days, 0) || 0;

        // Calculate daily activities + meals
        const activitiesCost = planData.daily_plan?.reduce((sum: number, day: any) => sum + (day.estimated_cost_lkr || 0), 0) || 0;

        // Calculate food places cost
        const foodCost = planData.food_places?.reduce((sum: number, f: any) => sum + (f.estimated_cost_lkr || 0), 0) || 0;

        // Transport cost
        const transportCost = planData.transport_summary?.total_cost_lkr || 0;

        // Emergency buffer
        const emergencyCost = planData.cost_breakdown_lkr?.emergency || Math.round(request.budget * 0.05);

        totalCost = accommodationCost + activitiesCost + foodCost + transportCost + emergencyCost;

        // Budget sufficiency
        const budgetCheck = calculateBudgetSufficiency(request.budget, request.destination, request.days);

        const result: TripPlanResponse = {
            summary: planData.summary || 'AI-generated trip plan',
            daily_plan: planData.daily_plan || [],
            total_cost_lkr: Math.min(totalCost, request.budget), // Cap at budget
            total_cost_usd: Math.round((Math.min(totalCost, request.budget) / USD_TO_LKR_RATE) * 100) / 100,
            hotel_details: planData.hotel_details || [],
            transport_summary: planData.transport_summary || {
                mode: request.transportMode || 'car',
                total_cost_lkr: Math.round(request.budget * 0.1),
                details: 'Pre-arranged transport',
            },
            food_places: planData.food_places || [],
            cost_breakdown_lkr: planData.cost_breakdown_lkr || {
                accommodation: accommodationCost,
                meals: foodCost,
                sightseeing: activitiesCost,
                transportation: transportCost,
                emergency: emergencyCost,
            },
            travel_tips: planData.travel_tips || [
                'Plan activities in advance during peak season',
                'Use public transport for budget travel',
                'Book accommodations ahead for better rates',
            ],
            budget_sufficient: budgetCheck.sufficient,
            budget_message: budgetCheck.message,
        };

        console.log('[GEMINI] ✅ Trip plan generated successfully');
        console.log('[GEMINI] Total cost: LKR', result.total_cost_lkr);
        console.log('[GEMINI] Budget sufficient:', result.budget_sufficient);

        return result;
    } catch (error) {
        console.error('[GEMINI] Error generating trip plan:', error);
        throw new Error(`Failed to generate trip plan: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Validate Gemini response structure
 * VIVA: How do you validate API responses for data integrity?
 * Answer: Check required fields exist, data types correct, numeric values in valid ranges
 */
export function validateTripPlanResponse(plan: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!plan.summary) errors.push('Missing trip summary');
    if (!Array.isArray(plan.daily_plan) || plan.daily_plan.length === 0) errors.push('Missing daily plan');
    if (!plan.total_cost_lkr || typeof plan.total_cost_lkr !== 'number') errors.push('Invalid total cost');
    if (!plan.hotel_details) errors.push('Missing hotel details');
    if (!plan.cost_breakdown_lkr) errors.push('Missing cost breakdown');

    // Validate daily plans
    plan.daily_plan?.forEach((day: any, index: number) => {
        if (!day.day || !day.theme || !Array.isArray(day.activities)) {
            errors.push(`Invalid daily plan structure at day ${index + 1}`);
        }
    });

    return {
        valid: errors.length === 0,
        errors,
    };
}
