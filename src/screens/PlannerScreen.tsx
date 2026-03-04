import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    Modal,
    TextInput,
    ScrollView,
    Image,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { useAuth } from '@context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// API Keys from environment (Frontend only - no backend needed!)
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GENAI_API_KEY || '';

// Option types
const TRAVEL_TYPES = [
    { id: 'solo', label: 'Solo', icon: 'person-outline' },
    { id: 'couple', label: 'Couple', icon: 'heart-outline' },
    { id: 'family', label: 'Family', icon: 'people-outline' },
    { id: 'friends', label: 'Friends', icon: 'happy-outline' },
];

const ACCOMMODATION_TYPES = [
    { id: 'budget', label: 'Budget', icon: 'wallet-outline' },
    { id: 'standard', label: 'Standard', icon: 'home-outline' },
    { id: 'luxury', label: 'Luxury', icon: 'diamond-outline' },
];

const TRANSPORT_MODES = [
    { id: 'bus', label: 'Bus', icon: 'bus-outline' },
    { id: 'train', label: 'Train', icon: 'train-outline' },
    { id: 'car', label: 'Car', icon: 'car-outline' },
    { id: 'flight', label: 'Flight', icon: 'airplane-outline' },
];

const FOOD_PREFERENCES = [
    { id: 'veg', label: 'Veg', icon: 'leaf-outline' },
    { id: 'non-veg', label: 'Non-Veg', icon: 'restaurant-outline' },
    { id: 'mixed', label: 'Mixed', icon: 'fast-food-outline' },
];

const STATUS_COLORS: Record<string, string> = {
    planning: '#6366F1',
    booked: '#22C55E',
    completed: '#14B8A6',
    cancelled: '#EF4444',
};

// Types
interface PlacePrediction {
    placeId: string;
    description: string;
    mainText?: string;
    secondaryText?: string;
}

interface PlaceDetails {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    rating?: number;
    photoUrl?: string;
}

interface Activity {
    time: string;
    activity: string;
    description?: string;
    estimated_cost: number;
    duration?: string;
}

interface DayPlan {
    day: number;
    theme?: string;
    activities: Activity[];
    estimated_cost: number;
}

interface TripPlan {
    summary: string;
    daily_plan: DayPlan[];
    total_estimated_cost: number;
    recommended_hotels: any[];
    recommended_food_places: any[];
    travel_tips: string[];
    budget_breakdown?: Record<string, number>;
}

interface Trip {
    id: number;
    destination: string;
    place_id?: string;
    latitude?: number;
    longitude?: number;
    duration: number;
    budget: number;
    travel_type?: string;
    accommodation_type?: string;
    transport_mode?: string;
    food_preference?: string;
    total_estimated_cost?: number;
    status?: string;
    ai_summary?: string;
    trip_plan?: TripPlan;
    created_at?: string;
}

// ============================================
// DIRECT API CALLS (No Backend Required!)
// ============================================

/**
 * Search places using Google Places Autocomplete API
 */
