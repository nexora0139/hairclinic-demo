// netlify/functions/capi-lead.js
const crypto = require('crypto');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const body = JSON.parse(event.body);

    const hashData = (value) => {
      if (!value) return undefined;
      return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
    };

    const PIXEL_ID = process.env.META_PIXEL_ID;
    const ACCESS_TOKEN = process.env.META_CAPI_TOKEN;

    const payload = {
      data: [
        {
          event_name: 'Lead',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'website',
          event_source_url: body.pageUrl || '',
          user_data: {
            client_user_agent: event.headers['user-agent'] || '',
            client_ip_address: event.headers['x-forwarded-for'] || event.headers['client-ip'] || '',
            ph: body.phone ? [hashData(body.phone)] : undefined,
          },
        },
      ],
    };

    const url = `https://graph.facebook.com/v19.0/${PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, result }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};