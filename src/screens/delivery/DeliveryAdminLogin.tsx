import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { deliveryAdminLogin } from '../../lib/db';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DeliveryAdminLogin: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter email and password');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await deliveryAdminLogin(email, password);
            if (error || !data) {
                Alert.alert('Login Failed', 'Invalid administrator credentials');
            } else {
                // Store admin session
                await AsyncStorage.setItem('delivery_admin', JSON.stringify(data));
                navigation.replace('DeliveryAdminDashboard');
            }
        } catch (err) {
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                        <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                    <View style={[styles.iconBox, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Ionicons name="shield-checkmark" size={40} color={theme.colors.primary} />
                    </View>
                    <Text style={[styles.title, { color: theme.colors.text }]}>Admin Portal</Text>
                    <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                        Delivery Management System
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Admin Email</Text>
                        <View style={[styles.inputWrapper, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                            <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} />
                            <TextInput
                                style={[styles.input, { color: theme.colors.text }]}
                                placeholder="admin@unilife.com"
                                placeholderTextColor={theme.colors.placeholder}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Passcode</Text>
                        <View style={[styles.inputWrapper, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} />
                            <TextInput
                                style={[styles.input, { color: theme.colors.text }]}
                                placeholder="••••••••"
                                placeholderTextColor={theme.colors.placeholder}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>
                    </View>

                    <TouchableOpacity
                        style={[styles.loginBtn, { backgroundColor: theme.colors.primary }]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.loginBtnText}>Access Dashboard</Text>
                                <Ionicons name="chevron-forward" size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>

                    <View style={styles.footer}>
                        <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
                            Restricted access for UniLife delivery administrators only.
                        </Text>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { flex: 1, padding: 24, justifyContent: 'center' },
    header: { alignItems: 'center', marginBottom: 40 },
    backBtn: { position: 'absolute', left: 0, top: 0 },
    iconBox: { width: 80, height: 80, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
    title: { fontSize: 28, fontWeight: '800', marginBottom: 8 },
    subtitle: { fontSize: 16, textAlign: 'center' },
    form: { gap: 20 },
    inputGroup: { gap: 8 },
    label: { fontSize: 14, fontWeight: '600', marginLeft: 4 },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 16,
        gap: 12,
    },
    input: { flex: 1, fontSize: 16 },
    loginBtn: {
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 10,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
    },
    loginBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 40, paddingHorizontal: 20 },
    footerText: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
});

export default DeliveryAdminLogin;
