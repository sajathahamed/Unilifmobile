import 'react-native-url-polyfill/auto';
import { decode, encode } from 'base-64';
import { Buffer } from 'buffer';

if (!global.btoa) global.btoa = encode;
if (!global.atob) global.atob = decode;
if (!global.Buffer) global.Buffer = Buffer;

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from '@navigation/RootNavigator';
import { ThemeProvider } from '@theme/index';
import { AuthProvider } from '@context/AuthContext';
import { CartProvider } from '@context/CartContext';
import { ToastProvider } from '@hooks/useToast';

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              <RootNavigator />
              <StatusBar style="auto" />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
