import { Router } from 'express';
import { sendMetaEvent } from '../meta.js';

/**
 * Receives the browser's copy of an event and mirrors it to the Conversions
 * API with the same event_id, so Meta deduplicates the pair.
 */
export const metaRoutes = Router();

// Only the events the site actually fires. An open endpoint would let anyone
// inject conversions into the ad account and distort campaign optimisation.
const ALLOWED_EVENTS = new Set([
  'PageView',
  'ViewContent',
  'Lead',
  'CompleteRegistration',
  'Contact',
  'Search',
  'SubmitApplication',
]);

const clean = (value, max = 300) =>
  typeof value === 'string' ? value.trim().slice(0, max) : undefined;

metaRoutes.post('/event', async (req, res) => {
  const body = req.body ?? {};
  const eventName = clean(body.eventName, 60);

  if (!eventName || !ALLOWED_EVENTS.has(eventName)) {
    return res.status(400).json({ error: 'unknown event' });
  }

  const eventId = clean(body.eventId, 100);
  if (!eventId) {
    // Without an event ID the server copy cannot be deduplicated against the
    // browser copy, and the conversion would be double-counted.
    return res.status(400).json({ error: 'missing eventId' });
  }

  // Answer immediately: the visitor's page should never wait on Meta.
  res.json({ ok: true });

  const custom = body.customData ?? {};
  const user = body.userData ?? {};

  await sendMetaEvent({
    eventName,
    eventId,
    eventSourceUrl: clean(body.eventSourceUrl, 500),
    userData: {
      email: clean(user.email, 200),
      phone: clean(user.phone, 60),
      firstName: clean(user.firstName, 100),
      lastName: clean(user.lastName, 100),
    },
    customData: {
      content_name: clean(custom.content_name, 200),
      content_category: clean(custom.content_category, 200),
      content_type: clean(custom.content_type, 60),
      value: typeof custom.value === 'number' ? custom.value : undefined,
      currency: clean(custom.currency, 10),
    },
    clientIp: req.ip,
    clientUserAgent: req.get('user-agent'),
    fbp: req.cookies?._fbp,
    fbc: req.cookies?._fbc,
  }).catch((error) => console.error('[meta] mirror failed:', error.message));
});
