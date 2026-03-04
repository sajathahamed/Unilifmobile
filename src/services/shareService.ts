/**
 * Share Service for Trip Plans
 * Handles sharing via WhatsApp, Email, and Native Share
 */

import { Share, Linking, Platform, Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { TripPlanResponse } from './deepseek';

interface ShareTripData {
    userName: string;
    destination: string;
    days: number;
    travelers: number;
    totalCost: number;
    summary: string;
    pdfUri?: string;
}

/**
 * Format number as LKR currency
 */
function formatLKR(amount: number): string {
    return `LKR ${amount.toLocaleString()}`;
}

/**
 * Generate share text content
 */
function generateShareText(data: ShareTripData): string {
    return `🌴 Trip Plan to ${data.destination}

👤 Traveler: ${data.userName}
📅 Duration: ${data.days} days
👥 Travelers: ${data.travelers}
💰 Total Cost: ${formatLKR(data.totalCost)}

📋 Summary:
${data.summary}

Generated with UniLife Trip Planner ✈️`;
}

/**
 * Share via Native Share (supports all apps)
 */
export async function shareViaNative(data: ShareTripData): Promise<boolean> {
    try {
        const message = generateShareText(data);
        
        const result = await Share.share({
            message,
            title: `Trip Plan to ${data.destination}`,
        });

        return result.action === Share.sharedAction;
    } catch (error) {
        console.error('Native share error:', error);
        return false;
    }
}

/**
 * Share PDF via Native Share
 */
export async function sharePDFViaNative(pdfUri: string, title: string): Promise<boolean> {
    try {
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            Alert.alert('Error', 'Sharing is not available on this device');
            return false;
        }

        await Sharing.shareAsync(pdfUri, {
            mimeType: 'application/pdf',
            dialogTitle: title,
        });

        return true;
    } catch (error) {
        console.error('PDF share error:', error);
        return false;
    }
}

/**
 * Share via WhatsApp
 */
export async function shareViaWhatsApp(data: ShareTripData): Promise<boolean> {
    try {
        const message = generateShareText(data);
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `whatsapp://send?text=${encodedMessage}`;
        
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (!canOpen) {
            Alert.alert('WhatsApp Not Found', 'Please install WhatsApp to share via this method.');
            return false;
        }

        await Linking.openURL(whatsappUrl);
        return true;
    } catch (error) {
        console.error('WhatsApp share error:', error);
        return false;
    }
}

/**
 * Share via WhatsApp to specific number
 */
export async function shareViaWhatsAppToNumber(data: ShareTripData, phoneNumber: string): Promise<boolean> {
    try {
        const message = generateShareText(data);
        const encodedMessage = encodeURIComponent(message);
        // Remove any non-numeric characters from phone number
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        const whatsappUrl = `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`;
        
        const canOpen = await Linking.canOpenURL(whatsappUrl);
        if (!canOpen) {
            Alert.alert('WhatsApp Not Found', 'Please install WhatsApp to share via this method.');
            return false;
        }

        await Linking.openURL(whatsappUrl);
        return true;
    } catch (error) {
        console.error('WhatsApp share error:', error);
        return false;
    }
}

/**
 * Share via Email
 */
export async function shareViaEmail(data: ShareTripData, recipientEmail?: string): Promise<boolean> {
    try {
        const subject = encodeURIComponent(`Trip Plan to ${data.destination} - UniLife`);
        const body = encodeURIComponent(`${generateShareText(data)}

---
Want to plan your own trip? Download UniLife app!`);

        const mailtoUrl = recipientEmail 
            ? `mailto:${recipientEmail}?subject=${subject}&body=${body}`
            : `mailto:?subject=${subject}&body=${body}`;
        
        const canOpen = await Linking.canOpenURL(mailtoUrl);
        if (!canOpen) {
            Alert.alert('Email Not Available', 'No email app found on this device.');
            return false;
        }

        await Linking.openURL(mailtoUrl);
        return true;
    } catch (error) {
        console.error('Email share error:', error);
        return false;
    }
}

/**
 * Make a phone call (for hotel/place booking)
 */
export async function makePhoneCall(phoneNumber: string): Promise<boolean> {
    try {
        // Remove any non-numeric characters except +
        const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
        const phoneUrl = `tel:${cleanNumber}`;
        
        const canOpen = await Linking.canOpenURL(phoneUrl);
        if (!canOpen) {
            Alert.alert('Cannot Make Call', 'Phone calling is not supported on this device.');
            return false;
        }

        await Linking.openURL(phoneUrl);
        return true;
    } catch (error) {
        console.error('Phone call error:', error);
        return false;
    }
}

/**
 * Open booking link in browser
 */
export async function openBookingLink(url: string): Promise<boolean> {
    try {
        // Ensure URL has protocol
        let fullUrl = url;
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            fullUrl = `https://${url}`;
        }
        
        const canOpen = await Linking.canOpenURL(fullUrl);
        if (!canOpen) {
            Alert.alert('Cannot Open Link', 'Unable to open this booking link.');
            return false;
        }

        await Linking.openURL(fullUrl);
        return true;
    } catch (error) {
        console.error('Open link error:', error);
        return false;
    }
}

/**
 * Show share options modal
 */
export function getShareOptions(data: ShareTripData, pdfUri?: string) {
    return [
        {
            id: 'native',
            label: 'Share',
            icon: 'share-outline',
            action: () => shareViaNative(data),
        },
        {
            id: 'whatsapp',
            label: 'WhatsApp',
            icon: 'logo-whatsapp',
            action: () => shareViaWhatsApp(data),
        },
        {
            id: 'email',
            label: 'Email',
            icon: 'mail-outline',
            action: () => shareViaEmail(data),
        },
        ...(pdfUri ? [{
            id: 'pdf',
            label: 'Share PDF',
            icon: 'document-outline',
            action: () => sharePDFViaNative(pdfUri, `Trip Plan - ${data.destination}`),
        }] : []),
    ];
}

export default {
    shareViaNative,
    sharePDFViaNative,
    shareViaWhatsApp,
    shareViaWhatsAppToNumber,
    shareViaEmail,
    makePhoneCall,
    openBookingLink,
    getShareOptions,
};
