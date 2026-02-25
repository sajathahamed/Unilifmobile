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
    Animated,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Badge } from '@components/ui/Badge';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { useAuth } from '@context/AuthContext';
import {
    getLaundryOrdersForStudent,
    getLaundryServices,
    createLaundryOrder,
} from '@lib/index';
import { LaundryOrder, LaundryService } from '@app-types/database';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { detectClothing } from '@services/gemini';

const STATUS_VARIANT: Record<string, 'primary' | 'success' | 'warning' | 'error'> = {
    pending: 'warning',
    processing: 'primary',
    ready: 'success',
    completed: 'success',
    cancelled: 'error',
};

const STATUS_ICON: Record<string, string> = {
    pending: 'time-outline',
    processing: 'refresh-outline',
    ready: 'checkmark-circle-outline',
    completed: 'checkmark-done-circle-outline',
    cancelled: 'close-circle-outline',
};

export const LaundryScreen: React.FC = () => {
    const { theme } = useTheme();
    const { userProfile } = useAuth();

    const [orders, setOrders] = useState<LaundryOrder[]>([]);
    const [services, setServices] = useState<LaundryService[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Order form state
    const [selectedService, setSelectedService] = useState<LaundryService | null>(null);
    const [weight, setWeight] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // AI Detection
    const [detecting, setDetecting] = useState(false);
    const [aiAvailable, setAiAvailable] = useState(true);
    const [detectedItems, setDetectedItems] = useState<Record<string, number>>({});
    const [newItemName, setNewItemName] = useState('');
    const [newItemCount, setNewItemCount] = useState('1');

    // Tabs
    const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

    const fetchData = useCallback(async (isRefresh = false) => {
        if (!userProfile?.id) { setLoading(false); return; }
        if (isRefresh) setRefreshing(true); else setLoading(true);

        const [ordersRes, servicesRes] = await Promise.all([
            getLaundryOrdersForStudent(userProfile.id),
            getLaundryServices(),
        ]);

        console.log('[LaundryScreen] orders result:', JSON.stringify(ordersRes));
        console.log('[LaundryScreen] services result:', JSON.stringify(servicesRes));

        if (ordersRes.error) {
            console.error('[LaundryScreen] orders error:', ordersRes.error);
        }
        if (ordersRes.data) setOrders(ordersRes.data as LaundryOrder[]);

        if (servicesRes.error) {
            console.error('[LaundryScreen] services error:', servicesRes.error);
        }
        if (servicesRes.data) setServices(servicesRes.data as LaundryService[]);

        if (isRefresh) setRefreshing(false); else setLoading(false);
    }, [userProfile?.id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const pickAndProcessImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Allow access to gallery to upload photos.');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                base64: true,
            });
            if (!result.canceled && result.assets[0].base64) {
                setDetecting(true);
                const items = await detectClothing(result.assets[0].base64);
                setDetectedItems(prev => ({ ...prev, ...items }));
                setDetecting(false);
            }
        } catch (error: any) {
            setDetecting(false);
            const isQuota = error.message?.includes('429') || error.status === 429;
            if (isQuota) {
                setAiAvailable(false);
                Alert.alert(
                    '🤖 AI Quota Reached',
                    'Your free AI quota is used up for today. You can still add items manually below.',
                    [{ text: 'OK, Got it' }]
                );
            } else {
                Alert.alert('Detection Failed', `Could not detect items: ${error.message || 'Unknown error'}. Add manually.`);
            }
        }
    };

    const addItemManually = () => {
        const name = newItemName.trim();
        if (!name) return;
        const count = parseInt(newItemCount, 10) || 1;
        setDetectedItems(prev => ({
            ...prev,
            [name]: (prev[name] || 0) + count,
        }));
        setNewItemName('');
        setNewItemCount('1');
    };

    const updateItemCount = (key: string, val: string) => {
        const num = parseInt(val, 10);
        setDetectedItems(prev => ({ ...prev, [key]: isNaN(num) ? 0 : num }));
    };

    const removeItem = (key: string) => {
        setDetectedItems(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    const handleNewOrder = async () => {
        if (!selectedService) {
            Alert.alert('Select Service', 'Please select a laundry service.');
            return;
        }
        if (!weight) {
            Alert.alert('Enter Weight', 'Please enter the weight in kg.');
            return;
        }
        if (!userProfile?.id) return;
        const kg = parseFloat(weight);
        if (isNaN(kg) || kg <= 0) {
            Alert.alert('Invalid Weight', 'Please enter a valid weight greater than 0.');
            return;
        }
        const total = (selectedService.price_per_kg ?? 0) * kg;
        setSubmitting(true);
        const { error } = await createLaundryOrder(
            userProfile.id,
            selectedService.id,
            'per_kg',
            total,
            Object.keys(detectedItems).length > 0 ? detectedItems : null
        );
        setSubmitting(false);
        if (error) {
            Alert.alert('Order Failed', error.message);
            return;
        }
        closeModal();
        fetchData();
        Alert.alert('✅ Order Placed!', `Your laundry order has been placed.\nTotal: RM ${total.toFixed(2)}`);
    };

    const closeModal = () => {
        setModalVisible(false);
        setSelectedService(null);
        setWeight('');
        setDetectedItems({});
        setNewItemName('');
        setNewItemCount('1');
        setAiAvailable(true);
    };

    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
    const historyOrders = orders.filter(o => o.status === 'completed' || o.status === 'cancelled');
    const displayedOrders = activeTab === 'active' ? activeOrders : historyOrders;

    const estimatedTotal = selectedService && weight
        ? (selectedService.price_per_kg ?? 0) * (parseFloat(weight) || 0)
        : 0;

    if (loading) {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                    <Text style={{ color: theme.colors.textSecondary, marginTop: 12 }}>Loading laundry...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
                <View>
                    <Text style={[styles.title, { color: theme.colors.text }]}>🧺 Laundry</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        {orders.length} order{orders.length !== 1 ? 's' : ''} total
                    </Text>
                </View>
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {/* Tab Bar */}
            <View style={[styles.tabBar, { borderBottomColor: theme.colors.border }]}>
                {(['active', 'history'] as const).map(tab => (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.tab,
                            activeTab === tab && { borderBottomColor: theme.colors.primary, borderBottomWidth: 2 },
                        ]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[
                            styles.tabText,
                            { color: activeTab === tab ? theme.colors.primary : theme.colors.textSecondary },
                        ]}>
                            {tab === 'active' ? `Active (${activeOrders.length})` : `History (${historyOrders.length})`}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <ResponsiveContainer>
                {displayedOrders.length === 0 ? (
                    <View style={styles.center}>
                        <Ionicons name="water-outline" size={72} color={theme.colors.border} />
                        <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                            {activeTab === 'active' ? 'No Active Orders' : 'No History Yet'}
                        </Text>
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                            {activeTab === 'active'
                                ? 'Place a new order to get started'
                                : 'Completed orders will appear here'}
                        </Text>
                        {activeTab === 'active' && (
                            <Button
                                label="Place Laundry Order"
                                onPress={() => setModalVisible(true)}
                            />
                        )}
                    </View>
                ) : (
                    <FlatList
                        data={displayedOrders}
                        keyExtractor={item => String(item.id)}
                        contentContainerStyle={{ padding: 16, gap: 12 }}
                        onRefresh={() => fetchData(true)}
                        refreshing={refreshing}
                        renderItem={({ item }) => {
                            const svc = (item as any).laundry_services;
                            const iconName = STATUS_ICON[item.status ?? 'pending'] as any;
                            return (
                                <Card elevated>
                                    <View style={styles.orderCard}>
                                        <View style={[styles.orderIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                                            <Ionicons name={iconName} size={28} color={theme.colors.primary} />
                                        </View>
                                        <View style={styles.flex}>
                                            <View style={styles.row}>
                                                <Text style={[styles.serviceName, { color: theme.colors.text }]}>
                                                    {svc?.name || 'Laundry Service'}
                                                </Text>
                                                <Badge
                                                    label={item.status ?? 'pending'}
                                                    variant={STATUS_VARIANT[item.status ?? 'pending'] ?? 'primary'}
                                                />
                                            </View>
                                            {svc?.location && (
                                                <Text style={[styles.location, { color: theme.colors.textSecondary }]}>
                                                    <Ionicons name="location-outline" size={12} /> {svc.location}
                                                </Text>
                                            )}
                                            {item.items_json && Object.keys(item.items_json).length > 0 && (
                                                <View style={styles.tagsRow}>
                                                    {Object.entries(item.items_json).map(([name, count]) => (
                                                        <View key={name} style={[styles.tag, { backgroundColor: theme.colors.primary + '18' }]}>
                                                            <Text style={[styles.tagText, { color: theme.colors.primary }]}>
                                                                {name} ×{count}
                                                            </Text>
                                                        </View>
                                                    ))}
                                                </View>
                                            )}
                                            <View style={styles.row}>
                                                <Text style={[styles.price, { color: theme.colors.text }]}>
                                                    RM {Number(item.total_price ?? 0).toFixed(2)}
                                                </Text>
                                                <Text style={[styles.date, { color: theme.colors.textTertiary }]}>
                                                    {new Date(item.created_at).toLocaleDateString('en-MY', {
                                                        day: 'numeric', month: 'short', year: 'numeric'
                                                    })}
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                </Card>
                            );
                        }}
                    />
                )}
            </ResponsiveContainer>

            {/* Services error hint */}
            {services.length === 0 && !loading && (
                <View style={[styles.banner, { backgroundColor: theme.colors.error + '18', borderColor: theme.colors.error + '40' }]}>
                    <Ionicons name="warning-outline" size={16} color={theme.colors.error} />
                    <Text style={[styles.bannerText, { color: theme.colors.error }]}>
                        No laundry services found. Run fix_rls.sql in Supabase SQL Editor.
                    </Text>
                </View>
            )}

            {/* New Order Modal */}
            <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
                <View style={styles.overlay}>
                    <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            {/* Modal Header */}
                            <View style={styles.modalHeader}>
                                <Text style={[styles.modalTitle, { color: theme.colors.text }]}>New Laundry Order</Text>
                                <TouchableOpacity onPress={closeModal}>
                                    <Ionicons name="close-circle" size={28} color={theme.colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            {/* Select Service */}
                            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Select Service</Text>
                            {services.length === 0 ? (
                                <View style={[styles.noServiceBox, { backgroundColor: theme.colors.error + '10', borderColor: theme.colors.error + '30' }]}>
                                    <Ionicons name="alert-circle-outline" size={20} color={theme.colors.error} />
                                    <Text style={{ color: theme.colors.error, flex: 1, fontSize: 13 }}>
                                        No services available. Run fix_rls.sql in your Supabase dashboard.
                                    </Text>
                                </View>
                            ) : (
                                services.map(svc => (
                                    <TouchableOpacity
                                        key={svc.id}
                                        style={[
                                            styles.serviceOption,
                                            {
                                                borderColor: selectedService?.id === svc.id ? theme.colors.primary : theme.colors.border,
                                                backgroundColor: selectedService?.id === svc.id
                                                    ? theme.colors.primary + '12'
                                                    : theme.colors.backgroundSecondary,
                                            },
                                        ]}
                                        onPress={() => setSelectedService(svc)}
                                    >
                                        <View style={styles.row}>
                                            <View style={styles.flex}>
                                                <Text style={[styles.svcName, { color: theme.colors.text }]}>{svc.name}</Text>
                                                <Text style={[styles.svcDetail, { color: theme.colors.textSecondary }]}>
                                                    📍 {svc.location}
                                                </Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={[styles.svcPrice, { color: theme.colors.primary }]}>
                                                    RM {svc.price_per_kg}/kg
                                                </Text>
                                                {selectedService?.id === svc.id && (
                                                    <Ionicons name="checkmark-circle" size={20} color={theme.colors.primary} />
                                                )}
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                ))
                            )}

                            {/* AI Detection */}
                            <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 16 }]}>
                                🤖 AI Item Detection {!aiAvailable && '(Quota Exceeded)'}
                            </Text>
                            <TouchableOpacity
                                style={[
                                    styles.uploadBtn,
                                    {
                                        borderColor: aiAvailable ? theme.colors.primary : theme.colors.border,
                                        backgroundColor: aiAvailable ? theme.colors.primary + '08' : theme.colors.backgroundSecondary,
                                        opacity: detecting ? 0.7 : 1,
                                    },
                                ]}
                                onPress={pickAndProcessImage}
                                disabled={detecting}
                            >
                                {detecting ? (
                                    <>
                                        <ActivityIndicator size="small" color={theme.colors.primary} />
                                        <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>Analyzing photo...</Text>
                                    </>
                                ) : (
                                    <>
                                        <Ionicons
                                            name={aiAvailable ? 'camera-outline' : 'camera-off-outline'}
                                            size={24}
                                            color={aiAvailable ? theme.colors.primary : theme.colors.textSecondary}
                                        />
                                        <Text style={{ color: aiAvailable ? theme.colors.primary : theme.colors.textSecondary, fontWeight: '600' }}>
                                            {Object.keys(detectedItems).length > 0
                                                ? 'Retake Photo'
                                                : aiAvailable
                                                    ? 'Take / Upload Photo to Detect Clothes'
                                                    : 'AI Quota Exceeded — Add Manually'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Manual Entry */}
                            <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 8 }]}>
                                ✏️ Add Items Manually
                            </Text>
                            <View style={[styles.manualRow, { borderColor: theme.colors.border, backgroundColor: theme.colors.backgroundSecondary }]}>
                                <TextInput
                                    placeholder="Item name (e.g. Jeans)"
                                    placeholderTextColor={theme.colors.placeholder}
                                    value={newItemName}
                                    onChangeText={setNewItemName}
                                    style={[styles.flex, { color: theme.colors.text, fontSize: 14 }]}
                                    returnKeyType="next"
                                    onSubmitEditing={addItemManually}
                                />
                                <TextInput
                                    placeholder="Qty"
                                    placeholderTextColor={theme.colors.placeholder}
                                    value={newItemCount}
                                    onChangeText={setNewItemCount}
                                    keyboardType="number-pad"
                                    style={[styles.qtyInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                                    returnKeyType="done"
                                    onSubmitEditing={addItemManually}
                                />
                                <TouchableOpacity
                                    onPress={addItemManually}
                                    style={[styles.addBtn2, { backgroundColor: theme.colors.primary }]}
                                >
                                    <Ionicons name="add" size={20} color="#fff" />
                                </TouchableOpacity>
                            </View>

                            {/* Detected / Added Items Display */}
                            {Object.keys(detectedItems).length > 0 && (
                                <View style={[styles.itemsList, { backgroundColor: theme.colors.primary + '08', borderColor: theme.colors.primary + '20' }]}>
                                    <Text style={[styles.itemsTitle, { color: theme.colors.text }]}>
                                        🧺 Items ({Object.values(detectedItems).reduce((a, b) => a + b, 0)} pcs)
                                    </Text>
                                    {Object.entries(detectedItems).map(([key, count]) => (
                                        <View key={key} style={styles.itemRow}>
                                            <Text style={[styles.itemName, { color: theme.colors.text }]}>{key}</Text>
                                            <TextInput
                                                value={String(count)}
                                                onChangeText={val => updateItemCount(key, val)}
                                                keyboardType="number-pad"
                                                style={[styles.qtyInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                                            />
                                            <TouchableOpacity onPress={() => removeItem(key)}>
                                                <Ionicons name="close-circle" size={22} color={theme.colors.error} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Weight Input */}
                            <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 16 }]}>
                                ⚖️ Weight (kg)
                            </Text>
                            <TextInput
                                value={weight}
                                onChangeText={setWeight}
                                keyboardType="decimal-pad"
                                placeholder="e.g. 3.5"
                                placeholderTextColor={theme.colors.placeholder}
                                style={[
                                    styles.weightInput,
                                    { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.backgroundSecondary },
                                ]}
                            />

                            {/* Total Preview */}
                            {estimatedTotal > 0 && (
                                <View style={[styles.totalBox, { backgroundColor: theme.colors.primary + '10', borderColor: theme.colors.primary + '30' }]}>
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>Estimated Total</Text>
                                    <Text style={[styles.totalAmount, { color: theme.colors.primary }]}>
                                        RM {estimatedTotal.toFixed(2)}
                                    </Text>
                                </View>
                            )}

                            {/* Action Buttons */}
                            <View style={styles.modalBtns}>
                                <Button
                                    label="Cancel"
                                    variant="outline"
                                    onPress={closeModal}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    label={submitting ? 'Placing…' : 'Place Order'}
                                    onPress={handleNewOrder}
                                    disabled={submitting || detecting || !selectedService}
                                    style={{ flex: 1 }}
                                />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
    header: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
    },
    title: { fontSize: 24, fontWeight: '800' },
    subtitle: { fontSize: 13, marginTop: 2 },
    addBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
            android: { elevation: 4 },
        }),
    },
    tabBar: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        paddingHorizontal: 16,
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginRight: 4,
    },
    tabText: { fontSize: 14, fontWeight: '600' },
    emptyTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
    emptyText: { fontSize: 14, textAlign: 'center', marginBottom: 8 },

    // Order card
    orderCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
    orderIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    flex: { flex: 1 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    serviceName: { fontSize: 16, fontWeight: '700', flex: 1 },
    location: { fontSize: 12, marginTop: 2 },
    tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    tagText: { fontSize: 11, fontWeight: '600' },
    price: { fontSize: 15, fontWeight: '700', marginTop: 6 },
    date: { fontSize: 12 },

    // Banner
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginHorizontal: 16,
        marginBottom: 8,
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    bannerText: { fontSize: 12, flex: 1 },

    // Modal
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
    modal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '92%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 20, fontWeight: '800' },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },

    // Services
    noServiceBox: { flexDirection: 'row', gap: 10, alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
    serviceOption: { borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 10 },
    svcName: { fontSize: 15, fontWeight: '700' },
    svcDetail: { fontSize: 12, marginTop: 2 },
    svcPrice: { fontSize: 14, fontWeight: '800' },

    // AI Upload
    uploadBtn: {
        height: 60,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 12,
    },

    // Manual entry
    manualRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 52,
        marginBottom: 12,
    },
    qtyInput: { width: 48, height: 34, borderWidth: 1, borderRadius: 8, textAlign: 'center', padding: 0, fontSize: 14 },
    addBtn2: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },

    // Items list
    itemsList: { borderRadius: 14, padding: 12, borderWidth: 1, marginBottom: 8, gap: 8 },
    itemsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
    itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    itemName: { flex: 1, fontSize: 14 },

    // Weight
    weightInput: {
        height: 50,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 12,
        fontWeight: '600',
    },

    // Total
    totalBox: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        marginBottom: 16,
    },
    totalAmount: { fontSize: 22, fontWeight: '900' },

    // Modal buttons
    modalBtns: { flexDirection: 'row', gap: 12, paddingBottom: 8 },
});
