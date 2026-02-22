import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@theme/index';
import { Card } from '@components/ui/Card';
import { ResponsiveContainer } from '@components/layout/ResponsiveContainer';
import { getFoodOrderById } from '@lib/index';
import { FoodOrder } from '@app-types/database';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppStackParamList } from '@app-types/index';
import { Ionicons } from '@expo/vector-icons';

export type OrderTrackingScreenProps = NativeStackScreenProps<AppStackParamList, 'OrderTracking'>;

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered';

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];

const STATUS_LABELS: Record<OrderStatus, string> = {
    pending: 'Order Placed',
    confirmed: 'Confirmed',
    preparing: 'Preparing',
    ready: 'Ready for Pickup',
    delivered: 'Delivered',
};

const STATUS_ICONS: Record<OrderStatus, keyof typeof Ionicons.glyphMap> = {
    pending: 'receipt-outline',
    confirmed: 'checkmark-circle-outline',
    preparing: 'flame-outline',
    ready: 'bag-check-outline',
    delivered: 'home-outline',
};

export const OrderTrackingScreen: React.FC<OrderTrackingScreenProps> = ({ route }) => {
    const { theme } = useTheme();
    const { orderId } = route.params;
    const [order, setOrder] = useState<FoodOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchOrder = useCallback(async () => {
        const { data } = await getFoodOrderById(orderId);
        if (data) setOrder(data as FoodOrder);
        setLoading(false);
    }, [orderId]);

    useEffect(() => {
        fetchOrder();
        timerRef.current = setInterval(fetchOrder, 5000);
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [fetchOrder]);

    const currentStatus = (order?.status as OrderStatus) ?? 'pending';
    const currentIndex = STATUS_STEPS.indexOf(currentStatus);

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

    if (!order) {
        return (
            <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
                <ResponsiveContainer>
                    <View style={styles.center}>
                        <Text style={{ color: theme.colors.textSecondary }}>Order not found</Text>
                    </View>
                </ResponsiveContainer>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
            <ResponsiveContainer>
                <ScrollView contentContainerStyle={{ padding: 16 }}>
                    <Card elevated style={{ marginBottom: 16 }}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>Order #{order.id}</Text>
                        <Text style={[styles.vendor, { color: theme.colors.textSecondary }]}>
                            {(order as any).vendors?.name || 'Vendor'}
                        </Text>
                        <Text style={[styles.amount, { color: theme.colors.primary }]}>
                            RM {Number(order.total ?? 0).toFixed(2)}
                        </Text>
                    </Card>

                    <Card elevated>
                        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Order Timeline</Text>
                        <View style={{ marginTop: 12 }}>
                            {STATUS_STEPS.map((step, index) => {
                                const isDone = index <= currentIndex;
                                const isActive = index === currentIndex;
                                return (
                                    <View key={step} style={styles.stepRow}>
                                        {/* Vertical connector */}
                                        <View style={styles.stepLeft}>
                                            <View
                                                style={[
                                                    styles.stepCircle,
                                                    {
                                                        backgroundColor: isDone ? theme.colors.primary : theme.colors.border,
                                                        borderColor: isActive ? theme.colors.primary : 'transparent',
                                                    },
                                                ]}
                                            >
                                                {isDone ? (
                                                    <Ionicons name={STATUS_ICONS[step]} size={16} color="#fff" />
                                                ) : (
                                                    <View style={[styles.stepDot, { backgroundColor: theme.colors.border }]} />
                                                )}
                                            </View>
                                            {index < STATUS_STEPS.length - 1 && (
                                                <View
                                                    style={[
                                                        styles.connector,
                                                        { backgroundColor: index < currentIndex ? theme.colors.primary : theme.colors.border },
                                                    ]}
                                                />
                                            )}
                                        </View>
                                        <View style={styles.stepContent}>
                                            <Text
                                                style={[
                                                    styles.stepLabel,
                                                    {
                                                        color: isActive ? theme.colors.primary : isDone ? theme.colors.text : theme.colors.textSecondary,
                                                        fontWeight: isActive ? '800' : '600',
                                                    },
                                                ]}
                                            >
                                                {STATUS_LABELS[step]}
                                            </Text>
                                            {isActive && (
                                                <Text style={[styles.stepSubtitle, { color: theme.colors.textSecondary }]}>
                                                    Auto-refreshing…
                                                </Text>
                                            )}
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </Card>
                </ScrollView>
            </ResponsiveContainer>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    title: { fontSize: 20, fontWeight: '800' },
    vendor: { fontSize: 14, marginTop: 4 },
    amount: { fontSize: 22, fontWeight: '800', marginTop: 8 },
    sectionTitle: { fontSize: 16, fontWeight: '700' },
    stepRow: { flexDirection: 'row', marginBottom: 0 },
    stepLeft: { alignItems: 'center', marginRight: 16 },
    stepCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
    },
    stepDot: { width: 10, height: 10, borderRadius: 5 },
    connector: { width: 2, height: 32, marginVertical: 2 },
    stepContent: { flex: 1, paddingVertical: 8 },
    stepLabel: { fontSize: 15 },
    stepSubtitle: { fontSize: 12, marginTop: 2 },
});