async function searchPlacesAPI(query: string): Promise<PlacePrediction[]> {
    if (!GOOGLE_PLACES_API_KEY) {
        console.warn('Google Places API key not set');
        return [];
    }

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${GOOGLE_PLACES_API_KEY}`
        );
        const data = await response.json();

        if (data.status === 'OK' && data.predictions) {
            return data.predictions.map((p: any) => ({
                placeId: p.place_id,
                description: p.description,
                mainText: p.structured_formatting?.main_text,
                secondaryText: p.structured_formatting?.secondary_text,
            }));
        }
        return [];
    } catch (error) {
        console.error('Places search error:', error);
        return [];
    }
}

/**
 * Get place details from Google Places API
 */
async function getPlaceDetailsAPI(placeId: string): Promise<PlaceDetails | null> {
    if (!GOOGLE_PLACES_API_KEY) return null;

    try {
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,rating,photos&key=${GOOGLE_PLACES_API_KEY}`
        );
        const data = await response.json();

        if (data.status === 'OK' && data.result) {
            const result = data.result;
            return {
                name: result.name,
                address: result.formatted_address,
                latitude: result.geometry?.location?.lat,
                longitude: result.geometry?.location?.lng,
                rating: result.rating,
                photoUrl: result.photos?.[0]
                    ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${result.photos[0].photo_reference}&key=${GOOGLE_PLACES_API_KEY}`
                    : undefined,
            };
        }
        return null;
    } catch (error) {
        console.error('Place details error:', error);
        return null;
    }
}

/**
 * Generate trip plan using Gemini AI (Direct API call)
 */
async function generateTripPlanWithGemini(tripData: {
    destination: string;
    duration: number;
    budget: number;
    travelType: string;
    accommodationType: string;
    transportMode: string;
    foodPreference: string;
}): Promise<TripPlan> {
    const { destination, duration, budget, travelType, accommodationType, transportMode, foodPreference } = tripData;

    const prompt = `You are an expert travel planner. Create a detailed ${duration}-day trip plan for ${destination}.

TRIP DETAILS:
- Budget: RM ${budget}
- Travel Type: ${travelType}
- Accommodation: ${accommodationType}
- Transport: ${transportMode}
- Food Preference: ${foodPreference}

IMPORTANT: Return ONLY valid JSON without any markdown formatting or code blocks. The response must be a single JSON object.

Generate a response with this exact JSON structure:
{
    "summary": "A brief 2-3 sentence summary of the trip",
    "daily_plan": [
        {
            "day": 1,
            "theme": "Day theme (e.g., City Exploration)",
            "activities": [
                {
                    "time": "09:00",
                    "activity": "Activity name",
                    "description": "Brief description",
                    "estimated_cost": 50,
                    "duration": "2 hours"
                }
            ],
            "estimated_cost": 200
        }
    ],
    "total_estimated_cost": ${Math.round(budget * 0.9)},
    "recommended_hotels": [
        {
            "name": "Hotel name",
            "reason": "Why this hotel fits the budget/style",
            "estimated_cost_per_night": 150
        }
    ],
    "recommended_food_places": [
        {
            "name": "Restaurant name",
            "cuisine": "Type of cuisine",
            "meal_type": "breakfast/lunch/dinner",
            "estimated_cost": 30
        }
    ],
    "travel_tips": [
        "Tip 1",
        "Tip 2",
        "Tip 3",
        "Tip 4",
        "Tip 5"
    ],
    "budget_breakdown": {
        "accommodation": ${Math.round(budget * 0.35)},
        "food": ${Math.round(budget * 0.25)},
        "attractions": ${Math.round(budget * 0.2)},
        "transport": ${Math.round(budget * 0.1)},
        "miscellaneous": ${Math.round(budget * 0.1)}
    }
}

REQUIREMENTS:
1. Total estimated cost MUST stay within budget of RM ${budget}
2. Activities should be appropriate for ${travelType} travel
3. Accommodations should match ${accommodationType} preferences
4. Food suggestions should consider ${foodPreference} preference
5. Include realistic local prices in Malaysian Ringgit (RM)
6. Each day should have 4-6 activities
7. Generate exactly ${duration} days`;

    if (!GEMINI_API_KEY) {
        // Return fallback plan if no API key
        return generateFallbackPlan(tripData);
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 4096,
                    },
                }),
            }
        );

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error('No response from Gemini');
            return generateFallbackPlan(tripData);
        }

        // Parse the JSON response
        let cleanText = text.trim();
        if (cleanText.startsWith('```json')) cleanText = cleanText.slice(7);
        else if (cleanText.startsWith('```')) cleanText = cleanText.slice(3);
        if (cleanText.endsWith('```')) cleanText = cleanText.slice(0, -3);
        cleanText = cleanText.trim();

        const parsed = JSON.parse(cleanText);
        return validateTripPlan(parsed);
    } catch (error) {
        console.error('Gemini API error:', error);
        return generateFallbackPlan(tripData);
    }
}

/**
 * Validate and normalize trip plan structure
 */
function validateTripPlan(plan: any): TripPlan {
    return {
        summary: plan.summary || 'Trip plan generated successfully.',
        daily_plan: Array.isArray(plan.daily_plan)
            ? plan.daily_plan.map((day: any, index: number) => ({
                  day: day.day || index + 1,
                  theme: day.theme || `Day ${index + 1}`,
                  activities: Array.isArray(day.activities)
                      ? day.activities.map((act: any) => ({
                            time: act.time || '09:00',
                            activity: act.activity || 'Activity',
                            description: act.description || '',
                            estimated_cost: Number(act.estimated_cost) || 0,
                            duration: act.duration || '1 hour',
                        }))
                      : [],
                  estimated_cost: Number(day.estimated_cost) || 0,
              }))
            : [],
        total_estimated_cost: Number(plan.total_estimated_cost) || 0,
        recommended_hotels: Array.isArray(plan.recommended_hotels) ? plan.recommended_hotels : [],
        recommended_food_places: Array.isArray(plan.recommended_food_places) ? plan.recommended_food_places : [],
        travel_tips: Array.isArray(plan.travel_tips) ? plan.travel_tips : [],
        budget_breakdown: plan.budget_breakdown || {},
    };
}

/**
 * Generate fallback plan without AI
 */
