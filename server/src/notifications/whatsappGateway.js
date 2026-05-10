'use strict';

const axios = require('axios');

const WHATSAPP_API_URL = process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0';
const PHONE_NUMBER_ID  = process.env.WHATSAPP_PHONE_NUMBER_ID;
const ACCESS_TOKEN     = process.env.WHATSAPP_ACCESS_TOKEN;

/**
 * Send a plain-text WhatsApp message via Meta WhatsApp Cloud API.
 *
 * @param {string} phoneNumber  E.164 format (e.g. "+919876543210") or local format
 * @param {string} message      Plain text body
 * @returns {Promise<{success:boolean, messageId?:string, providerResponse:object}>}
 */
async function sendWhatsApp(phoneNumber, message) {
  if (!PHONE_NUMBER_ID || !ACCESS_TOKEN) {
    console.warn('[WhatsApp] WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set — message not sent.');
    return {
      success: false,
      providerResponse: { error: 'WhatsApp credentials not configured' },
    };
  }

  // Normalise phone — strip spaces/dashes, ensure country code prefix
  const to = normalisePhone(phoneNumber);

  try {
    const response = await axios.post(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body: message },
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      }
    );

    const messageId = response.data?.messages?.[0]?.id;
    return { success: true, messageId, providerResponse: response.data };
  } catch (err) {
    const providerResponse = err.response?.data ?? { error: err.message };
    console.error('[WhatsApp] Send failed:', JSON.stringify(providerResponse));
    return { success: false, providerResponse };
  }
}

/**
 * Normalise Indian phone numbers to E.164 (+91XXXXXXXXXX).
 * Adjust the country code / logic to match your school's locale.
 */
function normalisePhone(phone) {
  let p = String(phone).replace(/[\s\-().]/g, '');
  if (!p.startsWith('+')) {
    // Assume India (+91) if no country code
    p = p.startsWith('91') ? `+${p}` : `+91${p.slice(-10)}`;
  }
  return p;
}

module.exports = { sendWhatsApp };
