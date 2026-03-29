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
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Badge } from '@components/ui/Badge';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { useAuth } from '@context/AuthContext';
import {
    getLaundryOrdersForStudent,
    getLaundryShops,
    createLaundryOrder,
} from '@lib/index';
import { LaundryOrder, LaundryShop } from '@app-types/database';

/** Order row as returned by getLaundryOrdersForStudent with nested shop relation */
export type LaundryOrderWithShop = LaundryOrder & {
    laundry_shops: { shop_name: string | null; address: string | null } | null;
};
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { detectClothing as detectClothingGemini, isGeminiConfigured } from '@services/gemini';
import { detectClothing as detectClothingHf } from '@services/openai';

const STATUS_VARIANT: Record<string, 'primary' | 'success' | 'warning' | 'error'> = {
    pending: 'warning',
    processing: 'primary',
    ready: 'success',
    completed: 'success',
    cancelled: 'error',
};

// Predefined clothing categories for manual selection
const CLOTHING_OPTIONS = [
    { name: 'T-shirt', icon: 'shirt-outline' },
    { name: 'Shirt', icon: 'shirt-outline' },
    { name: 'Pants', icon: 'resize-outline' },
    { name: 'Jeans', icon: 'resize-outline' },
    { name: 'Shorts', icon: 'cut-outline' },
    { name: 'Dress', icon: 'woman-outline' },
    { name: 'Skirt', icon: 'woman-outline' },
    { name: 'Jacket', icon: 'snow-outline' },
    { name: 'Hoodie', icon: 'snow-outline' },
    { name: 'Sweater', icon: 'snow-outline' },
    { name: 'Socks', icon: 'footsteps-outline' },
    { name: 'Underwear', icon: 'square-outline' },
    { name: 'Towel', icon: 'water-outline' },
    { name: 'Bedsheet', icon: 'bed-outline' },
    { name: 'Other', icon: 'ellipsis-horizontal-outline' },
] as const;

