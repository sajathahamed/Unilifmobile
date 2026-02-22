import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';
import { makeRedirectUri } from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { Database, UserRole } from '../types/database';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth configuration
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

// Create redirect URI for OAuth
const redirectUri = makeRedirectUri({
  scheme: 'unilife',
  path: 'auth/callback',
});

// Generate random string for PKCE
const generateRandomString = async (length: number): Promise<string> => {
  const randomBytes = await Crypto.getRandomBytesAsync(length);
  return Array.from(randomBytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length);
};

// Google Sign-In using Supabase OAuth
export const signInWithGoogle = async () => {
  try {
    // Generate PKCE verifier
    const codeVerifier = await generateRandomString(64);
    
    // Create PKCE challenge
    const encoder = new TextEncoder();
    const data = encoder.encode(codeVerifier);
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      codeVerifier,
      { encoding: Crypto.CryptoEncoding.BASE64 }
    );
    
    // Convert to URL-safe base64
    const codeChallenge = digest
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Get OAuth URL from Supabase
    const { data: oauthData, error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUri,
        skipBrowserRedirect: true,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (oauthError) {
      return { data: null, error: oauthError };
    }

    if (!oauthData.url) {
      return { data: null, error: new Error('No OAuth URL returned') };
    }

    // Open browser for authentication
    const result = await WebBrowser.openAuthSessionAsync(
      oauthData.url,
      redirectUri
    );

    if (result.type === 'success' && result.url) {
      // Extract tokens from URL
      const url = new URL(result.url);
      const params = new URLSearchParams(url.hash.substring(1));
      
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (accessToken) {
        // Set session manually
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (sessionError) {
          return { data: null, error: sessionError };
        }

        // Get user info and create/update in database
        if (sessionData.user) {
          const payload: Database['public']['Tables']['users']['Insert'] = {
            name: sessionData.user.user_metadata?.full_name || sessionData.user.email?.split('@')[0] || 'User',
            email: sessionData.user.email!,
            role: 'student' as UserRole,
          };

          const { error: upsertError } = await supabase.from('users').upsert(payload, {
            onConflict: 'email',
            ignoreDuplicates: true,
          });

          if (upsertError) {
            console.error('Error upserting user:', upsertError);
          }
        }

        return { data: sessionData, error: null };
      }
    }

    return { data: null, error: new Error('Authentication cancelled or failed') };
  } catch (error) {
    console.error('Google sign-in error:', error);
    return { data: null, error: error as Error };
  }
};

// Listen for auth state changes
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  return supabase.auth.onAuthStateChange(callback);
};
