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

export const LaundryScreen: React.FC = () => {
    const { theme } = useTheme();
    const { userProfile } = useAuth();
    const [orders, setOrders] = useState<LaundryOrder[]>([]);
    const [services, setServices] = useState<LaundryService[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedService, setSelectedService] = useState<LaundryService | null>(null);
    const [weight, setWeight] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // AI Detection States
    const [detecting, setDetecting] = useState(false);
    const [detectedItems, setDetectedItems] = useState<Record<string, number>>({});

    const fetchData = useCallback(async () => {
        if (!userProfile?.id) { setLoading(false); return; }
        setLoading(true);
        const [ordersRes, servicesRes] = await Promise.all([
            getLaundryOrdersForStudent(userProfile.id),
            getLaundryServices(),
        ]);
        if (ordersRes.data) setOrders(ordersRes.data as LaundryOrder[]);
        if (servicesRes.data) setServices(servicesRes.data as LaundryService[]);
        setLoading(false);
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
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                base64: true,
            });

            if (!result.canceled && result.assets[0].base64) {
                setDetecting(true);
                const items = await detectClothing(result.assets[0].base64);
                setDetectedItems(items);
                setDetecting(false);
            }
        } catch (error: any) {
            console.error('LaundryScreen pickAndProcessImage Error:', error);
            Alert.alert('Error', `AI detection failed: ${error.message || 'Unknown error'}. You can add items manually.`);
            setDetecting(false);
        }
    };

    const handleNewOrder = async () => {
        if (!selectedService || !weight || !userProfile?.id) {
            Alert.alert('Missing Info', 'Please select a service and enter weight.');
            return;
        }
        const kg = parseFloat(weight);
        if (isNaN(kg) || kg <= 0) {
            Alert.alert('Invalid Weight', 'Please enter a valid weight in kg.');
            return;
        }
        const total = (selectedService.price_per_kg ?? 0) * kg;
        setSubmitting(true);
        const { error } = await createLaundryOrder(
            userProfile.id,
            selectedService.id,
            'per_kg',
            total,
            detectedItems
        );
        setSubmitting(false);
        if (error) {
            Alert.alert('Error', error.message);
            return;
        }
        setModalVisible(false);
        setSelectedService(null);
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
                <Text style={[styles.title, { color: theme.colors.text }]}>Laundry</Text>
                <TouchableOpacity
                    style={[styles.addBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={() => setModalVisible(true)}
                >
                    <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <ResponsiveContainer>
                {orders.length === 0 ? (
                    <View style={styles.center}>
                        <Ionicons name="water-outline" size={64} color={theme.colors.border} />
                        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
                            No laundry orders yet
                        </Text>
                        <Button label="Place Laundry Order" onPress={() => setModalVisible(true)} />
                    </View>
                ) : (
                    <FlatList
                        data={orders}
                        keyExtractor={item => String(item.id)}
                        contentContainerStyle={{ padding: 16 }}
                        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
                        renderItem={({ item }) => (
                            <Card elevated>
                                <View style={styles.row}>
                                    <View style={styles.flex}>
                                        <Text style={[styles.serviceName, { color: theme.colors.text }]}>
                                            {(item as any).laundry_services?.name || 'Laundry Service'}
                                        </Text>
                                        <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                                            {(item as any).laundry_services?.location}
                                        </Text>

                                        {item.items_json && Object.keys(item.items_json).length > 0 && (
                                            <View style={styles.itemsBadgeRow}>
                                                {Object.entries(item.items_json).map(([name, count]) => (
                                                    <View key={name} style={[styles.minorBadge, { backgroundColor: theme.colors.backgroundSecondary }]}>
                                                        <Text style={{ fontSize: 10, color: theme.colors.text }}>{name}: {count}</Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}

                                        <Text style={{ color: theme.colors.text, fontWeight: '700', marginTop: 4 }}>
                                            RM {Number(item.total_price ?? 0).toFixed(2)}
                                        </Text>
                                        <Text style={{ color: theme.colors.textTertiary, fontSize: 12, marginTop: 2 }}>
                                            {new Date(item.created_at).toLocaleDateString()}
                                        </Text>
                                    </View>
                                    <Badge
                                        label={item.status ?? 'pending'}
                                        variant={STATUS_VARIANT[item.status ?? 'pending'] ?? 'primary'}
                                    />
                                </View>
                            </Card>
                        )}
                    />
                )}
            </ResponsiveContainer>

            {/* New Order Modal */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.overlay}>
                    <View style={[styles.modal, { backgroundColor: theme.colors.surface }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>New Laundry Order</Text>

                            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Select Service</Text>
                            {services.map(svc => (
                                <TouchableOpacity
                                    key={svc.id}
                                    style={[
                                        styles.serviceOption,
                                        {
                                            borderColor:
                                                selectedService?.id === svc.id ? theme.colors.primary : theme.colors.border,
                                            backgroundColor:
                                                selectedService?.id === svc.id
                                                    ? theme.colors.primary + '15'
                                                    : theme.colors.backgroundSecondary,
                                        },
                                    ]}
                                    onPress={() => setSelectedService(svc)}
                                >
                                    <Text style={{ color: theme.colors.text, fontWeight: '700' }}>{svc.name}</Text>
                                    <Text style={{ color: theme.colors.textSecondary, fontSize: 13 }}>
                                        RM {svc.price_per_kg}/kg · {svc.location}
                                    </Text>
                                </TouchableOpacity>
                            ))}

                            <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                                AI Clothing Detection (Optional)
                            </Text>
                            <TouchableOpacity
                                style={[styles.uploadBtn, { borderColor: theme.colors.primary, backgroundColor: theme.colors.primary + '08' }]}
                                onPress={pickAndProcessImage}
                                disabled={detecting}
                            >
                                {detecting ? (
                                    <ActivityIndicator size="small" color={theme.colors.primary} />
                                ) : (
                                    <>
                                        <Ionicons name="camera-outline" size={24} color={theme.colors.primary} />
                                        <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>
                                            {Object.keys(detectedItems).length > 0 ? 'Retake Photo' : 'Upload & Detect Items'}
                                        </Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {Object.keys(detectedItems).length > 0 && (
                                <View style={styles.detectedList}>
                                    <Text style={[styles.detectedTitle, { color: theme.colors.text }]}>Detected Items:</Text>
                                    {Object.entries(detectedItems).map(([key, count]) => (
                                        <View key={key} style={styles.detectRow}>
                                            <Text style={[styles.detectLabel, { color: theme.colors.text }]}>{key}</Text>
                                            <TextInput
                                                value={String(count)}
                                                onChangeText={(val) => updateCount(key, val)}
                                                keyboardType="number-pad"
                                                style={[styles.miniInput, { color: theme.colors.text, borderColor: theme.colors.border }]}
                                            />
                                            <TouchableOpacity onPress={() => removeItem(key)}>
                                                <Ionicons name="close-circle" size={20} color={theme.colors.error} />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            )}

                            <Text style={[styles.label, { color: theme.colors.textSecondary, marginTop: 12 }]}>
                                Weight (kg)
                            </Text>
                            <TextInput
                                value={weight}
                                onChangeText={setWeight}
                                keyboardType="decimal-pad"
                                placeholder="e.g. 3.5"
                                placeholderTextColor={theme.colors.placeholder}
                                style={[
                                    styles.input,
                                    { borderColor: theme.colors.border, color: theme.colors.text, backgroundColor: theme.colors.backgroundSecondary },
                                ]}
                            />

                            {selectedService && weight ? (
                                <Text style={[styles.totalPreview, { color: theme.colors.primary }]}>
                                    Estimated: RM {((selectedService.price_per_kg ?? 0) * parseFloat(weight || '0')).toFixed(2)}
                                </Text>
                            ) : null}

                            <View style={styles.modalBtns}>
                                <Button
                                    label="Cancel"
                                    variant="outline"
                                    onPress={() => { setModalVisible(false); setSelectedService(null); setWeight(''); setDetectedItems({}); }}
                                    style={{ flex: 1 }}
                                />
                                <Button
                                    label={submitting ? 'Placing…' : 'Place Order'}
                                    onPress={handleNewOrder}
                                    disabled={submitting || detecting}
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
    header: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: { fontSize: 22, fontWeight: '800' },
    addBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32 },
    emptyText: { fontSize: 16 },
    row: { flexDirection: 'row', alignItems: 'center' },
    flex: { flex: 1 },
    serviceName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modal: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '90%' },
    modalTitle: { fontSize: 20, fontWeight: '800', marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
    serviceOption: {
        borderWidth: 1.5,
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
    },
    uploadBtn: {
        height: 56,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 12,
    },
    detectedList: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    detectedTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
    detectRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
    detectLabel: { flex: 1, fontSize: 14 },
    miniInput: { width: 50, height: 32, borderWidth: 1, borderRadius: 6, textAlign: 'center', padding: 0 },
    itemsBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
    minorBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
    input: {
        height: 48,
        borderWidth: 1.5,
        borderRadius: 10,
        paddingHorizontal: 14,
        fontSize: 16,
        marginBottom: 8,
    },
    totalPreview: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
    modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
}); 