export const LaundryScreen: React.FC = () => {
    const { theme } = useTheme();
    const { userProfile } = useAuth();
    const [orders, setOrders] = useState<LaundryOrderWithShop[]>([]);
    const [shops, setShops] = useState<LaundryShop[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedShop, setSelectedShop] = useState<LaundryShop | null>(null);
    const [weight, setWeight] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // AI Detection States
    const [detecting, setDetecting] = useState(false);
    const [detectedItems, setDetectedItems] = useState<Record<string, number>>({});
    const [showItemPicker, setShowItemPicker] = useState(false);

    const fetchData = useCallback(async (isRefresh?: boolean) => {
        if (!userProfile?.id) {
            setLoading(false);
            setRefreshing(false);
            return;
        }
        if (!isRefresh) setLoading(true);
        else setRefreshing(true);
        setFetchError(null);

        const customerEmail = userProfile.email || '';
        const [ordersRes, shopsRes] = await Promise.all([
            getLaundryOrdersForStudent(customerEmail),
            getLaundryShops(),
        ]);

        const errors: string[] = [];
        if (ordersRes.error) {
            console.error('Error loading laundry orders:', ordersRes.error);
            errors.push('orders');
        }
        if (ordersRes.data) setOrders(ordersRes.data as LaundryOrderWithShop[]);

        if (shopsRes.error) {
            console.error('Error loading laundry shops:', shopsRes.error);
            errors.push('shops');
        }
        if (shopsRes.data) setShops(shopsRes.data as LaundryShop[]);

        if (errors.length > 0) {
            setFetchError(errors.length === 2 ? "Couldn't load laundry data." : `Couldn't load ${errors[0]}.`);
        }
        setLoading(false);
        setRefreshing(false);
    }, [userProfile?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const pickAndProcessImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission needed', 'Allow access to gallery to upload photos.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.7,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                setDetecting(true);
                try {
                    const b64 = result.assets[0].base64;
                    const useGemini = isGeminiConfigured();
                    let items: Record<string, number> = {};
                    if (useGemini) {
                        try {
                            items = await detectClothingGemini(b64);
                        } catch (geminiErr) {
                            console.warn('Gemini laundry detection failed, trying Hugging Face:', geminiErr);
                            items = await detectClothingHf(b64);
                        }
                    } else {
                        items = await detectClothingHf(b64);
                    }
                    if (Object.keys(items).length > 0) {
                        setDetectedItems(prev => {
                            // Merge with existing items
                            const merged = { ...prev };
                            for (const [key, count] of Object.entries(items)) {
                                merged[key] = (merged[key] || 0) + count;
                            }
                            return merged;
                        });
                        Alert.alert('Success', `Detected ${Object.keys(items).length} item type(s)! You can adjust the counts.`);
                    } else {
                        Alert.alert('No Items Detected', 'Could not identify specific items. Please add manually.');
                    }
                } catch (err: any) {
                    console.error('Detection error:', err);
                    Alert.alert('Detection Failed', `${err.message || 'Unknown error'}. Please add items manually.`);
                }
                setDetecting(false);
            }
        } catch (error: any) {
            console.error('LaundryScreen pickAndProcessImage Error:', error);
            Alert.alert('Error', `Image processing failed. You can add items manually.`);
            setDetecting(false);
        }
    };

    const handleNewOrder = async () => {
        if (!selectedShop || !weight || !userProfile?.id) {
            Alert.alert('Missing Info', 'Please select a laundry shop and enter weight.');
            return;
        }
        const kg = parseFloat(weight);
        if (isNaN(kg) || kg <= 0) {
            Alert.alert('Invalid Weight', 'Please enter a valid weight in kg.');
            return;
        }
        // Use a default rate; actual pricing is in the shop's price_list field
        const total = kg * 10; // Default Rs 10/kg estimate
        // Serialize detected items as a text description
        const itemsDesc = Object.keys(detectedItems).length > 0
            ? Object.entries(detectedItems).map(([name, count]) => `${name}: ${count}`).join(', ')
            : undefined;
        setSubmitting(true);
        const { error } = await createLaundryOrder(
            selectedShop.id,
            userProfile.name || '',
            userProfile.email || '', // Use email as customer identifier for fetching
            total,
            itemsDesc,
            undefined, // pickup_address
            undefined, // delivery_address
            undefined, // notes
            userProfile.id, // userId for notification
        );
        setSubmitting(false);
        if (error) {
            Alert.alert('Error', error.message);
            return;
        }
        setModalVisible(false);
        setSelectedShop(null);
        setWeight('');
        setDetectedItems({});
        fetchData();
    };

    const updateCount = (key: string, val: string) => {
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

    const addManualItem = (itemName: string) => {
        setDetectedItems(prev => ({
            ...prev,
            [itemName]: (prev[itemName] || 0) + 1,
        }));
        setShowItemPicker(false);
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

    const onRefresh = () => {
        setRefreshing(true);
        fetchData(true);
    };

    const refreshControl = (
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
    );

    const renderOrderItem = ({ item }: { item: LaundryOrderWithShop }) => (
        <Card elevation="sm" style={styles.orderCard}>
            <View style={styles.orderHeader}>
                <View style={[styles.orderIconBox, { backgroundColor: theme.colors.dashboardLaundry + '15' }]}>
                    <Ionicons name="shirt-outline" size={20} color={theme.colors.dashboardLaundry} />
                </View>
                <View style={styles.orderInfo}>
                    <Text style={[styles.orderShopName, { color: theme.colors.text }]} numberOfLines={1}>
                        {item.laundry_shops?.shop_name || 'Laundry Service'}
                    </Text>
                    <Text style={[styles.orderDate, { color: theme.colors.textTertiary }]}>
                        {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Text>
                </View>
                <Badge
                    label={item.status ?? 'pending'}
                    variant={STATUS_VARIANT[item.status ?? 'pending'] ?? 'primary'}
                    size="sm"
                />
            </View>

            <View style={[styles.orderDivider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.orderFooter}>
                <View style={styles.orderDetailItem}>
                    <Text style={[styles.orderDetailLabel, { color: theme.colors.textSecondary }]}>Total Amount</Text>
                    <Text style={[styles.orderDetailValue, { color: theme.colors.text }]}>
                        Rs {Number(item.total ?? 0).toFixed(2)}
                    </Text>
                </View>
                {item.items_description && (
                    <View style={styles.orderDetailItem}>
                        <Text style={[styles.orderDetailLabel, { color: theme.colors.textSecondary }]}>Items</Text>
                        <Text style={[styles.orderDetailValue, { color: theme.colors.text }]} numberOfLines={1}>
                            {item.items_description}
                        </Text>
                    </View>
                )}
            </View>
        </Card>
    );

    const errorBanner = fetchError ? (
        <View style={[styles.errorBanner, { backgroundColor: theme.colors.error + '20', borderColor: theme.colors.error }]}>
            <Text style={[styles.errorBannerText, { color: theme.colors.error }]}>{fetchError}</Text>
            <Button label="Retry" onPress={() => fetchData()} variant="outline" style={styles.retryBtn} />
        </View>
    ) : null;

    const shopsSection = shops.length > 0 ? (
        <View style={styles.shopsSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Available Shops</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shopScroll}>
                {shops.map((shop) => (
                    <TouchableOpacity
                        key={shop.id}
                        activeOpacity={0.8}
                        style={[styles.shopCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                        onPress={() => {
                            setSelectedShop(shop);
                            setModalVisible(true);
                        }}
                    >
                        <View style={[styles.shopIconBox, { backgroundColor: theme.colors.primary + '10' }]}>
                            <Ionicons name="storefront-outline" size={24} color={theme.colors.primary} />
                        </View>
                        <Text style={[styles.shopName, { color: theme.colors.text }]} numberOfLines={1}>
                            {shop.shop_name}
                        </Text>
                        <Text style={[styles.shopAddress, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                            {shop.address || shop.area || 'No address'}
                        </Text>
                        <View style={[styles.shopBadge, { backgroundColor: theme.colors.successLight }]}>
                            <Text style={[styles.shopBadgeText, { color: theme.colors.onSuccess }]}>OPEN</Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    ) : null;

    const ordersSectionTitle = <Text style={[styles.sectionTitle, { color: theme.colors.text, marginTop: 8 }]}>Your orders</Text>;

    const emptyOrdersContent = (
        <View style={styles.center}>
            <Ionicons name="water-outline" size={64} color={theme.colors.border} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                No laundry orders yet
            </Text>
            {shops.length > 0 && (
                <Text style={[styles.emptyHint, { color: theme.colors.textTertiary }]}>
                    Choose a shop above to place your first order.
                </Text>
            )}
            <Button label="Place Laundry Order" onPress={() => setModalVisible(true)} />
        </View>
    );

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Laundry Services</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        Manage your orders and place new ones
                    </Text>
                </View>
                <TouchableOpacity
                    activeOpacity={0.8}
                    style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <ResponsiveContainer>
                {orders.length === 0 ? (
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={refreshControl}
                        showsVerticalScrollIndicator={false}
                    >
                        {errorBanner}
                        {shopsSection}
                        {ordersSectionTitle}
                        {emptyOrdersContent}
                    </ScrollView>
                ) : (
                    <FlatList
                        data={orders}
                        keyExtractor={(item) => String(item.id)}
                        contentContainerStyle={styles.listContent}
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                        refreshControl={refreshControl}
                        ListHeaderComponent={
                            <View style={styles.listHeader}>
                                {errorBanner}
                                {shopsSection}
                                {ordersSectionTitle}
                            </View>
                        }
                        renderItem={renderOrderItem}
                    />
                )}
            </ResponsiveContainer>

            {/* New Order Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={[styles.modal, { backgroundColor: theme.colors.surface, ...theme.shadow.lg }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Place New Order</Text>
                            <TouchableOpacity onPress={() => { setModalVisible(false); setSelectedShop(null); setWeight(''); setDetectedItems({}); }}>
                                <Ionicons name="close-circle-outline" size={28} color={theme.colors.textTertiary} />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                            <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Select Laundry Shop</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.modalShopRow}>
                                {shops.length === 0 ? (
                                    <Text style={{ color: theme.colors.textSecondary }}>No shops available.</Text>
                                ) : (
                                    shops.map(shop => (
                                        <TouchableOpacity
                                            key={shop.id}
                                            style={[
                                                styles.modalShopItem,
                                                {
                                                    borderColor:
                                                        selectedShop?.id === shop.id ? theme.colors.primary : theme.colors.border,
                                                    backgroundColor:
                                                        selectedShop?.id === shop.id
                                                            ? theme.colors.primary + '10'
                                                            : theme.colors.backgroundSecondary,
                                                },
                                            ]}
                                            onPress={() => setSelectedShop(shop)}
                                        >
                                            <Ionicons 
                                                name="storefront-outline" 
                                                size={20} 
                                                color={selectedShop?.id === shop.id ? theme.colors.primary : theme.colors.textSecondary} 
                                            />
                                            <Text style={[styles.modalShopName, { color: selectedShop?.id === shop.id ? theme.colors.primary : theme.colors.text }]} numberOfLines={1}>
                                                {shop.shop_name}
                                            </Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </ScrollView>

                            <View style={styles.manualAddSection}>
                                <Text style={[styles.modalLabel, { color: theme.colors.text }]}>Items to Include</Text>
                                <Button
                                    label="Add Items Manually"
                                    variant="secondary"
                                    size="sm"
                                    onPress={() => setShowItemPicker(true)}
                                    leftIcon={<Ionicons name="add-circle-outline" size={18} color={theme.colors.primary} />}
                                    style={styles.actionBtn}
                                />
                                <Button
                                    label={detecting ? "Scanning..." : "Quick Photo Scan"}
                                    variant="outline"
                                    size="sm"
                                    onPress={pickAndProcessImage}
                                    disabled={detecting}
                                    leftIcon={<Ionicons name="camera-outline" size={18} color={theme.colors.textSecondary} />}
                                    style={styles.actionBtn}
                                />
                            </View>

                            {Object.keys(detectedItems).length > 0 && (
                                <Card variant="secondary" border={false} style={styles.itemsCard}>
                                    <Text style={[styles.itemsTitle, { color: theme.colors.textSecondary }]}>SELECTED ITEMS</Text>
                                    {Object.entries(detectedItems).map(([key, count]) => (
                                        <View key={key} style={styles.itemRow}>
                                            <Text style={[styles.itemName, { color: theme.colors.text }]}>{key}</Text>
                                            <View style={styles.countControl}>
                                                <TouchableOpacity 
                                                    onPress={() => updateCount(key, String(Math.max(0, count - 1)))}
                                                    style={[styles.countIcon, { borderColor: theme.colors.border }]}
                                                >
                                                    <Ionicons name="remove" size={14} color={theme.colors.textSecondary} />
                                                </TouchableOpacity>
                                                <TextInput
                                                    value={String(count)}
                                                    onChangeText={(val) => updateCount(key, val)}
                                                    keyboardType="number-pad"
                                                    style={[styles.countInput, { color: theme.colors.text }]}
                                                />
                                                <TouchableOpacity 
                                                    onPress={() => updateCount(key, String(count + 1))}
                                                    style={[styles.countIcon, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '10' }]}
                                                >
                                                    <Ionicons name="add" size={14} color={theme.colors.primary} />
                                                </TouchableOpacity>
                                                <TouchableOpacity onPress={() => removeItem(key)} style={styles.itemDelete}>
                                                    <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                    ))}
                                </Card>
                            )}

                            <Input
                                label="Estimated Weight (kg)"
                                value={weight}
                                onChangeText={setWeight}
                                keyboardType="decimal-pad"
                                placeholder="e.g. 3.5"
                                leftElement={<Ionicons name="speedometer-outline" size={20} color={theme.colors.textTertiary} />}
                            />

                            {selectedShop && weight ? (
                                <View style={[styles.pricePreview, { backgroundColor: theme.colors.primary + '10' }]}>
                                    <View style={styles.priceRow}>
                                        <Text style={{ color: theme.colors.textSecondary }}>Estimated Price</Text>
                                        <Text style={[styles.priceVal, { color: theme.colors.primary }]}>
                                            Rs {(10 * parseFloat(weight || '0')).toFixed(2)}
                                        </Text>
                                    </View>
                                    <Text style={{ color: theme.colors.textTertiary, fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                                        * Final price will be confirmed by the shop
                                    </Text>
                                </View>
                            ) : null}

                            <View style={styles.modalFooter}>
                                <Button
                                    label={submitting ? 'Placing Order...' : 'Confirm Order'}
                                    onPress={handleNewOrder}
                                    disabled={submitting || detecting || !selectedShop || !weight}
                                    style={styles.confirmBtn}
                                />
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Item Picker Modal */}
            <Modal visible={showItemPicker} transparent animationType="fade">
                <View style={styles.pickerOverlay}>
                    <TouchableOpacity 
                        style={StyleSheet.absoluteFill} 
                        activeOpacity={1} 
                        onPress={() => setShowItemPicker(false)}
                    />
                    <View style={[styles.pickerModal, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.modalTitle, { color: theme.colors.text, marginBottom: 16 }]}>
                            Select Item Type
                        </Text>
                        <ScrollView 
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.pickerGrid}
                        >
                            {CLOTHING_OPTIONS.map((item) => (
                                <TouchableOpacity
                                    key={item.name}
                                    style={[styles.pickerItem, { backgroundColor: theme.colors.backgroundSecondary, borderWidth: 1, borderColor: theme.colors.border }]}
                                    onPress={() => addManualItem(item.name)}
                                >
                                    <View style={styles.pickerIconContainer}>
                                        <Ionicons 
                                            name={item.icon as any} 
                                            size={24} 
                                            color={theme.colors.primary} 
                                        />
                                    </View>
                                    <Text style={[styles.pickerItemText, { color: theme.colors.text }]} numberOfLines={1}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity 
                            style={[styles.cancelPickerBtn, { borderColor: theme.colors.border }]}
                            onPress={() => setShowItemPicker(false)}
                        >
                            <Text style={{ color: theme.colors.textSecondary }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingBottom: 120 },
    listContent: { paddingHorizontal: 16, paddingBottom: 120 },
    listHeader: { marginBottom: 12 },
    errorBanner: {
        marginBottom: 20,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    errorBannerText: { fontSize: 14, flex: 1, marginRight: 12 },
    retryBtn: { minWidth: 80 },
    shopsSection: { marginBottom: 32 },
    sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: 16 },
    shopScroll: { paddingRight: 20, gap: 12 },
    shopCard: {
        width: 180,
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
    },
    shopIconBox: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    shopName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    shopAddress: { fontSize: 12, opacity: 0.7, marginBottom: 12 },
    shopBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    shopBadgeText: { fontSize: 10, fontWeight: '800' },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerLeft: { flex: 1 },
    title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { fontSize: 13, marginTop: 4 },
    addBtn: {
        width: 48,
        height: 48,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
    emptyText: { fontSize: 16, fontWeight: '600' },
    orderCard: { marginBottom: 4, padding: 16 },
    orderHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    orderIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    orderInfo: { flex: 1 },
    orderShopName: { fontSize: 15, fontWeight: '700' },
    orderDate: { fontSize: 12, marginTop: 2 },
    orderDivider: { height: 1, marginVertical: 12, opacity: 0.5 },
    orderFooter: { gap: 8 },
    orderDetailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    orderDetailLabel: { fontSize: 13 },
    orderDetailValue: { fontSize: 13, fontWeight: '600' },
    overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.4)', justifyContent: 'flex-end' },
    modal: { borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '90%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    modalTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
    modalLabel: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
    modalScroll: { paddingBottom: 24 },
    modalShopRow: { gap: 10, paddingRight: 20, marginBottom: 24 },
    modalShopItem: {
        width: 140,
        borderWidth: 1.5,
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        gap: 8,
    },
    modalShopName: { fontSize: 13, fontWeight: '600', textAlign: 'center' },
    manualAddSection: { marginVertical: 8, gap: 10, marginBottom: 24 },
    actionBtn: { width: '100%', marginBottom: 0 },
    itemsCard: { padding: 12, marginBottom: 24 },
    itemsTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 12 },
    itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    itemName: { fontSize: 14, fontWeight: '500' },
    countControl: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    countIcon: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
    countInput: { width: 32, textAlign: 'center', fontSize: 15, fontWeight: '700', padding: 0 },
    itemDelete: { marginLeft: 4 },
    pricePreview: { padding: 16, borderRadius: 16, marginBottom: 24 },
    priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    priceVal: { fontSize: 18, fontWeight: '800' },
    modalFooter: { marginTop: 8 },
    confirmBtn: { width: '100%' },
    pickerOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center' },
    pickerModal: { marginHorizontal: 20, borderRadius: 24, padding: 24, maxHeight: '75%', width: '90%' },
    pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
    pickerItem: { width: '30%', height: 90, borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 8 },
    pickerIconContainer: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    pickerItemText: { fontSize: 11, fontWeight: '600' },
    cancelPickerBtn: { marginTop: 24, height: 52, borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    emptyHint: { fontSize: 14, marginTop: 4, textAlign: 'center' },
});
 
