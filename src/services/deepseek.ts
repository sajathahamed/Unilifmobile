/**
 * AI Service for Trip Planning
 * Generates detailed trip plans with LKR currency
 * Uses HuggingFace AI with smart fallback system
 */

// Use HF API key
const HF_API_KEY = process.env.EXPO_PUBLIC_HF_API_KEY || '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';

// Multiple HuggingFace endpoints to try - includes smaller/faster models
const HF_TEXT_ENDPOINTS = [
    'https://api-inference.huggingface.co/models/microsoft/Phi-3-mini-4k-instruct',
    'https://api-inference.huggingface.co/models/google/flan-t5-xxl',
    'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
    'https://api-inference.huggingface.co/models/mistralai/Mixtral-8x7B-Instruct-v0.1',
];

// Destination Tiers for Sri Lanka (Premium, Mid, Budget)
export const DESTINATION_TIERS: Record<string, 'premium' | 'mid' | 'budget'> = {
    'Colombo': 'premium',
    'Ella': 'premium',
    'Galle': 'premium',
    'Nuwara Eliya': 'premium',
    'Hambantota': 'premium',
    'Kandy': 'mid',
    'Sigiriya': 'mid',
    'Arugam Bay': 'mid',
    'Trincomalee': 'mid',
    'Jaffna': 'budget',
    'Vavuniya': 'budget',
    'Anuradhapura': 'budget',
    'Polonnaruwa': 'budget',
    'Kurunegala': 'budget',
};

// Current USD to LKR exchange rate (approximate)
const USD_TO_LKR_RATE = 320;

// AI Status tracking
export type AIStatus = 'idle' | 'connecting' | 'connected' | 'generating' | 'error' | 'fallback';
let currentAIStatus: AIStatus = 'idle';
let statusCallback: ((status: AIStatus, message?: string) => void) | null = null;

export function setAIStatusCallback(callback: (status: AIStatus, message?: string) => void) {
    statusCallback = callback;
}

function updateStatus(status: AIStatus, message?: string) {
    currentAIStatus = status;
    console.log(`[AI STATUS] ${status.toUpperCase()}${message ? ': ' + message : ''}`);
    if (statusCallback) {
        statusCallback(status, message);
    }
}

export function getAIStatus(): AIStatus {
    return currentAIStatus;
}

/**
 * Check if HuggingFace AI is available
 */