function generateFallbackPlan(tripData: {
    destination: string;
    duration: number;
    budget: number;
    travelType: string;
    accommodationType: string;
    transportMode: string;
    foodPreference: string;
}): TripPlan {
    const { destination, duration, budget, travelType, accommodationType } = tripData;
    const dailyCost = Math.floor(budget / duration);
    const dailyPlan: DayPlan[] = [];

    const activities = [
        'Visit local landmark',
        'Explore city center',
        'Try local cuisine',
        'Shopping at market',
        'Visit museum/gallery',
        'Nature walk/park',
        'Cultural experience',
        'Sunset viewing spot',
    ];

    for (let day = 1; day <= duration; day++) {
        const dayActivities: Activity[] = [
            { time: '09:00', activity: activities[(day * 4) % activities.length], description: 'Morning activity', estimated_cost: dailyCost * 0.15, duration: '2 hours' },
            { time: '12:00', activity: 'Lunch at local restaurant', description: 'Try local specialties', estimated_cost: dailyCost * 0.1, duration: '1 hour' },
            { time: '14:00', activity: activities[(day * 4 + 1) % activities.length], description: 'Afternoon exploration', estimated_cost: dailyCost * 0.2, duration: '3 hours' },
            { time: '17:00', activity: activities[(day * 4 + 2) % activities.length], description: 'Evening activity', estimated_cost: dailyCost * 0.15, duration: '2 hours' },
            { time: '19:30', activity: 'Dinner', description: 'Evening meal', estimated_cost: dailyCost * 0.15, duration: '1.5 hours' },
        ];

        dailyPlan.push({
            day,
            theme: `Day ${day} - Explore ${destination}`,
            activities: dayActivities,
            estimated_cost: dailyCost,
        });
    }

    const hotelCostPerNight = accommodationType === 'luxury' ? 400 : accommodationType === 'standard' ? 200 : 100;

    return {
        summary: `A ${duration}-day adventure in ${destination} perfect for ${travelType} travelers. This itinerary covers popular attractions, local cuisine, and memorable experiences within your RM ${budget} budget.`,
        daily_plan: dailyPlan,
        total_estimated_cost: budget * 0.9,
        recommended_hotels: [
            { name: `${accommodationType.charAt(0).toUpperCase() + accommodationType.slice(1)} Hotel ${destination}`, reason: 'Great location and value', estimated_cost_per_night: hotelCostPerNight },
            { name: `${destination} Inn`, reason: 'Central location with good reviews', estimated_cost_per_night: hotelCostPerNight * 0.9 },
        ],
        recommended_food_places: [
            { name: 'Local Street Food Market', cuisine: 'Street Food', meal_type: 'lunch/dinner', estimated_cost: 20 },
            { name: `${destination} Traditional Restaurant`, cuisine: 'Local', meal_type: 'dinner', estimated_cost: 50 },
            { name: 'Cafe District', cuisine: 'Cafe/Breakfast', meal_type: 'breakfast', estimated_cost: 25 },
        ],
        travel_tips: [
            'Book accommodations in advance for better rates',
            'Try local street food for authentic experiences',
            'Use public transport or ride-sharing apps to save money',
            'Keep some cash for small vendors',
            'Download offline maps before your trip',
        ],
        budget_breakdown: {
            accommodation: Math.floor(budget * 0.35),
            food: Math.floor(budget * 0.25),
            attractions: Math.floor(budget * 0.2),
            transport: Math.floor(budget * 0.1),
            miscellaneous: Math.floor(budget * 0.1),
        },
    };
}

// ============================================
// MAIN COMPONENT
// ============================================

