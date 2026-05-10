'use strict';

const axios = require('axios');

/**
 * Fast2SMS API Gateway
 * Documentation: https://docs.fast2sms.com/
 */

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const FAST2SMS_URL     = 'https://www.fast2sms.com/dev/bulkV2';

/**
 * Send a Quick SMS via Fast2SMS.
 * 
 * @param {string} phoneNumber  Comma-separated list of numbers or single number
 * @param {string} message      Message body
 * @returns {Promise<{success:boolean, providerResponse:object}>}
 */
async function sendSMS(phoneNumber, message) {
  if (!FAST2SMS_API_KEY) {
    console.warn('[Fast2SMS] FAST2SMS_API_KEY not set — message not sent.');
    return {
      success: false,
      providerResponse: { error: 'Fast2SMS credentials not configured' },
    };
  }

  // Normalise phone — strip spaces/dashes, ensure 10-digit format for Fast2SMS India
  const numbers = normalisePhone(phoneNumber);

  try {
    const response = await axios.post(
      FAST2SMS_URL,
      {
        route: 'q',
        message: message,
        language: 'english',
        numbers: numbers,
      },
      {
        headers: {
          authorization: FAST2SMS_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    // Fast2SMS returns { "return": true, "request_id": "...", "message": ["..."] }
    if (response.data && response.data.return === true) {
      return { 
        success: true, 
        messageId: response.data.request_id, 
        providerResponse: response.data 
      };
    } else {
      return { 
        success: false, 
        providerResponse: response.data || { error: 'Unknown response from Fast2SMS' } 
      };
    }
  } catch (err) {
    const providerResponse = err.response?.data ?? { error: err.message };
    console.error('[Fast2SMS] Send failed:', JSON.stringify(providerResponse));
    return { success: false, providerResponse };
  }
}

/**
 * Normalise phone numbers for Fast2SMS (expects 10 digits for Indian numbers, comma separated).
 */
function normalisePhone(phone) {
  // Split by comma if multiple, clean each, join back
  return String(phone)
    .split(',')
    .map(p => p.replace(/[\s\-().+]/g, '').slice(-10))
    .join(',');
}

module.exports = { sendSMS };
