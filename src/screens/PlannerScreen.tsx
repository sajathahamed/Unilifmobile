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
    Linking,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { useAuth } from '@context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { generateTripPlanWithDeepSeek, TripPlanResponse, convertLKRToUSD, checkAIConnection, setAIStatusCallback, AIStatus } from '../services/deepseek';
import { generateTripPDF, shareTripPDF, printTripPlan } from '../services/pdfGenerator';
import { shareViaNative, shareViaWhatsApp, shareViaEmail, makePhoneCall, openBookingLink } from '../services/shareService';
import { createTripPlan, getTripPlansForUser, voidTripPlan, TripPlanInsert } from '@lib/db';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// API Keys from environment
const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

// Option types
const TRAVEL_TYPES = [
    { id: 'solo', label: 'Solo', icon: 'person-outline' },
    { id: 'couple', label: 'Couple', icon: 'heart-outline' },
    { id: 'family', label: 'Family', icon: 'people-outline' },
    { id: 'friends', label: 'Friends', icon: 'happy-outline' },
];

const ROOM_TYPES = [
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

const FEATURED_DESTINATIONS = [
    { id: 'colombo', name: 'Colombo', tier: 'Premium', image: 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80&w=400' },
    { id: 'ella', name: 'Ella', tier: 'Premium', image: 'https://images.unsplash.com/photo-1546708973-b339540b5162?auto=format&fit=crop&q=80&w=400' },
    { id: 'galle', name: 'Galle', tier: 'Premium', image: 'https://images.unsplash.com/photo-1627894483216-2138af692e32?auto=format&fit=crop&q=80&w=400' },
    { id: 'kandy', name: 'Kandy', tier: 'Mid-range', image: 'https://images.unsplash.com/photo-1588598136841-36c1d1d6a11e?auto=format&fit=crop&q=80&w=400' },
    { id: 'sigiriya', name: 'Sigiriya', tier: 'Mid-range', image: 'https://images.unsplash.com/photo-1578351123283-938749a46f48?auto=format&fit=crop&q=80&w=400' },
    { id: 'jaffna', name: 'Jaffna', tier: 'Budget', image: 'https://images.unsplash.com/photo-1563200022-86db49488390?auto=format&fit=crop&q=80&w=400' },
];

const STATUS_COLORS: Record<string, string> = {
    active: '#22C55E',
    planning: '#6366F1',
    booked: '#22C55E',
    completed: '#14B8A6',
    void: '#EF4444',
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

interface StoredTripPlan {
    id: number;
    destination: string;
    days: number;
    travelers: number;
    budget_lkr: number;
    total_cost_lkr: number;
    room_type: string;
    travel_type: string;
    transport_mode?: string;
    food_preference?: string;
    summary: string;
    itinerary_json: any;
    hotel_details_json: any;
    food_places_json: any;
    transport_details_json: any;
    cost_breakdown_json: any;
    travel_tips_json: string[];
    budget_sufficient: boolean;
    budget_message?: string;
    status: string;
    created_at: string;
}

// ============================================
// DIRECT API CALLS
// ============================================

async function searchPlacesAPI(query: string): Promise<PlacePrediction[]> {
    if (!GOOGLE_PLACES_API_KEY) return [];

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

// ============================================
// MAIN COMPONENT
// ============================================

export const PlannerScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
    const { theme } = useTheme();
    const { userProfile } = useAuth();
    const searchTimeout = useRef<NodeJS.Timeout | null>(null);

    // Trip list state
    const [trips, setTrips] = useState<StoredTripPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Form modal state
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form fields
    const [destination, setDestination] = useState('');
    const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
    const [placeId, setPlaceId] = useState('');
    const [days, setDays] = useState('');
    const [budget, setBudget] = useState('');
    const [travelers, setTravelers] = useState('1');
    const [travelType, setTravelType] = useState('solo');
    const [roomType, setRoomType] = useState('standard');
    const [transportMode, setTransportMode] = useState('car');
    const [foodPreference, setFoodPreference] = useState('mixed');

    // Search autocomplete state
    const [searchQuery, setSearchQuery] = useState('');
    const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showPredictions, setShowPredictions] = useState(false);

    // AI Plan result state
    const [generatingPlan, setGeneratingPlan] = useState(false);
    const [currentPlan, setCurrentPlan] = useState<TripPlanResponse | null>(null);
    const [planModalVisible, setPlanModalVisible] = useState(false);
    const [currentTripMeta, setCurrentTripMeta] = useState<any>(null);
    const [currentTripId, setCurrentTripId] = useState<number | null>(null);

    // Share modal state
    const [shareModalVisible, setShareModalVisible] = useState(false);
    const [pdfGenerating, setPdfGenerating] = useState(false);
    const [generatedPdfUri, setGeneratedPdfUri] = useState<string | null>(null);

    // AI Status state
    const [aiStatus, setAiStatus] = useState<AIStatus>('idle');
    const [aiMessage, setAiMessage] = useState<string>('Checking AI...');

    // Check AI connection on mount
    useEffect(() => {
        const checkAI = async () => {
            const result = await checkAIConnection();
            setAiMessage(result.message);
        };
        checkAI();
        
        // Set up status callback
        setAIStatusCallback((status, message) => {
            setAiStatus(status);
            if (message) setAiMessage(message);
        });
    }, []);

    // Load trips from database
    const loadTrips = useCallback(async () => {
        if (!userProfile?.id) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await getTripPlansForUser(userProfile.id, 'active');
            if (error) {
                console.error('Error loading trips:', error);
            } else {
                setTrips(data || []);
            }
        } catch (error) {
            console.error('Load trips error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [userProfile?.id]);

    useEffect(() => {
        loadTrips();
    }, [loadTrips]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadTrips();
    }, [loadTrips]);

    // Debounced place search
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

    const selectFeaturedDestination = (dest: any) => {
        setDestination(dest.name);
        setSearchQuery(dest.name);
        setPlaceId(''); // Not using Google Place ID for featured ones
        setSelectedPlace(null);
    };

    // Validate form
    const validateForm = (): string | null => {
        if (!destination.trim()) return 'Please enter a destination';

        const daysNum = parseInt(days);
        if (isNaN(daysNum) || daysNum < 1) return 'Duration must be at least 1 day';
        if (daysNum > 30) return 'Duration cannot exceed 30 days';

        const budgetNum = parseFloat(budget);
        if (isNaN(budgetNum) || budgetNum <= 0) return 'Budget must be greater than 0';

        const travelersNum = parseInt(travelers);
        if (isNaN(travelersNum) || travelersNum < 1) return 'Number of travelers must be at least 1';

        return null;
    };

    // Generate trip plan with AI
    const handleGeneratePlan = async () => {
        const error = validateForm();
        if (error) {
            Alert.alert('Validation Error', error);
            return;
        }

        setSubmitting(true);
        setGeneratingPlan(true);
        console.log('[TRIP PLANNER] Starting plan generation...');
        console.log('[TRIP PLANNER] Destination:', destination.trim());
        console.log('[TRIP PLANNER] Days:', days, 'Budget:', budget, 'Travelers:', travelers);

        try {
            const tripPlan = await generateTripPlanWithDeepSeek({
                destination: destination.trim(),
                days: parseInt(days),
                budget: parseFloat(budget),
                travelers: parseInt(travelers),
                roomType: roomType as 'budget' | 'standard' | 'luxury',
                travelType: travelType as 'solo' | 'couple' | 'family' | 'friends',
                transportMode,
                foodPreference,
            });

            console.log('[TRIP PLANNER] ✓ Plan received!');
            console.log('[TRIP PLANNER] Summary:', tripPlan.summary);
            console.log('[TRIP PLANNER] Total Cost:', tripPlan.total_cost_lkr, 'LKR');
            console.log('[TRIP PLANNER] Days in plan:', tripPlan.daily_plan?.length);
            console.log('[TRIP PLANNER] Hotels:', tripPlan.hotel_details?.length);
            console.log('[TRIP PLANNER] Budget Sufficient:', tripPlan.budget_sufficient);

            // Check if budget is sufficient
            if (!tripPlan.budget_sufficient) {
                Alert.alert(
                    'Budget Insufficient',
                    tripPlan.budget_message || 'Your budget is not enough for this destination and selected days. Please increase budget or reduce days.',
                    [
                        { text: 'Adjust & Retry', style: 'cancel' },
                        { 
                            text: 'Continue Anyway', 
                            onPress: () => saveTripPlan(tripPlan),
                        },
                    ]
                );
                setSubmitting(false);
                setGeneratingPlan(false);
                return;
            }

            await saveTripPlan(tripPlan);
        } catch (error: any) {
            console.error('[TRIP PLANNER] ✗ Error:', error);
            Alert.alert('Error', error.message || 'Failed to generate trip plan. Please try again.');
            setSubmitting(false);
            setGeneratingPlan(false);
        }
    };

    // Save trip plan to database
    const saveTripPlan = async (tripPlan: TripPlanResponse) => {
        console.log('[TRIP PLANNER] Saving plan to database...');
        try {
            const tripPlanData: TripPlanInsert = {
                user_id: userProfile?.id || 0,
                destination: destination.trim(),
                days: parseInt(days),
                budget_lkr: parseFloat(budget),
                travelers: parseInt(travelers),
                room_type: roomType,
                travel_type: travelType,
                transport_mode: transportMode,
                food_preference: foodPreference,
                summary: tripPlan.summary,
                itinerary_json: tripPlan.daily_plan,
                hotel_details_json: tripPlan.hotel_details,
                food_places_json: tripPlan.food_places,
                transport_details_json: tripPlan.transport_summary,
                cost_breakdown_json: tripPlan.cost_breakdown_lkr,
                travel_tips_json: tripPlan.travel_tips,
                total_cost_lkr: tripPlan.total_cost_lkr,
                total_cost_usd: tripPlan.total_cost_usd,
                budget_sufficient: tripPlan.budget_sufficient,
                budget_message: tripPlan.budget_message,
            };

            console.log('[TRIP PLANNER] Plan data prepared:', JSON.stringify(tripPlanData, null, 2).substring(0, 500));

            const { data, error } = await createTripPlan(tripPlanData);

            if (error) {
                console.error('[TRIP PLANNER] Save error:', error);
                // Still show the plan even if save fails
            } else {
                console.log('[TRIP PLANNER] ✓ Plan saved with ID:', data?.id);
            }

            console.log('[TRIP PLANNER] Setting current plan for display...');
            setCurrentPlan(tripPlan);
            setCurrentTripMeta({
                destination: destination.trim(),
                days: parseInt(days),
                budget: parseFloat(budget),
                travelers: parseInt(travelers),
                roomType,
                travelType,
            });
            setCurrentTripId(data?.id || null);

            setModalVisible(false);
            setPlanModalVisible(true);
            console.log('[TRIP PLANNER] ✓ Plan modal should now be visible');
            resetForm();
            loadTrips();
        } catch (error) {
            console.error('[TRIP PLANNER] Save error:', error);
        } finally {
            setSubmitting(false);
            setGeneratingPlan(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setDestination('');
        setSearchQuery('');
        setSelectedPlace(null);
        setPlaceId('');
        setDays('');
        setBudget('');
        setTravelers('1');
        setTravelType('solo');
        setRoomType('standard');
        setTransportMode('car');
        setFoodPreference('mixed');
        setPredictions([]);
        setShowPredictions(false);
    };

    // View existing trip plan
    const viewTripPlan = (trip: StoredTripPlan) => {
        const plan: TripPlanResponse = {
            summary: trip.summary,
            daily_plan: trip.itinerary_json || [],
            total_cost_lkr: trip.total_cost_lkr,
            hotel_details: trip.hotel_details_json || [],
            transport_summary: trip.transport_details_json || { mode: 'car', total_cost_lkr: 0, details: '' },
            food_places: trip.food_places_json || [],
            cost_breakdown_lkr: trip.cost_breakdown_json || {},
            travel_tips: trip.travel_tips_json || [],
            budget_sufficient: trip.budget_sufficient,
            budget_message: trip.budget_message,
        };

        setCurrentPlan(plan);
        setCurrentTripMeta({
            destination: trip.destination,
            days: trip.days,
            budget: trip.budget_lkr,
            travelers: trip.travelers,
            roomType: trip.room_type,
            travelType: trip.travel_type,
        });
        setCurrentTripId(trip.id);
        setPlanModalVisible(true);
    };

    // Void trip (instead of delete)
    const handleVoidTrip = async (tripId: number) => {
        Alert.alert(
            'Void Trip',
            'Are you sure you want to void this trip? It will be moved to the Void Trips page.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Void',
                    style: 'destructive',
                    onPress: async () => {
                        const { error } = await voidTripPlan(tripId, 'Voided by user');
                        if (error) {
                            Alert.alert('Error', 'Failed to void trip');
                        } else {
                            loadTrips();
                            setPlanModalVisible(false);
                        }
                    },
                },
            ]
        );
    };

    // PDF Generation
    const handleGeneratePDF = async () => {
        if (!currentPlan || !currentTripMeta) return;

        setPdfGenerating(true);
        try {
            const result = await generateTripPDF({
                userName: userProfile?.name || 'Traveler',
                userEmail: userProfile?.email,
                destination: currentTripMeta.destination,
                days: currentTripMeta.days,
                travelers: currentTripMeta.travelers,
                roomType: currentTripMeta.roomType,
                tripPlan: currentPlan,
                createdAt: new Date().toISOString(),
            });

            if (result.success) {
                setGeneratedPdfUri(result.uri);
                Alert.alert('PDF Generated', 'Your trip plan PDF is ready!', [
                    { text: 'Share', onPress: () => shareTripPDF(result.uri) },
                    { text: 'OK' },
                ]);
            } else {
                Alert.alert('Error', result.error || 'Failed to generate PDF');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to generate PDF');
        } finally {
            setPdfGenerating(false);
        }
    };

    // Share handlers
    const handleShare = () => {
        setShareModalVisible(true);
    };

    const handleShareOption = async (option: string) => {
        if (!currentPlan || !currentTripMeta) return;

        const shareData = {
            userName: userProfile?.name || 'Traveler',
            destination: currentTripMeta.destination,
            days: currentTripMeta.days,
            travelers: currentTripMeta.travelers,
            totalCost: currentPlan.total_cost_lkr,
            summary: currentPlan.summary,
        };

        setShareModalVisible(false);

        switch (option) {
            case 'native':
                await shareViaNative(shareData);
                break;
            case 'whatsapp':
                await shareViaWhatsApp(shareData);
                break;
            case 'email':
                await shareViaEmail(shareData);
                break;
            case 'pdf':
                if (generatedPdfUri) {
                    await shareTripPDF(generatedPdfUri);
                } else {
                    handleGeneratePDF();
                }
                break;
        }
    };

    // Format currency
    const formatLKR = (amount: number) => `LKR ${amount?.toLocaleString() || '0'}`;

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
                <View style={styles.headerBtns}>
                    <TouchableOpacity 
                        style={[styles.voidBtn, { backgroundColor: theme.colors.backgroundSecondary }]} 
                        onPress={() => navigation?.navigate?.('VoidTrips')}
                    >
                        <Ionicons name="trash-outline" size={20} color={theme.colors.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.addBtn, { backgroundColor: theme.colors.primary }]} onPress={() => setModalVisible(true)}>
                        <Ionicons name="add" size={22} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* AI Status Indicator */}
            <View style={[styles.aiStatusBar, { 
                backgroundColor: aiStatus === 'connected' || aiStatus === 'idle' ? '#22C55E20' : 
                                 aiStatus === 'error' || aiStatus === 'fallback' ? '#EF444420' : 
                                 '#6366F120' 
            }]}>
                <View style={[styles.aiStatusDot, { 
                    backgroundColor: aiStatus === 'connected' || aiStatus === 'idle' ? '#22C55E' : 
                                     aiStatus === 'error' || aiStatus === 'fallback' ? '#EF4444' : 
                                     '#6366F1' 
                }]} />
                <Text style={[styles.aiStatusText, { 
                    color: aiStatus === 'connected' || aiStatus === 'idle' ? '#22C55E' : 
                           aiStatus === 'error' || aiStatus === 'fallback' ? '#EF4444' : 
                           '#6366F1' 
                }]}>
                    {aiMessage}
                </Text>
                {(aiStatus === 'connecting' || aiStatus === 'generating') && (
                    <ActivityIndicator size="small" color="#6366F1" style={{ marginLeft: 8 }} />
                )}
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
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={[theme.colors.primary]}
                                tintColor={theme.colors.primary}
                            />
                        }
                        renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => viewTripPlan(item)}>
                                <Card elevated>
                                    <View style={styles.tripCard}>
                                        <View
                                            style={[styles.iconBox, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}
                                        >
                                            <Ionicons name="airplane-outline" size={28} color={STATUS_COLORS[item.status]} />
                                        </View>
                                        <View style={styles.tripInfo}>
                                            <Text style={[styles.destText, { color: theme.colors.text }]}>{item.destination}</Text>
                                            <Text style={[styles.tripMeta, { color: theme.colors.textSecondary }]}>
                                                {item.days} day{item.days > 1 ? 's' : ''} · {item.travelers} traveler{item.travelers > 1 ? 's' : ''}
                                            </Text>
                                            <Text style={[styles.tripCost, { color: theme.colors.success }]}>
                                                {formatLKR(item.total_cost_lkr)}
                                            </Text>
                                            <View style={styles.tripTags}>
                                                <View style={[styles.tag, { backgroundColor: theme.colors.backgroundSecondary }]}>
                                                    <Ionicons name="person-outline" size={10} color={theme.colors.textSecondary} />
                                                    <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>
                                                        {item.travel_type}
                                                    </Text>
                                                </View>
                                                <View style={[styles.tag, { backgroundColor: theme.colors.backgroundSecondary }]}>
                                                    <Ionicons name="bed-outline" size={10} color={theme.colors.textSecondary} />
                                                    <Text style={[styles.tagText, { color: theme.colors.textSecondary }]}>
                                                        {item.room_type}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={[styles.aiBadge, { backgroundColor: theme.colors.success + '15' }]}>
                                                <Ionicons name="sparkles" size={12} color={theme.colors.success} />
                                                <Text style={[styles.aiBadgeText, { color: theme.colors.success }]}>View AI Plan</Text>
                                            </View>
                                        </View>
                                        <View
                                            style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}
                                        >
                                            <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>
                                                {item.status?.charAt(0).toUpperCase()}{item.status?.slice(1)}
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
                            <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingBottom: 20 }}>
                            {/* Destination Search */}
                            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Destination *</Text>
                            <View style={styles.searchContainer}>
                                <View style={[styles.searchInput, { borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundSecondary }]}>
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

                                {showPredictions && predictions.length > 0 && (
                                    <View style={[styles.predictionsContainer, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                                        {predictions.map((pred, idx) => (
                                            <TouchableOpacity
                                                key={pred.placeId || idx}
                                                style={[styles.predictionItem, idx < predictions.length - 1 && { borderBottomWidth: 1, borderBottomColor: theme.colors.border }]}
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

                                {!showPredictions && searchQuery.length < 2 && (
                                    <View style={styles.featuredSection}>
                                        <Text style={[styles.featuredTitle, { color: theme.colors.text }]}>Featured Places</Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredScroll}>
                                            {FEATURED_DESTINATIONS.map((dest) => (
                                                <TouchableOpacity 
                                                    key={dest.id} 
                                                    style={[styles.featuredCard, { backgroundColor: theme.colors.backgroundSecondary }]}
                                                    onPress={() => selectFeaturedDestination(dest)}
                                                >
                                                    <Image source={{ uri: dest.image }} style={styles.featuredImage} />
                                                    <View style={styles.featuredBadge}>
                                                        <Text style={styles.featuredBadgeText}>{dest.tier}</Text>
                                                    </View>
                                                    <Text style={[styles.featuredName, { color: theme.colors.text }]}>{dest.name}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </ScrollView>
                                    </View>
                                )}
                            </View>

                            {selectedPlace && (
                                <View style={[styles.selectedPlaceCard, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
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
                            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Number of Days *</Text>
                            <TextInput
                                value={days}
                                onChangeText={setDays}
                                keyboardType="number-pad"
                                placeholder="1-30 days"
                                placeholderTextColor={theme.colors.placeholder}
                                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.backgroundSecondary }]}
                                maxLength={2}
                            />

                            {/* Budget */}
                            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Budget (LKR) *</Text>
                            <TextInput
                                value={budget}
                                onChangeText={setBudget}
                                keyboardType="decimal-pad"
                                placeholder="e.g. 150000"
                                placeholderTextColor={theme.colors.placeholder}
                                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.backgroundSecondary }]}
                            />

                            {/* Number of Travelers */}
                            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Number of Travelers *</Text>
                            <TextInput
                                value={travelers}
                                onChangeText={setTravelers}
                                keyboardType="number-pad"
                                placeholder="1"
                                placeholderTextColor={theme.colors.placeholder}
                                style={[styles.input, { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.backgroundSecondary }]}
                                maxLength={2}
                            />

                            {/* Travel Type */}
                            <OptionSelector title="Travel Type" options={TRAVEL_TYPES} value={travelType} onChange={setTravelType} />

                            {/* Room Type */}
                            <OptionSelector title="Room Type" options={ROOM_TYPES} value={roomType} onChange={setRoomType} />

                            {/* Transport */}
                            <OptionSelector title="Transport Mode" options={TRANSPORT_MODES} value={transportMode} onChange={setTransportMode} />

                            {/* Food Preference */}
                            <OptionSelector title="Food Preference" options={FOOD_PREFERENCES} value={foodPreference} onChange={setFoodPreference} />

                            {/* Submit Buttons */}
                            <View style={styles.modalBtns}>
                                <Button label="Cancel" variant="outline" onPress={() => { setModalVisible(false); resetForm(); }} style={{ flex: 1 }} />
                                <Button label={submitting ? 'Generating...' : 'Generate Plan'} onPress={handleGeneratePlan} disabled={submitting} style={{ flex: 1 }} />
                            </View>
                        </ScrollView>

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
                                        {currentTripMeta.destination} · {currentTripMeta.days} days · {formatLKR(currentTripMeta.budget)}
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
                                    {/* Budget Warning */}
                                    {!currentPlan.budget_sufficient && (
                                        <View style={[styles.warningCard, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                                            <Ionicons name="warning-outline" size={20} color="#D97706" />
                                            <Text style={[styles.warningText, { color: '#92400E' }]}>
                                                {currentPlan.budget_message}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Summary */}
                                    <View style={[styles.summaryCard, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary }]}>
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
                                            {formatLKR(currentPlan.total_cost_lkr)}
                                        </Text>
                                        <Text style={[styles.costUsd, { color: theme.colors.textSecondary }]}>
                                            ≈ USD {currentPlan.total_cost_usd || Math.round(currentPlan.total_cost_lkr / 320)}
                                        </Text>

                                        {currentPlan.cost_breakdown_lkr && (
                                            <View style={styles.breakdownGrid}>
                                                {Object.entries(currentPlan.cost_breakdown_lkr).map(([key, value]) => (
                                                    <View key={key} style={styles.breakdownItem}>
                                                        <Text style={[styles.breakdownLabel, { color: theme.colors.textSecondary }]}>
                                                            {key.charAt(0).toUpperCase() + key.slice(1)}
                                                        </Text>
                                                        <Text style={[styles.breakdownValue, { color: theme.colors.text }]}>
                                                            {formatLKR(value as number)}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>

                                    {/* Action Buttons */}
                                    <View style={styles.actionBtns}>
                                        <TouchableOpacity 
                                            style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
                                            onPress={handleGeneratePDF}
                                            disabled={pdfGenerating}
                                        >
                                            {pdfGenerating ? (
                                                <ActivityIndicator size="small" color="#fff" />
                                            ) : (
                                                <Ionicons name="document-text-outline" size={20} color="#fff" />
                                            )}
                                            <Text style={styles.actionBtnText}>PDF</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.actionBtn, { backgroundColor: '#25D366' }]}
                                            onPress={handleShare}
                                        >
                                            <Ionicons name="share-social-outline" size={20} color="#fff" />
                                            <Text style={styles.actionBtnText}>Share</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.actionBtn, { backgroundColor: '#EF4444' }]}
                                            onPress={() => currentTripId && handleVoidTrip(currentTripId)}
                                        >
                                            <Ionicons name="close-circle-outline" size={20} color="#fff" />
                                            <Text style={styles.actionBtnText}>Void</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Daily Itinerary */}
                                    <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                        <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} /> Day-by-Day Itinerary
                                    </Text>

                                    {currentPlan.daily_plan?.map((day, idx) => (
                                        <View key={idx} style={[styles.dayCard, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
                                            <View style={styles.dayHeader}>
                                                <View style={[styles.dayBadge, { backgroundColor: theme.colors.primary }]}>
                                                    <Text style={styles.dayBadgeText}>Day {day.day}</Text>
                                                </View>
                                                {day.theme && (
                                                    <Text style={[styles.dayTheme, { color: theme.colors.textSecondary }]}>{day.theme}</Text>
                                                )}
                                                <Text style={[styles.dayCost, { color: theme.colors.success }]}>{formatLKR(day.estimated_cost_lkr)}</Text>
                                            </View>

                                            {day.transport_details && (
                                                <View style={[styles.transportBadge, { backgroundColor: '#FEF3C7' }]}>
                                                    <Ionicons name="car-outline" size={14} color="#D97706" />
                                                    <Text style={[styles.transportText, { color: '#92400E' }]}>{day.transport_details}</Text>
                                                </View>
                                            )}

                                            {day.activities?.map((activity, actIdx) => (
                                                <View key={actIdx} style={styles.activityItem}>
                                                    <View style={[styles.activityTime, { backgroundColor: theme.colors.primary + '15' }]}>
                                                        <Text style={[styles.activityTimeText, { color: theme.colors.primary }]}>{activity.time}</Text>
                                                    </View>
                                                    <View style={styles.activityContent}>
                                                        <Text style={[styles.activityName, { color: theme.colors.text }]}>{activity.activity}</Text>
                                                        {activity.description && (
                                                            <Text style={[styles.activityDesc, { color: theme.colors.textSecondary }]}>{activity.description}</Text>
                                                        )}
                                                        {activity.location && (
                                                            <Text style={[styles.activityLocation, { color: theme.colors.textSecondary }]}>
                                                                <Ionicons name="location-outline" size={12} /> {activity.location}
                                                            </Text>
                                                        )}
                                                        <View style={styles.activityMeta}>
                                                            {activity.duration && (
                                                                <Text style={[styles.activityMetaText, { color: theme.colors.textSecondary }]}>
                                                                    <Ionicons name="time-outline" size={12} /> {activity.duration}
                                                                </Text>
                                                            )}
                                                            <Text style={[styles.activityCost, { color: theme.colors.success }]}>
                                                                {formatLKR(activity.estimated_cost_lkr)}
                                                            </Text>
                                                        </View>
                                                        {/* Call & Booking buttons */}
                                                        {(activity.contact_phone || activity.booking_link) && (
                                                            <View style={styles.activityActions}>
                                                                {activity.contact_phone && (
                                                                    <TouchableOpacity 
                                                                        style={[styles.miniBtn, { backgroundColor: '#22C55E' }]}
                                                                        onPress={() => makePhoneCall(activity.contact_phone!)}
                                                                    >
                                                                        <Ionicons name="call-outline" size={14} color="#fff" />
                                                                        <Text style={styles.miniBtnText}>Call</Text>
                                                                    </TouchableOpacity>
                                                                )}
                                                                {activity.booking_link && (
                                                                    <TouchableOpacity 
                                                                        style={[styles.miniBtn, { backgroundColor: theme.colors.primary }]}
                                                                        onPress={() => openBookingLink(activity.booking_link!)}
                                                                    >
                                                                        <Ionicons name="link-outline" size={14} color="#fff" />
                                                                        <Text style={styles.miniBtnText}>Book</Text>
                                                                    </TouchableOpacity>
                                                                )}
                                                            </View>
                                                        )}
                                                    </View>
                                                </View>
                                            ))}
                                        </View>
                                    ))}

                                    {/* Recommended Hotels */}
                                    {currentPlan.hotel_details?.length > 0 && (
                                        <>
                                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                                <Ionicons name="bed-outline" size={18} color={theme.colors.primary} /> Recommended Hotels
                                            </Text>
                                            {currentPlan.hotel_details.map((hotel: any, idx: number) => (
                                                <View key={idx} style={[styles.hotelCard, { backgroundColor: theme.colors.backgroundSecondary, borderColor: theme.colors.border }]}>
                                                    <View style={styles.hotelHeader}>
                                                        <Ionicons name="business-outline" size={24} color={theme.colors.primary} />
                                                        <View style={styles.hotelInfo}>
                                                            <Text style={[styles.hotelName, { color: theme.colors.text }]}>{hotel.name}</Text>
                                                            {hotel.rating && (
                                                                <View style={styles.ratingRow}>
                                                                    <Ionicons name="star" size={14} color="#F59E0B" />
                                                                    <Text style={[styles.ratingText, { color: theme.colors.text }]}>{hotel.rating}/5</Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                        <Text style={[styles.hotelPrice, { color: theme.colors.success }]}>
                                                            {formatLKR(hotel.price_per_night_lkr)}/night
                                                        </Text>
                                                    </View>
                                                    {hotel.address && (
                                                        <Text style={[styles.hotelAddress, { color: theme.colors.textSecondary }]}>
                                                            <Ionicons name="location-outline" size={12} /> {hotel.address}
                                                        </Text>
                                                    )}
                                                    {hotel.amenities?.length > 0 && (
                                                        <Text style={[styles.hotelAmenities, { color: theme.colors.textSecondary }]}>
                                                            ✨ {hotel.amenities.join(' · ')}
                                                        </Text>
                                                    )}
                                                    {hotel.reason && (
                                                        <Text style={[styles.hotelReason, { color: theme.colors.text }]}>{hotel.reason}</Text>
                                                    )}
                                                    {/* Hotel action buttons */}
                                                    <View style={styles.hotelActions}>
                                                        {hotel.contact_phone && (
                                                            <TouchableOpacity 
                                                                style={[styles.hotelBtn, { backgroundColor: '#22C55E' }]}
                                                                onPress={() => makePhoneCall(hotel.contact_phone)}
                                                            >
                                                                <Ionicons name="call-outline" size={16} color="#fff" />
                                                                <Text style={styles.hotelBtnText}>Call Hotel</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                        {hotel.booking_link && (
                                                            <TouchableOpacity 
                                                                style={[styles.hotelBtn, { backgroundColor: theme.colors.primary }]}
                                                                onPress={() => openBookingLink(hotel.booking_link)}
                                                            >
                                                                <Ionicons name="globe-outline" size={16} color="#fff" />
                                                                <Text style={styles.hotelBtnText}>Book Online</Text>
                                                            </TouchableOpacity>
                                                        )}
                                                    </View>
                                                </View>
                                            ))}
                                        </>
                                    )}

                                    {/* Recommended Food Places */}
                                    {currentPlan.food_places?.length > 0 && (
                                        <>
                                            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                                                <Ionicons name="restaurant-outline" size={18} color={theme.colors.primary} /> Food Recommendations
                                            </Text>
                                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.foodScroll}>
                                                {currentPlan.food_places.map((place: any, idx: number) => (
                                                    <View key={idx} style={[styles.foodCard, { backgroundColor: theme.colors.backgroundSecondary }]}>
                                                        <Ionicons name="fast-food-outline" size={24} color={theme.colors.warning} />
                                                        <Text style={[styles.foodName, { color: theme.colors.text }]} numberOfLines={1}>{place.name}</Text>
                                                        <Text style={[styles.foodCuisine, { color: theme.colors.textSecondary }]}>{place.cuisine}</Text>
                                                        <Text style={[styles.foodMeal, { color: theme.colors.textSecondary }]}>{place.meal_type}</Text>
                                                        <Text style={[styles.foodCost, { color: theme.colors.success }]}>{formatLKR(place.estimated_cost_lkr)}</Text>
                                                        {place.contact_phone && (
                                                            <TouchableOpacity 
                                                                style={[styles.foodCallBtn, { backgroundColor: '#22C55E' }]}
                                                                onPress={() => makePhoneCall(place.contact_phone)}
                                                            >
                                                                <Ionicons name="call-outline" size={12} color="#fff" />
                                                            </TouchableOpacity>
                                                        )}
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
                                            <View style={[styles.tipsContainer, { backgroundColor: theme.colors.warning + '10', borderColor: theme.colors.warning }]}>
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

            {/* Share Options Modal */}
            <Modal visible={shareModalVisible} transparent animationType="fade">
                <TouchableOpacity 
                    style={styles.shareOverlay} 
                    activeOpacity={1} 
                    onPress={() => setShareModalVisible(false)}
                >
                    <View style={[styles.shareModal, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.shareTitle, { color: theme.colors.text }]}>Share Trip Plan</Text>
                        
                        <TouchableOpacity style={styles.shareOption} onPress={() => handleShareOption('native')}>
                            <View style={[styles.shareIconBox, { backgroundColor: theme.colors.primary + '20' }]}>
                                <Ionicons name="share-outline" size={24} color={theme.colors.primary} />
                            </View>
                            <Text style={[styles.shareOptionText, { color: theme.colors.text }]}>Share</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.shareOption} onPress={() => handleShareOption('whatsapp')}>
                            <View style={[styles.shareIconBox, { backgroundColor: '#25D36620' }]}>
                                <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
                            </View>
                            <Text style={[styles.shareOptionText, { color: theme.colors.text }]}>WhatsApp</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.shareOption} onPress={() => handleShareOption('email')}>
                            <View style={[styles.shareIconBox, { backgroundColor: '#EA433520' }]}>
                                <Ionicons name="mail-outline" size={24} color="#EA4335" />
                            </View>
                            <Text style={[styles.shareOptionText, { color: theme.colors.text }]}>Email</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.shareOption} onPress={() => handleShareOption('pdf')}>
                            <View style={[styles.shareIconBox, { backgroundColor: '#EF444420' }]}>
                                <Ionicons name="document-text-outline" size={24} color="#EF4444" />
                            </View>
                            <Text style={[styles.shareOptionText, { color: theme.colors.text }]}>Share as PDF</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.shareCancel, { borderTopColor: theme.colors.border }]}
                            onPress={() => setShareModalVisible(false)}
                        >
                            <Text style={[styles.shareCancelText, { color: theme.colors.textSecondary }]}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
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
    headerBtns: { flexDirection: 'row', gap: 8 },
    voidBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    
    // AI Status Bar
    aiStatusBar: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        paddingHorizontal: 16, 
        paddingVertical: 8, 
        marginHorizontal: 16, 
        marginBottom: 8,
        borderRadius: 8 
    },
    aiStatusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
    aiStatusText: { fontSize: 12, fontWeight: '600', flex: 1 },
    
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
    emptyText: { fontSize: 16, fontWeight: '600' },
    emptySubtext: { fontSize: 14, marginTop: -8, marginBottom: 8, textAlign: 'center' },

    // Trip Card
    tripCard: { flexDirection: 'row', alignItems: 'flex-start' },
    iconBox: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    tripInfo: { flex: 1 },
    destText: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    tripMeta: { fontSize: 13, marginBottom: 2 },
    tripCost: { fontSize: 14, fontWeight: '700', marginBottom: 6 },
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
    searchInput: { flexDirection: 'row', alignItems: 'center', height: 48, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, gap: 8 },
    searchTextInput: { flex: 1, fontSize: 16, height: '100%' },
    predictionsContainer: { position: 'absolute', top: 52, left: 0, right: 0, borderWidth: 1, borderRadius: 10, maxHeight: 200, zIndex: 1001, elevation: 5 },
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
    optionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
    optionLabel: { fontSize: 13, fontWeight: '600' },

    // Loading
    loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
    loadingBox: { padding: 24, borderRadius: 16, alignItems: 'center', width: '80%' },
    loadingText: { fontSize: 16, fontWeight: '600', marginTop: 16, textAlign: 'center' },
    loadingSubtext: { fontSize: 13, marginTop: 4 },

    // Plan Modal
    planOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 16 },
    planModal: { borderRadius: 20, maxHeight: '90%', overflow: 'hidden' },
    planHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    planTitle: { fontSize: 18, fontWeight: '800' },
    planSubtitle: { fontSize: 13, marginTop: 4 },

    // Warning
    warningCard: { padding: 12, borderRadius: 10, marginBottom: 16, flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1 },
    warningText: { flex: 1, fontSize: 13 },

    // Summary
    summaryCard: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
    summaryTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
    summaryText: { fontSize: 14, lineHeight: 22 },

    // Cost
    costCard: { padding: 16, borderRadius: 12, marginBottom: 16 },
    costHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    costTitle: { fontSize: 14, fontWeight: '600' },
    costAmount: { fontSize: 28, fontWeight: '800' },
    costUsd: { fontSize: 14, marginTop: 2 },
    breakdownGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, gap: 8 },
    breakdownItem: { width: '48%', padding: 8, borderRadius: 8 },
    breakdownLabel: { fontSize: 11, textTransform: 'capitalize' },
    breakdownValue: { fontSize: 14, fontWeight: '700' },

    // Action Buttons
    actionBtns: { flexDirection: 'row', gap: 10, marginBottom: 16 },
    actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
    actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },

    // Day Card
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12, marginTop: 8 },
    dayCard: { borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1 },
    dayHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
    dayBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    dayBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
    dayTheme: { flex: 1, fontSize: 13, fontStyle: 'italic' },
    dayCost: { fontSize: 13, fontWeight: '700' },
    transportBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 6, marginBottom: 10 },
    transportText: { flex: 1, fontSize: 12 },

    // Activity
    activityItem: { flexDirection: 'row', marginBottom: 12, gap: 10 },
    activityTime: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    activityTimeText: { fontSize: 11, fontWeight: '700' },
    activityContent: { flex: 1 },
    activityName: { fontSize: 14, fontWeight: '600' },
    activityDesc: { fontSize: 12, marginTop: 2 },
    activityLocation: { fontSize: 11, marginTop: 2 },
    activityMeta: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
    activityMetaText: { fontSize: 11 },
    activityCost: { fontSize: 12, fontWeight: '600' },
    activityActions: { flexDirection: 'row', gap: 8, marginTop: 6 },
    miniBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
    miniBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },

    // Hotel Card
    hotelCard: { borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1 },
    hotelHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
    hotelInfo: { flex: 1 },
    hotelName: { fontSize: 15, fontWeight: '700' },
    hotelPrice: { fontSize: 14, fontWeight: '700' },
    hotelAddress: { fontSize: 12, marginBottom: 4 },
    hotelAmenities: { fontSize: 11, marginBottom: 4 },
    hotelReason: { fontSize: 12, fontStyle: 'italic', marginBottom: 8 },
    hotelActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
    hotelBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8 },
    hotelBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

    // Food Scroll
    foodScroll: { marginBottom: 16 },
    foodCard: { width: 130, padding: 12, borderRadius: 10, marginRight: 10, alignItems: 'center' },
    foodName: { fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center' },
    foodCuisine: { fontSize: 10, marginTop: 2 },
    foodMeal: { fontSize: 10, marginTop: 2 },
    foodCost: { fontSize: 12, fontWeight: '700', marginTop: 4 },
    foodCallBtn: { position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

    // Tips
    tipsContainer: { padding: 12, borderRadius: 12, borderWidth: 1 },
    tipItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
    tipText: { flex: 1, fontSize: 13 },

    // Share Modal
    shareOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    shareModal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
    shareTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 20 },
    shareOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 16 },
    shareIconBox: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
    shareOptionText: { fontSize: 16, fontWeight: '500' },
    shareCancel: { borderTopWidth: 1, marginTop: 12, paddingTop: 16, alignItems: 'center' },
    shareCancelText: { fontSize: 16 },

    // Featured Destinations
    featuredSection: { marginTop: 16 },
    featuredTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
    featuredScroll: { gap: 12 },
    featuredCard: { width: 140, borderRadius: 12, overflow: 'hidden', paddingBottom: 8 },
    featuredImage: { width: '100%', height: 100 },
    featuredBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
    featuredBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    featuredName: { fontSize: 14, fontWeight: '600', marginTop: 8, marginHorizontal: 8 },
});

export default PlannerScreen;
