import crypto from 'node:crypto';

/**
 * Meta Conversions API.
 *
 * Sends the server-side copy of each event. Together with the browser Pixel
 * copy — which carries the same `event_id` — Meta deduplicates the pair into
 * one event. That pairing is what makes server-side tracking safe to add:
 * without it, every conversion would be counted twice.
 *
 * The server copy matters because the browser copy is lossy. Ad blockers,
 * Safari's tracking prevention and iOS privacy settings drop a substantial
 * share of Pixel events, and those losses are invisible in Ads Manager — the
 * campaign simply optimises against incomplete data.
 */

const GRAPH_VERSION = 'v21.0';

/**
 * Meta requires personal identifiers to be SHA-256 hashed, lowercase and
 * trimmed, before they ever leave the server. Raw values are never sent, never
 * logged, and never stored alongside the event.
 */
const hash = (value) =>
  crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');

/** Phone numbers hash to a different digest per format, so normalise to digits. */
const hashPhone = (value) => {
  const digits = String(value).replace(/\D/g, '');
  return digits ? crypto.createHash('sha256').update(digits).digest('hex') : undefined;
};

function buildUserData({ email, phone, firstName, lastName, clientIp, clientUserAgent, fbp, fbc }) {
  const data = {};
  if (email) data.em = [hash(email)];
  if (phone) {
    const hashed = hashPhone(phone);
    if (hashed) data.ph = [hashed];
  }
  if (firstName) data.fn = [hash(firstName)];
  if (lastName) data.ln = [hash(lastName)];

  // These two are not hashed — Meta expects them raw, and they are what lets
  // it match a server event back to a browser session.
  if (clientIp) data.client_ip_address = clientIp;
  if (clientUserAgent) data.client_user_agent = clientUserAgent;
  if (fbp) data.fbp = fbp;
  if (fbc) data.fbc = fbc;

  return data;
}

/**
 * Sends one event. Resolves either way: a tracking failure must never break
 * the request that triggered it.
 */
export async function sendMetaEvent({
  eventName,
  eventId,
  eventSourceUrl,
  userData = {},
  customData = {},
  clientIp,
  clientUserAgent,
  fbp,
  fbc,
  testEventCode,
}) {
  const pixelId = process.env.META_PIXEL_ID;
  const accessToken = process.env.META_CAPI_TOKEN;

  // Not configured is a normal state (local development, staging), not an error.
  if (!pixelId || !accessToken) return { skipped: true };

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: eventSourceUrl,
        action_source: 'website',
        user_data: buildUserData({ ...userData, clientIp, clientUserAgent, fbp, fbc }),
        custom_data: Object.fromEntries(
          Object.entries(customData).filter(([, value]) => value !== undefined && value !== '')
        ),
      },
    ],
  };

  // Set META_TEST_EVENT_CODE while verifying the integration; events then show
  // up under Test Events in Events Manager instead of in live reporting.
  const code = testEventCode ?? process.env.META_TEST_EVENT_CODE;
  if (code) payload.test_event_code = code;

  const url = `https://graph.facebook.com/${GRAPH_VERSION}/${pixelId}/events?access_token=${encodeURIComponent(accessToken)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      // The access token can appear in the URL but never in a log line.
      console.error(`[meta] ${eventName} rejected (${response.status}): ${detail.slice(0, 300)}`);
      return { ok: false };
    }
    return { ok: true };
  } catch (error) {
    console.error(`[meta] ${eventName} failed: ${error.message}`);
    return { ok: false };
  } finally {
    clearTimeout(timeout);
  }
}
