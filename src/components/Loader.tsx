import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, ViewStyle } from 'react-native';
import { useTheme } from '@theme/index';

interface LoaderProps {
    size?: 'small' | 'large';
    fullScreen?: boolean;
    message?: string;
    style?: ViewStyle;
}

export const Loader: React.FC<LoaderProps> = ({
    size = 'large',
    fullScreen = false,
    message,
    style,
}) => {
    const { theme } = useTheme();

    return (
        <View
            style={[
                fullScreen ? styles.fullScreen : styles.inline,
                { backgroundColor: fullScreen ? theme.colors.background : 'transparent' },
                style,
            ]}
        >
            <ActivityIndicator size={size} color={theme.colors.primary} />
            {message && (
                <Text style={[styles.message, { color: theme.colors.textSecondary }]}>
                    {message}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    fullScreen: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    inline: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    message: {
        fontSize: 14,
        marginTop: 8,
    },
});
