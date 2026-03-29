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
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { deliveryPersonLogin } from '../../lib/db';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const DeliveryPersonLogin: React.FC<{ navigation: any }> = ({ navigation }) => {
    const { theme } = useTheme();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter your Rider ID and Passcode');
            return;
        }

        setLoading(true);
        try {
            const { data, error } = await deliveryPersonLogin(email, password);
            if (error || !data) {
                Alert.alert('Login Failed', 'Invalid Rider ID or Passcode. Please check your credentials.');
            } else {
                // Store rider session
                await AsyncStorage.setItem('delivery_rider', JSON.stringify(data));
                navigation.replace('DeliveryPersonDashboard');
            }
        } catch (err) {
            Alert.alert('Error', 'Unable to connect to service. Please try again later.');
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
                    
                    <View style={styles.heroSection}>
                        <View style={[styles.iconBox, { backgroundColor: '#FFD70020' }]}>
                            <Ionicons name="bicycle" size={48} color="#DAA520" />
                        </View>
                        <Text style={[styles.title, { color: theme.colors.text }]}>UniLife Delivery</Text>
                        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                            Log in to start your delivery shift
                        </Text>
                    </View>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Rider Email / ID</Text>
                        <View style={[styles.inputWrapper, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface }]}>
                            <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} />
                            <TextInput
                                style={[styles.input, { color: theme.colors.text }]}
                                placeholder="rider@unilife.com"
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
                            <Ionicons name="key-outline" size={20} color={theme.colors.textSecondary} />
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
                        style={[styles.loginBtn, { backgroundColor: '#DAA520' }]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Text style={styles.loginBtnText}>Go Online</Text>
                                <Ionicons name="power" size={20} color="#fff" />
                            </>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.forgotBtn}
                        onPress={() => Alert.alert('Contact Support', 'Please contact your manager to reset your passcode.')}
                    >
                        <Text style={[styles.forgotBtnText, { color: theme.colors.textSecondary }]}>
                            Forgot passcode?
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={[styles.infoCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
                    <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} />
                    <Text style={[styles.infoText, { color: theme.colors.text }]}>
                        Always wear your official UniLife gear during deliveries.
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { flex: 1, padding: 24 },
    header: { marginTop: 20, marginBottom: 40 },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    heroSection: { alignItems: 'center' },
    iconBox: { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
    title: { fontSize: 28, fontWeight: '800', textAlign: 'center' },
    subtitle: { fontSize: 16, textAlign: 'center', marginTop: 8 },
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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    loginBtnText: { color: '#fff', fontSize: 18, fontWeight: '700' },
    forgotBtn: { alignSelf: 'center', padding: 8 },
    forgotBtnText: { fontSize: 14, textDecorationLine: 'underline' },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 40,
        gap: 12,
    },
    infoText: { flex: 1, fontSize: 13, lineHeight: 18 },
});

export default DeliveryPersonLogin;
