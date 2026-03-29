import * as Crypto from 'expo-crypto';

const SMS_CONFIG = {
  USERNAME: 'Upview',
  PASSWORD: 'Upv!3w@321',
  URL: 'https://richcommunication.dialog.lk/api/sms/send',
  MASK: 'BMF',
  CAMPAIGN: 'restsaaspos',
  CLIENT_REF: 'RPOSbyUpview',
};

/**
 * Sends an SMS via the Dialog SMS Gateway
 * @param numbers Array of phone numbers (e.g., ['0771234567'])
 * @param message The text message to send
 */
export const sendDialogSms = async (numbers: string[], message: string) => {
  try {
    const passwordDigest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.MD5,
      SMS_CONFIG.PASSWORD
    );

    // Format date as YYYY-MM-DDTHH:mm:ss (local time or as required by the API)
    // The PHP code used date("Y-m-d\TH:i:s"), which doesn't include timezone
    const now = new Date();
    const created = now.toISOString().split('.')[0]; // e.g. "2023-10-27T10:30:00"

    const payload = {
      messages: [
        {
          clientRef: SMS_CONFIG.CLIENT_REF,
          number: numbers.join(','),
          mask: SMS_CONFIG.MASK,
          text: message,
          campaignName: SMS_CONFIG.CAMPAIGN,
        },
      ],
    };

    const response = await fetch(SMS_CONFIG.URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'USER': SMS_CONFIG.USERNAME,
        'DIGEST': passwordDigest,
        'CREATED': created,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('SMS API Response:', result);

    if (result.resultDesc === 'SUCCESS') {
      return { success: true, data: result };
    } else {
      return { success: false, error: result.resultDesc || 'Unknown error' };
    }
  } catch (error) {
    console.error('Failed to send SMS:', error);
    return { success: false, error: (error as Error).message };
  }
};
