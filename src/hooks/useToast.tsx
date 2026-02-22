import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage } from '@app-types/index';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@theme/index';

interface ToastContextType {
  showToast: (toast: ToastMessage) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [visible] = useState(new Animated.Value(0));
  const { theme } = useTheme();

  const showToast = useCallback((toast: ToastMessage) => {
    setToast(toast);
    Animated.timing(visible, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(visible, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setToast(null));
      }, toast.duration || 2400);
    });
  }, [visible]);

  const backgroundColor = (() => {
    switch (toast?.type) {
      case 'success':
        return theme.colors.success;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      case 'info':
        return theme.colors.info;
      default:
        return theme.colors.text;
    }
  })();

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          style={{
            position: 'absolute',
            bottom: 40,
            left: 16,
            right: 16,
            opacity: visible,
            transform: [
              {
                translateY: visible.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0],
                }),
              },
            ],
          }}
        >
          <View style={[styles.toast, { backgroundColor }]}>            
            <Text style={styles.title}>{toast.title}</Text>
            {toast.message && <Text style={styles.message}>{toast.message}</Text>}
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

const styles = StyleSheet.create({
  toast: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  title: {
    color: 'white',
    fontWeight: '700',
    fontSize: 15,
  },
  message: {
    color: 'white',
    fontSize: 13,
    marginTop: 4,
  },
});