export const PlannerScreen: React.FC = () => {
    const { theme } = useTheme();
    const { userProfile } = useAuth();
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Trip list state
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);

    // Form modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form fields
    const [destination, setDestination] = useState('');
    const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
    const [placeId, setPlaceId] = useState('');
    const [duration, setDuration] = useState('');
    const [budget, setBudget] = useState('');
    const [travelType, setTravelType] = useState('solo');
    const [accommodationType, setAccommodationType] = useState('standard');
    const [transportMode, setTransportMode] = useState('car');
    const [foodPreference, setFoodPreference] = useState('mixed');

    // Search autocomplete state
    const [searchQuery, setSearchQuery] = useState('');
    const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showPredictions, setShowPredictions] = useState(false);

    // AI Plan result state
    const [generatingPlan, setGeneratingPlan] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<TripPlan | null>(null);
    const [planModalVisible, setPlanModalVisible] = useState(false);
    const [currentTripMeta, setCurrentTripMeta] = useState<any>(null);

    // Debounced place search (Direct Google Places API)
    const searchPlaces = useCallback(async (query: string) => {
        if (query.length < 2) {
            setPredictions([]);
            return;
        }

        setSearchLoading(true);
        const results = await searchPlacesAPI(query);
        setPredictions(results);
        setShowPredictions(results.length > 0);
        setSearchLoading(false);
    }, []);

    // Handle search input change with debounce
    const handleSearchChange = (text: string) => {
        setSearchQuery(text);
        setDestination(text);

        if (searchTimeout.current) {
            clearTimeout(searchTimeout.current);
        }

        searchTimeout.current = setTimeout(() => {
            searchPlaces(text);
        }, 300);
    };

    // Select a place from predictions (Direct Google Places API)
    const selectPlace = async (prediction: PlacePrediction) => {
        setDestination(prediction.description);
        setSearchQuery(prediction.description);
        setPlaceId(prediction.placeId);
        setShowPredictions(false);
        setPredictions([]);

        const details = await getPlaceDetailsAPI(prediction.placeId);
        if (details) {
            setSelectedPlace(details);
        }
    };

    // Validate form
    const validateForm = (): string | null => {
        if (!destination.trim()) return 'Please enter a destination';

        const daysNum = parseInt(duration);
        if (isNaN(daysNum) || daysNum < 1) return 'Duration must be at least 1 day';
        if (daysNum > 30) return 'Duration cannot exceed 30 days';

        const budgetNum = parseFloat(budget);
        if (isNaN(budgetNum) || budgetNum <= 0) return 'Budget must be greater than 0';

        return null;
    };

    // Generate trip plan (Direct Gemini API - No backend!)
    const handleGeneratePlan = async () => {
        const error = validateForm();
        if (error) {
            Alert.alert('Validation Error', error);
            return;
        }

        setSubmitting(true);
        setGeneratingPlan(true);

        try {
            const tripPlan = await generateTripPlanWithGemini({
                destination: destination.trim(),
                duration: parseInt(duration),
                budget: parseFloat(budget),
                travelType,
                accommodationType,
                transportMode,
                foodPreference,
            });

            setCurrentPlan(tripPlan);
            setCurrentTripMeta({
                destination: destination.trim(),
                duration: parseInt(duration),
                budget: parseFloat(budget),
                travelType,
                accommodationType,
            });

            // Save to trips list
            const newTrip: Trip = {
                id: Date.now(),
                destination: destination.trim(),
                place_id: placeId,
                latitude: selectedPlace?.latitude,
                longitude: selectedPlace?.longitude,
                duration: parseInt(duration),
                budget: parseFloat(budget),
                travel_type: travelType,
                accommodation_type: accommodationType,
                transport_mode: transportMode,
                food_preference: foodPreference,
                total_estimated_cost: tripPlan.total_estimated_cost,
                status: 'planning',
                ai_summary: tripPlan.summary,
                trip_plan: tripPlan,
                created_at: new Date().toISOString(),
            };

            setTrips((prev) => [newTrip, ...prev]);
            setModalVisible(false);
            setPlanModalVisible(true);
            resetForm();
        } catch (error: any) {
            console.error('Generate plan error:', error);
            Alert.alert('Error', error.message || 'Failed to generate trip plan. Please try again.');
        }

        setSubmitting(false);
        setGeneratingPlan(false);
    };

    // Reset form
    const resetForm = () => {
        setDestination('');
        setSearchQuery('');
        setSelectedPlace(null);
        setPlaceId('');
        setDuration('');
        setBudget('');
        setTravelType('solo');
        setAccommodationType('standard');
        setTransportMode('car');
        setFoodPreference('mixed');
        setPredictions([]);
        setShowPredictions(false);
    };

    // View existing trip plan
    const viewTripPlan = (trip: Trip) => {
        if (trip.trip_plan) {
            setCurrentPlan(trip.trip_plan);
            setCurrentTripMeta({
                destination: trip.destination,
                duration: trip.duration,
                budget: trip.budget,
                travelType: trip.travel_type,
                accommodationType: trip.accommodation_type,
            });
            setPlanModalVisible(true);
        } else {
            Alert.alert('No Plan', 'This trip does not have a generated plan yet.');
        }
    };

    // Option selector component
    const OptionSelector = ({
        title,
        options,
        value,
        onChange,
    }: {
        title: string;
        options: { id: string; label: string; icon: string }[];
        value: string;
        onChange: (val: string) => void;
    }) => (
        <View style={styles.optionSection}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{title}</Text>
            <View style={styles.optionRow}>
                {options.map((opt) => (
                    <TouchableOpacity
                        key={opt.id}
                        style={[
                            styles.optionBtn,
                            {
                                backgroundColor: value === opt.id ? theme.colors.primary + '20' : theme.colors.backgroundSecondary,
                                borderColor: value === opt.id ? theme.colors.primary : theme.colors.border,
                            },
                        ]}
                        onPress={() => onChange(opt.id)}
                    >
                        <Ionicons
                            name={opt.icon as any}
                            size={18}
                            color={value === opt.id ? theme.colors.primary : theme.colors.textSecondary}
                        />
                        <Text style={[styles.optionLabel, { color: value === opt.id ? theme.colors.primary : theme.colors.text }]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    // Load trips
    useEffect(() => {
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Trip Planner</Text>
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.primary }]} onPress={() => setModalVisible(true)}>
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <ResponsiveContainer>
                {trips.length === 0 ? (
                    <View style={styles.center}>
                        <Ionicons name="map-outline" size={64} color={theme.colors.border} />
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No trips planned yet</Text>
                        <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
                            Create your first AI-powered trip plan!
                        </Text>
                        <Button label="Plan a Trip" onPress={() => setModalVisible(true)} />
                    </View>
                ) : (
                    <FlatList
                        data={trips}
                        keyExtractor={(item) => String(item.id)}
                        contentContainerStyle={{ padding: 16 }}
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => viewTripPlan(item)}>
                                <Card elevated>
                                    <View style={styles.tripCard}>
                                        <View
                                            style={[styles.iconBox, { backgroundColor: STATUS_COLORS[item.status ?? 'planning'] + '20' }]}
                                        >
                                            <Ionicons name="airplane-outline" size={28} color={STATUS_COLORS[item.status ?? 'planning']} />
                                        </View>
                                        <View style={styles.tripInfo}>
                                            <Text style={[styles.destText, { color: theme.colors.text }]}>{item.destination}</Text>
                                            <Text style={[styles.tripMeta, { color: theme.colors.textSecondary }]}>
                                                {item.duration} day{item.duration > 1 ? 's' : ''} · RM {item.budget.toFixed(0)}
                                            </Text>
                                            <View style={styles.tripTags}>
                                                <View style={[styles.tag, { backgroundColor: theme.colors.backgroundSecondary }]}>
                                                    <Ionicons name="person-outline" size={10} color={theme.colors.textSecondary} />
                                                    <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>
                                                        {item.travel_type}
                                                    </Text>
                                                </View>
                                                <View style={[styles.tag, { backgroundColor: theme.colors.backgroundSecondary }]}>
                                                    <Ionicons name="home-outline" size={10} color={theme.colors.textSecondary} />
                                                    <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>
                                                        {item.accommodation_type}
                                                    </Text>
                                                </View>
                                            </View>
                                            {item.trip_plan && (
                                                <View style={[styles.aiBadge, { backgroundColor: theme.colors.success + '15' }]}>
                                                    <Ionicons name="sparkles" size={12} color={theme.colors.success} />
                                                    <Text style={[styles.aiBadgeText, { color: theme.colors.success }]}>View AI Plan</Text>
                                                </View>
                                            )}
                                        </View>
                                        <View
                                            style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status ?? 'planning'] + '20' }]}
                                        >
                                            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status ?? 'planning'] }]}>
                                                {item.status?.charAt(0).toUpperCase()}
                                                {item.status?.slice(1)}
                                            </Text>
                                        </View>
                                    </View>
                                </Card>
                            </TouchableOpacity>
                        )}
                    />
                )}
            </ResponsiveContainer>

            {/* New Trip Form Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
                    <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Plan a Trip</Text>
                            <TouchableOpacity
                                onPress={() => {
                                    setModalVisible(false);
                                    resetForm();
                                }}
                            >
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>
                            {/* Destination Search */}
                            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Destination *</Text>
                            <View style={styles.searchContainer}>
                                <View
                                    style={[
                                        styles.searchInput,
                                        { borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundSecondary },
                                    ]}
                                >
                                    <Ionicons name="search-outline" size={18} color={theme.colors.textSecondary} />
                                    <TextInput
                                        value={searchQuery}
                                        onChangeText={handleSearchChange}
                                        placeholder="Search for a city..."
                                        placeholderTextColor={theme.colors.placeholder}
                                        style={[styles.searchTextInput, { color: theme.colors.text }]}
                                        onFocus={() => searchQuery.length >= 2 && setShowPredictions(true)}
                                    />
                                    {searchLoading && <ActivityIndicator size="small" color={theme.colors.primary} />}
                                </View>

                                {/* Predictions dropdown */}
                                {showPredictions && predictions.length > 0 && (
                                    <View
                                        style={[
                                            styles.predictionsContainer,
                                            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                                        ]}
                                    >
                                        {predictions.map((pred, idx) => (
                                            <TouchableOpacity
                                                key={pred.placeId || idx}
                                                style={[
                                                    styles.predictionItem,
                                                    idx < predictions.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border },
                                                ]}
                                                onPress={() => selectPlace(pred)}
                                            >
                                                <Ionicons name="location-outline" size={18} color={theme.colors.primary} />
                                                <View style={styles.predictionText}>
                                                    <Text style={[styles.predictionMain, { color: theme.colors.text }]}>
                                                        {pred.mainText || pred.description.split(',')[0]}
                                                    </Text>
                                                    {pred.secondaryText && (
                                                        <Text style={[styles.predictionSecondary, { color: theme.colors.textSecondary }]}>
                                                            {pred.secondaryText}
                                                        </Text>
                                                    )}
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </View>

                            {/* Selected place preview */}
                            {selectedPlace && (
                                <View
                                    style={[
                                        styles.selectedPlaceCard,
                                        { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border },
                                    ]}
                                >
                                    {selectedPlace.photoUrl && <Image source={{ uri: selectedPlace.photoUrl }} style={styles.placePhoto} />}
                                    <View style={styles.placeInfo}>
                                        <Text style={[styles.placeName, { color: theme.colors.text }]}>{selectedPlace.name}</Text>
                                        <Text style={[styles.placeAddress, { color: theme.colors.textSecondary }]}>{selectedPlace.address}</Text>
                                        {selectedPlace.rating && (
                                            <View style={styles.ratingRow}>
                                                <Ionicons name="star" size={14} color="#F59E0B" />
                                                <Text style={[styles.ratingText, { color: theme.colors.text }]}>{selectedPlace.rating}</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}

                            {/* Duration */}
                            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Duration (days) *</Text>
                            <TextInput
                                value={duration}
                                onChangeText={setDuration}
                                keyboardType="number-pad"
                                placeholder="1-30 days"
                                placeholderTextColor={theme.colors.placeholder}
                                style={[
                                    styles.input,
                                    { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.backgroundSecondary },
                                ]}
                                maxLength={2}
                            />

                            {/* Budget */}
                            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Budget (RM) *</Text>
                            <TextInput
                                value={budget}
                                onChangeText={setBudget}
                                keyboardType="decimal-pad"
                                placeholder="e.g. 1500"
                                placeholderTextColor={theme.colors.placeholder}
                                style={[
                                    styles.input,
                                    { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.backgroundSecondary },
                                ]}
                            />

                            {/* Travel Type */}
                            <OptionSelector title="Travel Type" options={TRAVEL_TYPES} value={travelType} onChange={setTravelType} />

                            {/* Accommodation */}
                            <OptionSelector
                                title="Accommodation"
                                options={ACCOMMODATION_TYPES}
                                value={accommodationType}
                                onChange={setAccommodationType}
                            />

                            {/* Transport */}
                            <OptionSelector title="Transport Mode" options={TRANSPORT_MODES} value={transportMode} onChange={setTransportMode} />

                            {/* Food Preference */}
                            <OptionSelector
                                title="Food Preference"
                                options={FOOD_PREFERENCES}
                                value={foodPreference}
                                onChange={setFoodPreference}
                            />

                            {/* Submit Buttons */}
                            <View style={styles.modalBtns}>
                                <Button
                                    label="Cancel"
                                    variant="outline"
                                    onPress={() => {
                                        setModalVisible(false);
                                        resetForm();
                                    }}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    label={submitting ? 'Generating...' : 'Generate Plan'}
                                    onPress={handleGeneratePlan}
                                    disabled={submitting}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </ScrollView>

                        {/* Loading overlay */}
                        {generatingPlan && (
                            <View style={styles.loadingOverlay}>
                                <View style={[styles.loadingBox, { backgroundColor: theme.colors.surface }]}>
                                    <ActivityIndicator size="large" color={theme.colors.primary} />
                                    <Text style={[styles.loadingText, { color: theme.colors.text }]}>
                                        Creating your personalized trip plan...
                                    </Text>
                                    <Text style={[styles.loadingSubtext, { color: theme.colors.textSecondary }]}>
                                        AI is analyzing your preferences
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Trip Plan Result Modal */}
            <Modal visible={planModalVisible} transparent animationType="fade">
                <View style={styles.planOverlay}>
                    <View style={[styles.planModal, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.planHeader}>
                            <View>
                                <Text style={[styles.planTitle, { color: theme.colors.text }]}>
                                    <Ionicons name="sparkles" size={20} color={theme.colors.primary} /> Your Trip Plan
                                </Text>
                                {currentTripMeta && (
                                    <Text style={[styles.planSubtitle, { color: theme.colors.textSecondary }]}>
                                        {currentTripMeta.destination} · {currentTripMeta.duration} days · RM {currentTripMeta.budget}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={() => setPlanModalVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
                            {currentPlan && (
                                <>
                                    {/* Summary */}
                                    <View
                                        style={[styles.summaryCard, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary }]}
                                    >
                                        <Text style={[styles.summaryTitle, { color: theme.colors.primary }]}>Trip Summary</Text>
                                        <Text style={[styles.summaryText, { color: theme.colors.text }]}>{currentPlan.summary}</Text>
                                    </View>

                                    {/* Cost Overview */}
                                    <View style={[styles.costCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
                                        <View style={styles.costHeader}>
                                            <Ionicons name="wallet-outline" size={20} color={theme.colors.success} />
                                            <Text style={[styles.costTitle, { color: theme.colors.text }]}>Total Estimated Cost</Text>
                                        </View>
                                        <Text style={[styles.costAmount, { color: theme.colors.success }]}>
                                            RM {currentPlan.total_estimated_cost?.toFixed(2) || '0.00'}
                                        </Text>

                                        {currentPlan.budget_breakdown && (
                                            <View style={styles.breakdownGrid}>
                                                {Object.entries(currentPlan.budget_breakdown).map(([key, value]) => (
                                                    <View key={key} style={styles.breakdownItem}>
                                                        <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
                                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                                        </Text>
                                                        <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                                                            RM {(value as number).toFixed(0)}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>

                                    {/* Daily Itinerary */}
                                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                        <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} /> Day-by-Day Itinerary
                                    </Text>

                                    {currentPlan.daily_plan?.map((day, idx) => (
                                        <View
                                            key={idx}
                                            style={[styles.dayCard, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}
                                        >
                                            <View style={styles.dayHeader}>
                                                <View style={[styles.dayBadge, { backgroundColor: theme.colors.primary }]}>
                                                    <Text style={styles.dayBadgeText}>Day {day.day}</Text>
                                                </View>
                                                {day.theme && (
                                                    <Text style={[styles.dayTheme, { color: theme.colors.textSecondary }]}>{day.theme}</Text>
                                                )}
                                                <Text style={[styles.dayCost, { color: theme.colors.success }]}>RM {day.estimated_cost}</Text>
                                            </View>

                                            {day.activities?.map((activity, actIdx) => (
                                                <View key={actIdx} style={styles.activityItem}>
                                                    <View style={[styles.activityTime, { backgroundColor: theme.colors.primary + '15' }]}>
                                                        <Text style={[styles.activityTimeText, { color: theme.colors.primary }]}>{activity.time}</Text>
                                                    </View>
                                                    <View style={styles.activityContent}>
                                                        <Text style={[styles.activityName, { color: theme.colors.text }]}>{activity.activity}</Text>
                                                        {activity.description && (
                                                            <Text style={[styles.activityDesc, { color: theme.colors.textSecondary }]}>
                                                                {activity.description}
                                                            </Text>
                                                        )}
                                                        <View style={styles.activityMeta}>
                                                            {activity.duration && (
                                                                <Text style={[styles.activityMetaText, { color: theme.colors.textSecondary }]}>
                                                                    <Ionicons name="time-outline" size={12} /> {activity.duration}
                                                                </Text>
                                                            )}
                                                            <Text style={[styles.activityCost, { color: theme.colors.success }]}>
                                                                RM {activity.estimated_cost}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    ))}

                                    {/* Recommended Hotels */}
                                    {currentPlan.recommended_hotels?.length > 0 && (
                                        <>
                                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                                <Ionicons name="bed-outline" size={18} color={theme.colors.primary} /> Recommended Hotels
                                            </Text>
                                            {currentPlan.recommended_hotels.map((hotel: any, idx: number) => (
                                                <View key={idx} style={[styles.recommendCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
                                                    <Ionicons name="business-outline" size={24} color={theme.colors.primary} />
                                                    <View style={styles.recommendInfo}>
                                                        <Text style={[styles.recommendName, { color: theme.colors.text }]}>{hotel.name}</Text>
                                                        <Text style={[styles.recommendReason, { color: theme.colors.textSecondary }]}>
                                                            {hotel.reason}
                                                        </Text>
                                                        {hotel.estimated_cost_per_night && (
                                                            <Text style={[styles.recommendCost, { color: theme.colors.success }]}>
                                                                ~RM {hotel.estimated_cost_per_night}/night
                                                            </Text>
                                                        )}
                                                    </View>
                                                </View>
                                            ))}
                                        </>
                                    )}

                                    {/* Recommended Food Places */}
                                    {currentPlan.recommended_food_places?.length > 0 && (
                                        <>
                                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                                <Ionicons name="restaurant-outline" size={18} color={theme.colors.primary} /> Recommended Food Places
                                            </Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.foodScroll}>
                                                {currentPlan.recommended_food_places.map((place: any, idx: number) => (
                                                    <View key={idx} style={[styles.foodCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
                                                        <Ionicons name="fast-food-outline" size={24} color={theme.colors.warning} />
                                                        <Text style={[styles.foodName, { color: theme.colors.text }]} numberOfLines={1}>
                                                            {place.name}
                                                        </Text>
                                                        <Text style={[styles.foodCuisine, { color: theme.colors.textSecondary }]}>{place.cuisine}</Text>
                                                        <Text style={[styles.foodCost, { color: theme.colors.success }]}>~RM {place.estimated_cost}</Text>
                                                    </View>
                                                ))}
                                            </ScrollView>
                                        </>
                                    )}

                                    {/* Travel Tips */}
                                    {currentPlan.travel_tips?.length > 0 && (
                                        <>
                                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                                <Ionicons name="bulb-outline" size={18} color={theme.colors.warning} /> Travel Tips
                                            </Text>
                                            <View
                                                style={[styles.tipsContainer, { backgroundColor: theme.colors.warning + '10', borderColor: theme.colors.warning }]}
                                            >
                                                {currentPlan.travel_tips.map((tip: string, idx: number) => (
                                                    <View key={idx} style={styles.tipItem}>
                                                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.warning} />
                                                        <Text style={[styles.tipText, { color: theme.colors.text }]}>{tip}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        </>
                                    )}
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: { fontSize: 22, fontWeight: '800' },
    addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
    emptyText: { fontSize: 16, fontWeight: '600' },
    emptySubtext: { fontSize: 14, marginTop: -8, marginBottom: 8, textAlign: 'center' },

    // Trip Card
    tripCard: { flexDirection: 'row', alignItems: 'flex-start' },
    iconBox: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    tripInfo: { flex: 1 },
    destText: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    tripMeta: { fontSize: 13, marginBottom: 6 },
    tripTags: { flexDirection: 'row', gap: 6, marginBottom: 6 },
    tag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
    tagText: { fontSize: 10, textTransform: 'capitalize' },
    aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    aiBadgeText: { fontSize: 11, fontWeight: '700' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    statusText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },

    // Modal
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '800' },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 12 },
    input: { height: 48, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, fontSize: 16 },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },

    // Search
    searchContainer: { position: 'relative', zIndex: 1000 },
    searchInput: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 48,
        borderWidth: 1.5,
        borderRadius: 10,
        paddingHorizontal: 12,
        gap: 8,
    },
    searchTextInput: { flex: 1, fontSize: 16, height: '100%' },
    predictionsContainer: {
        position: 'absolute',
        top: 52,
        left: 0,
        right: 0,
        borderWidth: 1,
        borderRadius: 10,
        maxHeight: 200,
        zIndex: 1001,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    predictionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
    predictionText: { flex: 1 },
    predictionMain: { fontSize: 14, fontWeight: '600' },
    predictionSecondary: { fontSize: 12, marginTop: 2 },

    // Selected Place
    selectedPlaceCard: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, marginTop: 12, overflow: 'hidden' },
    placePhoto: { width: 80, height: 80 },
    placeInfo: { flex: 1, padding: 10, justifyContent: 'center' },
    placeName: { fontSize: 14, fontWeight: '700' },
    placeAddress: { fontSize: 12, marginTop: 2 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
    ratingText: { fontSize: 12, fontWeight: '600' },

    // Options
    optionSection: { marginTop: 12 },
    optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    optionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1.5,
    },
    optionLabel: { fontSize: 13, fontWeight: '600' },

    // Loading
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingBox: { padding: 24, borderRadius: 16, alignItems: 'center', width: '80%' },
    loadingText: { fontSize: 16, fontWeight: '600', marginTop: 16, textAlign: 'center' },
    loadingSubtext: { fontSize: 13, marginTop: 4 },

    // Plan Modal
    planOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 },
    planModal: { borderRadius: 20, maxHeight: '90%', overflow: 'hidden' },
    planHeader: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    planTitle: { fontSize: 18, fontWeight: '800' },
    planSubtitle: { fontSize: 13, marginTop: 4 },

    // Summary
    summaryCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
    summaryTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
    summaryText: { fontSize: 14, lineHeight: 22 },

    // Cost
    costCard: { padding: 16, borderRadius: 12, marginBottom: 16 },
    costHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    costTitle: { fontSize: 14, fontWeight: '600' },
    costAmount: { fontSize: 28, fontWeight: '800' },
    breakdownGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
    breakdownItem: { width: '48%', padding: 8, borderRadius: 8 },
    breakdownLabel: { fontSize: 11, textTransform: 'capitalize' },
    breakdownValue: { fontSize: 14, fontWeight: '700' },

    // Day Card
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 8 },
    dayCard: { borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1 },
    dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    dayBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    dayBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    dayTheme: { flex: 1, fontSize: 13, fontStyle: 'italic' },
    dayCost: { fontSize: 13, fontWeight: '700' },

    // Activity
    activityItem: { flexDirection: 'row', marginBottom: 12, gap: 10 },
    activityTime: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    activityTimeText: { fontSize: 11, fontWeight: '700' },
    activityContent: { flex: 1 },
    activityName: { fontSize: 14, fontWeight: '600' },
    activityDesc: { fontSize: 12, marginTop: 2 },
    activityMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
    activityMetaText: { fontSize: 11 },
    activityCost: { fontSize: 12, fontWeight: '600' },

    // Recommendations
    recommendCard: { flexDirection: 'row', padding: 12, borderRadius: 10, marginBottom: 8, alignItems: 'center', gap: 12 },
    recommendInfo: { flex: 1 },
    recommendName: { fontSize: 14, fontWeight: '600' },
    recommendReason: { fontSize: 12, marginTop: 2 },
    recommendCost: { fontSize: 12, fontWeight: '700', marginTop: 4 },

    // Food Scroll
    foodScroll: { marginBottom: 16 },
    foodCard: { width: 120, padding: 12, borderRadius: 10, marginRight: 10, alignItems: 'center' },
    foodName: { fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' },
    foodCuisine: { fontSize: 10, marginTop: 2 },
    foodCost: { fontSize: 11, fontWeight: '700', marginTop: 4 },

    // Tips
    tipsContainer: { padding: 12, borderRadius: 12, borderWidth: 1 },
    tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
    tipText: { flex: 1, fontSize: 13 },
});