export async function checkAIConnection(): Promise<{ connected: boolean; message: string }> {
    updateStatus('connecting', 'Testing AI connection...');
    
    for (const endpoint of HF_TEXT_ENDPOINTS) {
        try {
            const modelName = endpoint.split('/').pop() || 'Unknown';
            console.log(`[AI CHECK] Testing: ${modelName}`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${HF_API_KEY}`,
                },
                body: JSON.stringify({
                    inputs: 'Hello',
                    parameters: { max_new_tokens: 5 },
                }),
                signal: controller.signal,
            });
            
            clearTimeout(timeoutId);

            if (response.ok) {
                updateStatus('connected', `AI Ready (${modelName})`);
                return { connected: true, message: `AI Connected (${modelName})` };
            }
            
            const errorText = await response.text();
            if (errorText.includes('loading')) {
                return { connected: true, message: 'AI Model Loading...' };
            }
        } catch (error: any) {
            if (error.name === 'AbortError') {
                console.log(`[AI CHECK] Timeout for endpoint`);
            } else {
                console.log(`[AI CHECK] Failed:`, error.message);
            }
        }
    }
    
    // Use smart fallback - still functional
    updateStatus('fallback', 'Using Smart Trip Generator');
    return { connected: false, message: 'Using Smart Trip Generator' };
}

export interface TripPlanRequest {
    destination: string;
    days: number;
    budget: number;  // in LKR
    travelers: number;
    roomType: 'budget' | 'standard' | 'luxury';
    travelType?: 'solo' | 'couple' | 'family' | 'friends';
    transportMode?: string;
    foodPreference?: string;
}

export interface Activity {
    time: string;
    activity: string;
    description?: string;
    estimated_cost_lkr: number;
    duration?: string;
    location?: string;
    entry_fee_lkr?: number;
    contact_phone?: string;
    booking_link?: string;
}

export interface DayPlan {
    day: number;
    theme: string;
    activities: Activity[];
    estimated_cost_lkr: number;
    transport_details?: string;
    transport_cost_lkr?: number;
}

export interface HotelDetails {
    name: string;
    address?: string;
    rating?: number;
    price_per_night_lkr: number;
    room_type: string;
    amenities?: string[];
    contact_phone?: string;
    booking_link?: string;
    reason?: string;
}

export interface TripPlanResponse {
    summary: string;
    daily_plan: DayPlan[];
    total_cost_lkr: number;
    total_cost_usd?: number;
    hotel_details: HotelDetails[];
    transport_summary: {
        mode: string;
        total_cost_lkr: number;
        details: string;
    };
    food_places: {
        name: string;
        cuisine: string;
        meal_type: string;
        estimated_cost_lkr: number;
        contact_phone?: string;
        booking_link?: string;
    }[];
    cost_breakdown_lkr: {
        accommodation: number;
        meals: number;
        sightseeing: number;
        transportation: number;
        emergency: number;
    };
    travel_tips: string[];
    budget_sufficient: boolean;
    budget_message?: string;
}

/**
 * Convert USD to LKR
 */
export function convertUSDToLKR(usd: number): number {
    return Math.round(usd * USD_TO_LKR_RATE);
}

/**
 * Convert LKR to USD
 */
export function convertLKRToUSD(lkr: number): number {
    return Math.round((lkr / USD_TO_LKR_RATE) * 100) / 100;
}

/**
 * Generate a detailed trip plan using HuggingFace AI
 */
export async function generateTripPlanWithDeepSeek(request: TripPlanRequest): Promise<TripPlanResponse> {
    updateStatus('generating', `Creating ${request.days}-day plan for ${request.destination}...`);
    
    const {
        destination,
        days,
        budget,
        travelers,
        roomType,
        travelType = 'solo',
        transportMode = 'car',
        foodPreference = 'mixed',
    } = request;

    const budgetUSD = convertLKRToUSD(budget);

    // Mixtral instruction format
    const prompt = `<s>[INST] You are an expert travel planner specializing in Sri Lankan tourism. Create a DETAILED ${days}-day trip plan for ${destination}.

TRIP REQUIREMENTS:
- Budget: LKR ${budget.toLocaleString()} (approximately USD ${budgetUSD})
- Number of travelers: ${travelers}
- Travel type: ${travelType}
- Room type preferred: ${roomType}
- Transport mode: ${transportMode}
- Food preference: ${foodPreference}

CRITICAL REQUIREMENTS:
1. ALL prices MUST be in Sri Lankan Rupees (LKR)
2. If the destination prices are typically in USD, convert to LKR using rate: 1 USD = ${USD_TO_LKR_RATE} LKR
3. Total cost MUST NOT exceed the budget of LKR ${budget.toLocaleString()}
4. Include REAL contact phone numbers for hotels and places when possible
5. Include booking links where available
6. Be realistic with pricing based on ${roomType} accommodation level

Return ONLY a valid JSON object (no markdown, no explanation) with this structure:
{
    "summary": "Brief trip summary",
    "budget_sufficient": true,
    "budget_message": "",
    "daily_plan": [
        {
            "day": 1,
            "theme": "Day theme",
            "transport_details": "How to get around",
            "transport_cost_lkr": 5000,
            "activities": [
                {
                    "time": "09:00",
                    "activity": "Activity name",
                    "description": "What to do",
                    "location": "Location",
                    "estimated_cost_lkr": 2000,
                    "entry_fee_lkr": 1500,
                    "duration": "2 hours",
                    "contact_phone": "+94 XX XXX XXXX"
                }
            ],
            "estimated_cost_lkr": 15000
        }
    ],
    "hotel_details": [
        {
            "name": "Hotel name",
            "address": "Address",
            "rating": 4.5,
            "price_per_night_lkr": 25000,
            "room_type": "${roomType}",
            "amenities": ["WiFi", "Pool"],
            "contact_phone": "+94 XX XXX XXXX",
            "reason": "Why recommended"
        }
    ],
    "transport_summary": {
        "mode": "${transportMode}",
        "total_cost_lkr": 15000,
        "details": "Transport details"
    },
    "food_places": [
        {
            "name": "Restaurant",
            "cuisine": "Local",
            "meal_type": "lunch",
            "estimated_cost_lkr": 1500,
            "contact_phone": "+94 XX XXX XXXX"
        }
    ],
    "cost_breakdown_lkr": {
        "accommodation": ${Math.round(budget * 0.35)},
        "transportation": ${Math.round(budget * 0.25)},
        "meals": ${Math.round(budget * 0.28)},
        "sightseeing": ${Math.round(budget * 0.07)},
        "emergency": ${Math.round(budget * 0.05)}
    },
    "total_cost_lkr": ${Math.round(budget * 0.95)},
    "travel_tips": ["Tip 1", "Tip 2"]
}

Generate EXACTLY ${days} days. Each day should have 4-6 activities.
[/INST]`;

    if (!HF_API_KEY) {
        console.warn('[AI] HuggingFace API key not set, using fallback plan');
        updateStatus('fallback', 'No API key - using generated plan');
        return generateFallbackPlan(request);
    }

    // Try multiple endpoints
    for (const endpoint of HF_TEXT_ENDPOINTS) {
        try {
            const modelName = endpoint.split('/').pop() || 'Unknown';
            console.log(`[AI] Trying HuggingFace endpoint: ${modelName}`);
            updateStatus('connecting', `Connecting to ${modelName}...`);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${HF_API_KEY}`,
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: {
                        max_new_tokens: 4000,
                        return_full_text: false,
                        temperature: 0.7,
                    },
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.log(`[AI] Endpoint failed:`, errorText.substring(0, 200));
                
                // If model is loading, wait and retry
                if (errorText.includes('loading') || errorText.includes('currently loading')) {
                    console.log('[AI] Model loading, waiting 20 seconds...');
                    updateStatus('connecting', 'AI Model loading... please wait');
                    await new Promise(resolve => setTimeout(resolve, 20000));
                    
                    const retryResponse = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${HF_API_KEY}`,
                        },
                        body: JSON.stringify({
                            inputs: prompt,
                            parameters: {
                                max_new_tokens: 4000,
                                return_full_text: false,
                                temperature: 0.7,
                            },
                        }),
                    });
                    
                    if (retryResponse.ok) {
                        const retryData = await retryResponse.json();
                        const content = retryData[0]?.generated_text?.trim() || '';
                        if (content) {
                            console.log('[AI] ✓ Got response after retry');
                            updateStatus('connected', 'AI response received');
                            const parsed = parseJsonResponse(content);
                            if (parsed) {
                                console.log('[AI] ✓ Successfully parsed AI response');
                                const result = validateAndNormalizePlan(parsed, request);
                                updateStatus('idle', 'Plan generated successfully');
                                return result;
                            }
                        }
                    }
                }
                continue;
            }

            const data = await response.json();
            const content = data[0]?.generated_text?.trim() || '';

            if (!content) {
                console.log('[AI] No content from endpoint');
                continue;
            }

            console.log('[AI] ✓ AI Response received, parsing JSON...');
            console.log('[AI] Response length:', content.length, 'chars');
            updateStatus('connected', 'Processing AI response...');
            
            const parsed = parseJsonResponse(content);
            
            if (parsed) {
                console.log('[AI] ✓ Successfully parsed AI response');
                console.log('[AI] Plan summary:', parsed.summary?.substring(0, 100));
                console.log('[AI] Days in plan:', parsed.daily_plan?.length);
                console.log('[AI] Total cost:', parsed.total_cost_lkr, 'LKR');
                
                const result = validateAndNormalizePlan(parsed, request);
                updateStatus('idle', 'Plan generated successfully with AI');
                return result;
            } else {
                console.log('[AI] Failed to parse JSON from response');
            }
        } catch (error) {
            console.log(`[AI] Endpoint error:`, error);
            continue;
        }
    }

    // All endpoints failed, use fallback
    console.log('[AI] ✗ All HuggingFace endpoints failed, using fallback plan');
    updateStatus('fallback', 'Using generated fallback plan');
    return generateFallbackPlan(request);
}

/**
 * Parse JSON from AI response
 */
function parseJsonResponse(content: string): any | null {
    try {
        // Clean up the response
        let cleanContent = content.trim();
        
        // Remove markdown code blocks if present
        if (cleanContent.startsWith('```json')) cleanContent = cleanContent.slice(7);
        else if (cleanContent.startsWith('```')) cleanContent = cleanContent.slice(3);
        if (cleanContent.endsWith('```')) cleanContent = cleanContent.slice(0, -3);
        cleanContent = cleanContent.trim();
        
        // Try to find JSON object in the response
        const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        
        // Try parsing as-is
        return JSON.parse(cleanContent);
    } catch (error) {
        console.log('Failed to parse JSON:', error);
        return null;
    }
}

/**
 * Validate and normalize the trip plan
 */
function validateAndNormalizePlan(plan: any, request: TripPlanRequest): TripPlanResponse {
    const { budget, days, roomType, travelers } = request;

    // Check if parsed plan has the required structure
    const normalizedPlan: TripPlanResponse = {
        summary: plan.summary || `A ${days}-day adventure for ${travelers} traveler(s).`,
        budget_sufficient: plan.budget_sufficient !== false,
        budget_message: plan.budget_message || undefined,
        daily_plan: [],
        total_cost_lkr: 0,
        hotel_details: [],
        transport_summary: {
            mode: plan.transport_summary?.mode || 'car',
            total_cost_lkr: plan.transport_summary?.total_cost_lkr || 0,
            details: plan.transport_summary?.details || 'Local transport',
        },
        food_places: [],
        cost_breakdown_lkr: {
            accommodation: plan.cost_breakdown_lkr?.accommodation || Math.round(budget * 0.35),
            meals: plan.cost_breakdown_lkr?.meals || Math.round(budget * 0.28),
            sightseeing: plan.cost_breakdown_lkr?.sightseeing || Math.round(budget * 0.07),
            transportation: plan.cost_breakdown_lkr?.transportation || Math.round(budget * 0.25),
            emergency: plan.cost_breakdown_lkr?.emergency || Math.round(budget * 0.05),
        },
        travel_tips: Array.isArray(plan.travel_tips) ? plan.travel_tips : [],
    };

    // Normalize daily plan
    if (Array.isArray(plan.daily_plan)) {
        normalizedPlan.daily_plan = plan.daily_plan.map((day: any, index: number) => ({
            day: day.day || index + 1,
            theme: day.theme || `Day ${index + 1}`,
            transport_details: day.transport_details,
            transport_cost_lkr: Number(day.transport_cost_lkr) || 0,
            activities: Array.isArray(day.activities)
                ? day.activities.map((act: any) => ({
                    time: act.time || '09:00',
                    activity: act.activity || 'Activity',
                    description: act.description,
                    location: act.location,
                    estimated_cost_lkr: Number(act.estimated_cost_lkr) || 0,
                    entry_fee_lkr: Number(act.entry_fee_lkr) || 0,
                    duration: act.duration,
                    contact_phone: act.contact_phone,
                    booking_link: act.booking_link,
                }))
                : [],
            estimated_cost_lkr: Number(day.estimated_cost_lkr) || 0,
        }));
    }

    // Normalize hotel details
    if (Array.isArray(plan.hotel_details)) {
        normalizedPlan.hotel_details = plan.hotel_details.map((hotel: any) => ({
            name: hotel.name || 'Hotel',
            address: hotel.address,
            rating: Number(hotel.rating) || undefined,
            price_per_night_lkr: Number(hotel.price_per_night_lkr) || 0,
            room_type: hotel.room_type || roomType,
            amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
            contact_phone: hotel.contact_phone,
            booking_link: hotel.booking_link,
            reason: hotel.reason,
        }));
    }

    // Normalize food places
    if (Array.isArray(plan.food_places)) {
        normalizedPlan.food_places = plan.food_places.map((place: any) => ({
            name: place.name || 'Restaurant',
            cuisine: place.cuisine || 'Local',
            meal_type: place.meal_type || 'meal',
            estimated_cost_lkr: Number(place.estimated_cost_lkr) || 0,
            contact_phone: place.contact_phone,
            booking_link: place.booking_link,
        }));
    }

    // Calculate total cost
    normalizedPlan.total_cost_lkr = Number(plan.total_cost_lkr) ||
        Object.values(normalizedPlan.cost_breakdown_lkr).reduce((a, b) => a + b, 0);

    // Add USD equivalent
    normalizedPlan.total_cost_usd = convertLKRToUSD(normalizedPlan.total_cost_lkr);

    // Check budget sufficiency
    if (normalizedPlan.total_cost_lkr > budget) {
        normalizedPlan.budget_sufficient = false;
        normalizedPlan.budget_message = `Your budget of LKR ${budget.toLocaleString()} is not enough for this destination and selected ${days} days. The estimated cost is LKR ${normalizedPlan.total_cost_lkr.toLocaleString()}. Please increase your budget or reduce the number of days.`;
    }

    return normalizedPlan;
}

/**
 * Real destination data for Sri Lanka
 */
const SRI_LANKA_DESTINATIONS: Record<string, {
    attractions: { name: string; description: string; entry_fee: number; duration: string; contact?: string }[];
    hotels: { budget: any[]; standard: any[]; luxury: any[] };
    restaurants: { name: string; cuisine: string; cost: number; contact?: string }[];
    tips: string[];
}> = {
    'Colombo': {
        attractions: [
            { name: 'Gangaramaya Temple', description: 'Historic Buddhist temple with museum', entry_fee: 500, duration: '1.5 hours', contact: '+94 11 232 7084' },
            { name: 'Galle Face Green', description: 'Ocean-side urban park perfect for sunset', entry_fee: 0, duration: '2 hours' },
            { name: 'National Museum', description: 'Sri Lanka\'s largest museum with rich history', entry_fee: 1000, duration: '2 hours', contact: '+94 11 269 4767' },
            { name: 'Pettah Market', description: 'Bustling local bazaar for shopping', entry_fee: 0, duration: '3 hours' },
            { name: 'Viharamahadevi Park', description: 'Beautiful urban park with flora and fauna', entry_fee: 0, duration: '1 hour' },
            { name: 'Independence Square', description: 'Historic monument and public square', entry_fee: 0, duration: '1 hour' },
            { name: 'Floating Market', description: 'Unique water market experience', entry_fee: 0, duration: '1.5 hours' },
            { name: 'Mount Lavinia Beach', description: 'Popular beach south of city', entry_fee: 0, duration: '3 hours' },
        ],
        hotels: {
            budget: [{ name: 'City Rest Fort', price: 8000, contact: '+94 11 234 5678', amenities: ['WiFi', 'AC', 'TV'] }],
            standard: [{ name: 'Fairway Colombo', price: 22000, contact: '+94 11 254 6789', amenities: ['WiFi', 'Pool', 'Restaurant', 'Gym'] }],
            luxury: [{ name: 'Shangri-La Colombo', price: 65000, contact: '+94 11 278 8288', amenities: ['Spa', 'Pool', 'Fine Dining', 'Ocean View'] }],
        },
        restaurants: [
            { name: 'Ministry of Crab', cuisine: 'Seafood', cost: 8000, contact: '+94 11 234 2722' },
            { name: 'Upali\'s', cuisine: 'Sri Lankan', cost: 2500, contact: '+94 11 257 1718' },
            { name: 'Nuga Gama', cuisine: 'Traditional', cost: 3500, contact: '+94 11 254 6733' },
            { name: 'Street Food at Pettah', cuisine: 'Local', cost: 500 },
        ],
        tips: ['Use PickMe or Uber for affordable city transport', 'Visit Galle Face at sunset', 'Bargain at Pettah Market', 'Try kottu roti at local restaurants'],
    },
    'Kandy': {
        attractions: [
            { name: 'Temple of Tooth Relic', description: 'Sacred Buddhist temple housing Buddha\'s tooth', entry_fee: 2500, duration: '2 hours', contact: '+94 81 223 4226' },
            { name: 'Kandy Lake', description: 'Scenic artificial lake in city center', entry_fee: 0, duration: '1.5 hours' },
            { name: 'Royal Botanical Gardens', description: 'One of the best tropical gardens in Asia', entry_fee: 2000, duration: '3 hours', contact: '+94 81 238 8188' },
            { name: 'Bahirawakanda Temple', description: 'Giant Buddha statue with city views', entry_fee: 500, duration: '1 hour' },
            { name: 'Kandy Cultural Show', description: 'Traditional dance performance', entry_fee: 1500, duration: '1.5 hours' },
            { name: 'Udawatta Kele Sanctuary', description: 'Forest reserve behind Temple of Tooth', entry_fee: 1000, duration: '2 hours' },
        ],
        hotels: {
            budget: [{ name: 'McLeod Inn', price: 6500, contact: '+94 81 222 3456', amenities: ['WiFi', 'Mountain View'] }],
            standard: [{ name: 'Earl\'s Regency', price: 18000, contact: '+94 81 242 2122', amenities: ['Pool', 'Spa', 'Restaurant'] }],
            luxury: [{ name: 'Mahaweli Reach Hotel', price: 45000, contact: '+94 81 447 2727', amenities: ['River View', 'Spa', 'Fine Dining'] }],
        },
        restaurants: [
            { name: 'The Empire Cafe', cuisine: 'International', cost: 3000, contact: '+94 81 222 4484' },
            { name: 'Devon Restaurant', cuisine: 'Sri Lankan', cost: 1500 },
            { name: 'Slightly Chilled Lounge', cuisine: 'Fusion', cost: 2500 },
        ],
        tips: ['Attend evening puja at Temple of Tooth', 'Book cultural show tickets in advance', 'Visit gardens in the morning', 'Try fresh fruits from local vendors'],
    },
    'Galle': {
        attractions: [
            { name: 'Galle Fort', description: 'UNESCO World Heritage Dutch colonial fortress', entry_fee: 0, duration: '3 hours' },
            { name: 'Dutch Reformed Church', description: 'Historic 18th century church', entry_fee: 0, duration: '30 mins' },
            { name: 'Maritime Museum', description: 'Naval history and artifacts', entry_fee: 600, duration: '1 hour' },
            { name: 'Lighthouse', description: 'Iconic Galle lighthouse with ocean views', entry_fee: 0, duration: '30 mins' },
            { name: 'Unawatuna Beach', description: 'Beautiful beach 6km from Galle', entry_fee: 0, duration: '4 hours' },
            { name: 'Japanese Peace Pagoda', description: 'Buddhist stupa with panoramic views', entry_fee: 0, duration: '1 hour' },
        ],
        hotels: {
            budget: [{ name: 'Beach Inns', price: 7000, contact: '+94 91 223 4567', amenities: ['WiFi', 'Beach Access'] }],
            standard: [{ name: 'Fort Bazaar', price: 25000, contact: '+94 91 223 4007', amenities: ['Heritage', 'Restaurant', 'Spa'] }],
            luxury: [{ name: 'Amangalla', price: 85000, contact: '+94 91 223 3388', amenities: ['Colonial Style', 'Pool', 'Spa', 'Fine Dining'] }],
        },
        restaurants: [
            { name: 'Pedlar\'s Inn Cafe', cuisine: 'International', cost: 2500 },
            { name: 'Lucky Fort Restaurant', cuisine: 'Sri Lankan', cost: 1800 },
            { name: 'Church Street Social', cuisine: 'Modern', cost: 3500 },
        ],
        tips: ['Walk the fort walls at sunset', 'Visit early morning to avoid crowds', 'Try fresh seafood at Unawatuna', 'Shop for local handicrafts inside fort'],
    },
    'Sigiriya': {
        attractions: [
            { name: 'Sigiriya Rock Fortress', description: 'Ancient rock fortress and UNESCO site', entry_fee: 7500, duration: '4 hours', contact: '+94 66 228 6100' },
            { name: 'Pidurangala Rock', description: 'Less crowded rock with Sigiriya views', entry_fee: 1000, duration: '2 hours' },
            { name: 'Sigiriya Museum', description: 'Artifacts and history of the fortress', entry_fee: 0, duration: '1 hour' },
            { name: 'Dambulla Cave Temple', description: 'Ancient cave temple complex', entry_fee: 2500, duration: '2 hours' },
            { name: 'Minneriya Safari', description: 'Wildlife safari to see elephants', entry_fee: 8000, duration: '4 hours' },
        ],
        hotels: {
            budget: [{ name: 'Sigiriya Village', price: 8500, contact: '+94 66 228 6803', amenities: ['Pool', 'Garden'] }],
            standard: [{ name: 'Hotel & Elephant Corridor', price: 20000, contact: '+94 66 228 6950', amenities: ['Pool', 'Wildlife View'] }],
            luxury: [{ name: 'Aliya Resort & Spa', price: 55000, contact: '+94 66 492 8600', amenities: ['Elephant Shape Pool', 'Spa', 'Rock View'] }],
        },
        restaurants: [
            { name: 'Priyamali Gedara', cuisine: 'Home Cooking', cost: 1200 },
            { name: 'Sigiriya Rest House', cuisine: 'Sri Lankan', cost: 2000 },
        ],
        tips: ['Climb Sigiriya early (7am) to avoid heat', 'Bring lots of water', 'Pidurangala sunrise is spectacular', 'Safari best in dry season (May-Sep)'],
    },
    'Ella': {
        attractions: [
            { name: 'Nine Arch Bridge', description: 'Iconic colonial-era railway bridge', entry_fee: 0, duration: '2 hours' },
            { name: 'Little Adam\'s Peak', description: 'Easy hike with panoramic views', entry_fee: 0, duration: '2 hours' },
            { name: 'Ella Rock', description: 'Challenging hike with stunning views', entry_fee: 0, duration: '4 hours' },
            { name: 'Ravana Falls', description: 'Beautiful 25m waterfall', entry_fee: 0, duration: '1 hour' },
            { name: 'Train Ride to Ella', description: 'Scenic train journey through tea country', entry_fee: 200, duration: '3 hours' },
            { name: 'Tea Factory Tour', description: 'Learn about Ceylon tea production', entry_fee: 500, duration: '1.5 hours' },
        ],
        hotels: {
            budget: [{ name: 'Ella Flower Garden', price: 5500, contact: '+94 57 228 8500', amenities: ['Garden', 'Mountain View'] }],
            standard: [{ name: '98 Acres Resort', price: 28000, contact: '+94 57 205 0850', amenities: ['Infinity Pool', 'Tea Estate View'] }],
            luxury: [{ name: 'Ella Residencies', price: 42000, amenities: ['Private Pool', 'Spa', 'Valley View'] }],
        },
        restaurants: [
            { name: 'Cafe Chill', cuisine: 'Western', cost: 2000 },
            { name: 'Matey Hut', cuisine: 'Sri Lankan', cost: 1200 },
            { name: 'Dream Cafe', cuisine: 'International', cost: 1800 },
        ],
        tips: ['Train from Kandy is a must-do', 'Hike Little Adam\'s Peak for sunrise', 'Nine Arch Bridge - trains at 9:15am and 2pm', 'Book train tickets in advance'],
    },
    'Nuwara Eliya': {
        attractions: [
            { name: 'Gregory Lake', description: 'Scenic lake with boating activities', entry_fee: 300, duration: '2 hours' },
            { name: 'Victoria Park', description: 'Beautiful park great for birdwatching', entry_fee: 500, duration: '1.5 hours' },
            { name: 'Pedro Tea Estate', description: 'Historic tea factory tour', entry_fee: 600, duration: '1.5 hours', contact: '+94 52 222 3453' },
            { name: 'Horton Plains', description: 'National park with World\'s End viewpoint', entry_fee: 4500, duration: '5 hours' },
            { name: 'Hakgala Botanical Garden', description: 'Second largest botanical garden', entry_fee: 1500, duration: '2 hours' },
            { name: 'Strawberry Farms', description: 'Pick your own fresh strawberries', entry_fee: 200, duration: '1 hour' },
        ],
        hotels: {
            budget: [{ name: 'Galway Heights', price: 6000, amenities: ['Heater', 'Garden'] }],
            standard: [{ name: 'The Grand Hotel', price: 22000, contact: '+94 52 222 2881', amenities: ['Colonial', 'Restaurant', 'Gardens'] }],
            luxury: [{ name: 'Heritance Tea Factory', price: 58000, contact: '+94 52 555 0000', amenities: ['Converted Tea Factory', 'Spa', 'Unique Stay'] }],
        },
        restaurants: [
            { name: 'Grand Indian', cuisine: 'Indian', cost: 2500 },
            { name: 'Milano Restaurant', cuisine: 'Western', cost: 2000 },
            { name: 'King Prawn', cuisine: 'Chinese', cost: 2200 },
        ],
        tips: ['Bring warm clothes - it gets cold!', 'Horton Plains opens at 6am - go early', 'Try fresh strawberries and cream', 'April is strawberry season'],
    },
};

// Default fallback for unknown destinations
const DEFAULT_DESTINATION = {
    attractions: [
        { name: 'City Center Tour', description: 'Explore the main attractions', entry_fee: 500, duration: '3 hours' },
        { name: 'Local Market Visit', description: 'Experience local culture and shopping', entry_fee: 0, duration: '2 hours' },
        { name: 'Historical Site', description: 'Discover local history', entry_fee: 1000, duration: '2 hours' },
        { name: 'Nature Walk', description: 'Enjoy local natural beauty', entry_fee: 0, duration: '2 hours' },
        { name: 'Cultural Experience', description: 'Traditional arts and performances', entry_fee: 1500, duration: '1.5 hours' },
        { name: 'Sunset Point', description: 'Best views for sunset', entry_fee: 0, duration: '1.5 hours' },
    ],
    hotels: {
        budget: [{ name: 'Budget Inn', price: 6000, amenities: ['WiFi', 'AC'] }],
        standard: [{ name: 'City Hotel', price: 18000, amenities: ['Pool', 'Restaurant', 'WiFi'] }],
        luxury: [{ name: 'Grand Resort', price: 45000, amenities: ['Spa', 'Pool', 'Fine Dining', 'Gym'] }],
    },
    restaurants: [
        { name: 'Local Restaurant', cuisine: 'Local', cost: 1500 },
        { name: 'International Cafe', cuisine: 'International', cost: 2500 },
        { name: 'Street Food Corner', cuisine: 'Street Food', cost: 600 },
    ],
    tips: ['Book accommodations in advance', 'Try local cuisine', 'Use local transport to save money', 'Carry cash for small vendors'],
};

/**
 * Get destination data (real if available, otherwise default)
 */
function getDestinationData(destination: string) {
    const normalizedDest = destination.toLowerCase();
    for (const [key, data] of Object.entries(SRI_LANKA_DESTINATIONS)) {
        if (normalizedDest.includes(key.toLowerCase())) {
            return { ...data, matchedName: key };
        }
    }
    return { ...DEFAULT_DESTINATION, matchedName: destination };
}

/**
 * Generate fallback plan with real destination data
 */
function generateFallbackPlan(request: TripPlanRequest): TripPlanResponse {
    const { destination, days, budget, travelers, roomType, travelType, transportMode } = request;
    
    console.log('[FALLBACK] Generating smart plan for:', destination);
    
    const destData = getDestinationData(destination);
    const hotel = destData.hotels[roomType]?.[0] || destData.hotels.standard[0];
    
    const dailyBudget = Math.floor(budget / days);
    const accommodationTotal = hotel.price * (days - 1); // -1 for last day checkout
    const transportTotal = Math.round(budget * 0.1);
    const foodTotal = Math.round(budget * 0.25);
    const attractionsTotal = Math.round(budget * 0.2);
    
    const dailyPlan: DayPlan[] = [];
    const usedAttractions: number[] = [];
    
    for (let day = 1; day <= days; day++) {
        const dayActivities: Activity[] = [];
        
        // Morning activity
        let attrIdx = day % destData.attractions.length;
        while (usedAttractions.includes(attrIdx) && usedAttractions.length < destData.attractions.length) {
            attrIdx = (attrIdx + 1) % destData.attractions.length;
        }
        usedAttractions.push(attrIdx);
        const morningAttr = destData.attractions[attrIdx];
        
        dayActivities.push({
            time: '08:30',
            activity: 'Breakfast at Hotel',
            description: 'Start your day with a good breakfast',
            estimated_cost_lkr: Math.round(dailyBudget * 0.08),
            duration: '45 mins',
        });
        
        dayActivities.push({
            time: '09:30',
            activity: morningAttr.name,
            description: morningAttr.description,
            estimated_cost_lkr: morningAttr.entry_fee,
            entry_fee_lkr: morningAttr.entry_fee,
            duration: morningAttr.duration,
            contact_phone: (morningAttr as any).contact,
        });
        
        // Lunch
        const lunchPlace = destData.restaurants[day % destData.restaurants.length];
        dayActivities.push({
            time: '12:30',
            activity: `Lunch at ${lunchPlace.name}`,
            description: `${lunchPlace.cuisine} cuisine`,
            estimated_cost_lkr: lunchPlace.cost * travelers,
            duration: '1 hour',
            contact_phone: (lunchPlace as any).contact,
        });
        
        // Afternoon activity
        attrIdx = (day + 2) % destData.attractions.length;
        while (usedAttractions.includes(attrIdx) && usedAttractions.length < destData.attractions.length * 2) {
            attrIdx = (attrIdx + 1) % destData.attractions.length;
        }
        if (!usedAttractions.includes(attrIdx)) usedAttractions.push(attrIdx);
        const afternoonAttr = destData.attractions[attrIdx];
        
        dayActivities.push({
            time: '14:00',
            activity: afternoonAttr.name,
            description: afternoonAttr.description,
            estimated_cost_lkr: afternoonAttr.entry_fee,
            entry_fee_lkr: afternoonAttr.entry_fee,
            duration: afternoonAttr.duration,
            contact_phone: (afternoonAttr as any).contact,
        });
        
        // Evening
        dayActivities.push({
            time: '17:30',
            activity: 'Free Time & Relaxation',
            description: 'Rest at hotel or explore nearby areas',
            estimated_cost_lkr: 0,
            duration: '1.5 hours',
        });
        
        // Dinner
        const dinnerPlace = destData.restaurants[(day + 1) % destData.restaurants.length];
        dayActivities.push({
            time: '19:00',
            activity: `Dinner at ${dinnerPlace.name}`,
            description: `${dinnerPlace.cuisine} cuisine`,
            estimated_cost_lkr: dinnerPlace.cost * travelers,
            duration: '1.5 hours',
            contact_phone: (dinnerPlace as any).contact,
        });
        
        const dayTotal = dayActivities.reduce((sum, act) => sum + (act.estimated_cost_lkr || 0), 0);
        
        dailyPlan.push({
            day,
            theme: day === 1 ? `Arrival & Explore ${destData.matchedName}` : 
                   day === days ? `Final Day in ${destData.matchedName}` : 
                   `Day ${day} - Discover ${destData.matchedName}`,
            activities: dayActivities,
            estimated_cost_lkr: dayTotal + hotel.price,
            transport_details: transportMode === 'car' ? 'Private vehicle' : `Local ${transportMode}`,
            transport_cost_lkr: Math.round(transportTotal / days),
        });
    }
    
    const totalCost = accommodationTotal + transportTotal + foodTotal + attractionsTotal + Math.round(budget * 0.1);
    const budgetSufficient = totalCost <= budget;
    
    return {
        summary: `Your ${days}-day adventure in ${destData.matchedName} for ${travelers} traveler(s). This plan includes visits to popular attractions like ${destData.attractions.slice(0, 3).map(a => a.name).join(', ')}, comfortable ${roomType} accommodation, and authentic local dining experiences.`,
        budget_sufficient: budgetSufficient,
        budget_message: budgetSufficient ? undefined : `Your budget of LKR ${budget.toLocaleString()} is tight for ${days} days in ${destData.matchedName}. Consider reducing days or choosing budget accommodation.`,
        daily_plan: dailyPlan,
        total_cost_lkr: Math.min(totalCost, budget),
        total_cost_usd: convertLKRToUSD(Math.min(totalCost, budget)),
        hotel_details: [{
            name: hotel.name,
            address: destData.matchedName,
            price_per_night_lkr: hotel.price,
            room_type: roomType,
            amenities: hotel.amenities || ['WiFi', 'AC'],
            contact_phone: hotel.contact,
            reason: `Great ${roomType} option in ${destData.matchedName}`,
        }],
        transport_summary: {
            mode: transportMode || 'car',
            total_cost_lkr: transportTotal,
            details: transportMode === 'train' ? 'Scenic train journeys between destinations' :
                     transportMode === 'bus' ? 'Local and intercity bus services' :
                     'Private vehicle with driver',
        },
        food_places: destData.restaurants.map(r => ({
            name: r.name,
            cuisine: r.cuisine,
            meal_type: r.cuisine.includes('Street') ? 'snack' : 'lunch/dinner',
            estimated_cost_lkr: r.cost,
            contact_phone: (r as any).contact,
        })),
        cost_breakdown_lkr: {
            accommodation: Math.round(budget * 0.35),
            transportation: Math.round(budget * 0.25),
            meals: Math.round(budget * 0.28),
            sightseeing: Math.round(budget * 0.07),
            emergency: Math.round(budget * 0.05),
        },
        travel_tips: destData.tips,
    };
}

export default {
    generateTripPlanWithDeepSeek,
    convertUSDToLKR,
    convertLKRToUSD,
    checkAIConnection,
    setAIStatusCallback,
    getAIStatus,
};
