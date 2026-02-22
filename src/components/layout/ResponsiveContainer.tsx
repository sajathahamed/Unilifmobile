import React from 'react';
import { View, StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';

interface ResponsiveContainerProps {
    children: React.ReactNode;
    style?: ViewStyle;
    maxWidth?: number;
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
    children,
    style,
    maxWidth = 768
}) => {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    return (
        <View style={[styles.wrapper, style]}>
            <View
                style={[
                    styles.container,
                    isTablet && { maxWidth, alignSelf: 'center', width: '100%' }
                ]}
            >
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
        width: '100%',
    },
    container: {
        flex: 1,
        width: '100%',
    },
});
