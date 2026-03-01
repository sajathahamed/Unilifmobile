import React, { useEffect, useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { useAuth } from '@context/AuthContext';
import { getTripsForUser, createTrip, updateTripWithAI } from '@lib/index';
import { Trip } from '@app-types/database';
import { Ionicons } from '@expo/vector-icons';
import { generateItinerary } from '@services/openai';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

// Replace with your Google Maps API Key
const GOOGLE_MAPS_API_KEY = "AIzaSyBQZ2EeJFSE_XNsK8dPDH4XBCwysUt8TsA"; // Using user's key (assuming it might have Places enabled)

const STATUS_COLORS: Record<string, string> = {
    planning: '#6366F1',
    booked: '#22C55E',
    completed: '#14B8A6',
    cancelled: '#EF4444',
};

export const PlannerScreen: React.FC = () => {
    const { theme } = useTheme();
    const { userProfile } = useAuth();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [destination, setDestination] = useState('');
    const [days, setDays] = useState('');
    const [budget, setBudget] = useState('');

    // AI Suggestion State
    const [generatingAI, setGeneratingAI] = useState<number | null>(null);
    const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
    const [aiVisible, setAiVisible] = useState(false);

    const fetchTrips = useCallback(async () => {
        if (!userProfile?.id) { setLoading(false); return; }
        setLoading(true);
        const { data } = await getTripsForUser(userProfile.id);
        if (data) setTrips(data as Trip[]);
        setLoading(false);
    }, [userProfile?.id]);

    useEffect(() => {
        fetchTrips();
    }, [fetchTrips]);

    const handleCreate = async () => {
        if (!destination.trim() || !days || !budget || !userProfile?.id) {
            Alert.alert('Please fill all fields');
            return;
        }
        const daysNum = parseInt(days, 10);
        const budgetNum = parseFloat(budget);
        if (isNaN(daysNum) || isNaN(budgetNum)) {
            Alert.alert('Invalid Input', 'Days and budget must be numbers.');
            return;
        }
        setSubmitting(true);
        const { data, error } = await createTrip(destination.trim(), daysNum, budgetNum, userProfile.id);
        setSubmitting(false);
        if (error) {
            Alert.alert('Error', error.message);
            return;
        }

        // Optionally trigger AI immediately if user wants, but here we just close and refresh
        setModalVisible(false);
        setDestination('');
        setDays('');
        setBudget('');
        fetchTrips();
    };

    const handleGenerateAI = async (trip: Trip) => {
        try {
            setGeneratingAI(trip.id);
            const suggestions = await generateItinerary(
                trip.destination || '',
                trip.days || 1,
                trip.estimated_budget || 0
            );
            await updateTripWithAI(trip.id, suggestions);
            fetchTrips(); // Refresh to show the badge/status
            setGeneratingAI(null);
            Alert.alert('AI Itinerary Ready', 'Your custom itinerary has been generated!');
        } catch (error) {
            Alert.alert('Error', 'AI generation failed. Please try again later.');
            setGeneratingAI(null);
        }
    };

    const showAISuggestions = (trip: Trip) => {
        setSelectedTrip(trip);
        setAiVisible(true);
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
                <ResponsiveContainer>
                    <View style={styles.center}>
                        <ActivityIndicator size="large" color={theme.colors.primary} />
                    </View>
                </ResponsiveContainer>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.colors.text }]}>Trip Planner</Text>
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <ResponsiveContainer>
                {trips.length === 0 ? (
                    <View style={styles.center}>
                        <Ionicons name="map-outline" size={64} color={theme.colors.border} />
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                            No trips planned yet
                        </Text>
                        <Button label="Plan a Trip" onPress={() => setModalVisible(true)} />
                    </View>
                ) : (
                    <FlatList
                        data={trips}
                        keyExtractor={item => String(item.id)}
                        contentContainerStyle={{ padding: 16 }}
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                        renderItem={({ item }) => (
                            <Card elevated>
                                <View style={styles.row}>
                                    <View
                                        style={[
                                            styles.iconBox,
                                            { backgroundColor: STATUS_COLORS[item.status ?? 'planning'] + '20' },
                                        ]}
                                    >
                                        <Ionicons
                                            name="airplane-outline"
                                            size={28}
                                            color={STATUS_COLORS[item.status ?? 'planning']}
                                        />
                                    </View>
                                    <View style={styles.flex}>
                                        <Text style={[styles.destination, { color: theme.colors.text }]}>
                                            {item.destination}
                                        </Text>
                                        <View style={styles.statsRow}>
                                            <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                                                {item.days} day{(item.days ?? 0) > 1 ? 's' : ''} · RM {Number(item.estimated_budget ?? 0).toFixed(0)}
                                            </Text>

                                            {item.ai_suggestions ? (
                                                <TouchableOpacity
                                                    style={[styles.aiBadge, { backgroundColor: theme.colors.success + '15' }]}
                                                    onPress={() => showAISuggestions(item)}
                                                >
                                                    <Ionicons name="sparkles" size={12} color={theme.colors.success} />
                                                    <Text style={[styles.aiBadgeText, { color: theme.colors.success }]}>View AI Plan</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <TouchableOpacity
                                                    style={[styles.aiBadge, { backgroundColor: theme.colors.primary + '15' }]}
                                                    onPress={() => handleGenerateAI(item)}
                                                    disabled={generatingAI === item.id}
                                                >
                                                    {generatingAI === item.id ? (
                                                        <ActivityIndicator size="small" color={theme.colors.primary} />
                                                    ) : (
                                                        <>
                                                            <Ionicons name="sparkles-outline" size={12} color={theme.colors.primary} />
                                                            <Text style={[styles.aiBadgeText, { color: theme.colors.primary }]}>Get AI Plan</Text>
                                                        </>
                                                    )}
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        <View
                                            style={[
                                                styles.statusBadge,
                                                { backgroundColor: STATUS_COLORS[item.status ?? 'planning'] + '20' },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    { color: STATUS_COLORS[item.status ?? 'planning'] },
                                                ]}
                                            >
                                                {item.status?.charAt(0).toUpperCase()}{item.status?.slice(1)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </Card>
                        )}
                    />
                )}
            </ResponsiveContainer>

            {/* AI Suggestions Modal */}
            <Modal visible={aiVisible} transparent animationType="fade">
                <View style={styles.aiOverlay}>
                    <View style={[styles.aiModal, { backgroundColor: theme.colors.surface }]}>
                        <View style={styles.aiHeader}>
                            <Text style={[styles.aiTitle, { color: theme.colors.text }]}>
                                <Ionicons name="sparkles" size={20} color={theme.colors.primary} /> AI Itinerary
                            </Text>
                            <TouchableOpacity onPress={() => setAiVisible(false)}>
                                <Ionicons name="close" size={24} color={theme.colors.text} />
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            <Text style={[styles.aiBody, { color: theme.colors.text }]}>
                                {selectedTrip?.ai_suggestions}
                            </Text>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* New Trip Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Plan a Trip</Text>

                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Destination</Text>
                        <View style={{ height: 50, zIndex: 999, marginBottom: 12 }}>
                            <GooglePlacesAutocomplete
                                placeholder='Search for a city...'
                                onPress={(data, details = null) => {
                                    setDestination(data.description);
                                }}
                                query={{
                                    key: GOOGLE_MAPS_API_KEY,
                                    language: 'en',
                                    types: '(cities)',
                                }}
                                styles={{
                                    textInput: [
                                        styles.input,
                                        { height: 48, borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.backgroundSecondary },
                                    ],
                                    listView: { backgroundColor: '#fff', position: 'absolute', top: 50, left: 0, right: 0, elevation: 5, zIndex: 1000 },
                                }}
                                textInputProps={{
                                    value: destination,
                                    onChangeText: setDestination,
                                }}
                                enablePoweredByContainer={false}
                            />
                        </View>

                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Duration (days)</Text>
                        <TextInput
                            value={days}
                            onChangeText={setDays}
                            keyboardType="number-pad"
                            placeholder="e.g. 3"
                            placeholderTextColor={theme.colors.placeholder}
                            style={[
                                styles.input,
                                { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.backgroundSecondary },
                            ]}
                        />

                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Estimated Budget (RM)</Text>
                        <TextInput
                            value={budget}
                            onChangeText={setBudget}
                            keyboardType="decimal-pad"
                            placeholder="e.g. 500"
                            placeholderTextColor={theme.colors.placeholder}
                            style={[
                                styles.input,
                                { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.backgroundSecondary },
                            ]}
                        />

                        <View style={styles.modalBtns}>
                            <Button
                                label="Cancel"
                                variant="outline"
                                onPress={() => { setModalVisible(false); setDestination(''); setDays(''); setBudget(''); }}
                                style={{ flex: 1 }}
                            />
                            <Button
                                label={submitting ? 'Creating…' : 'Create Trip'}
                                onPress={handleCreate}
                                disabled={submitting}
                                style={{ flex: 1 }}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
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
    emptyText: { fontSize: 16 },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    flex: { flex: 1 },
    iconBox: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    destination: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    aiBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, flexDirection: 'row', alignItems: 'center', gap: 4 },
    aiBadgeText: { fontSize: 11, fontWeight: '700' },
    statusBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, marginTop: 6 },
    statusText: { fontSize: 12, fontWeight: '700' },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 6 },
    input: { height: 48, borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 14, fontSize: 16, marginBottom: 12 },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 4 },
    aiOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    aiModal: { borderRadius: 20, maxHeight: '80%', overflow: 'hidden' },
    aiHeader: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    aiTitle: { fontSize: 18, fontWeight: '800' },
    aiBody: { fontSize: 14, lineHeight: 22 },
});
