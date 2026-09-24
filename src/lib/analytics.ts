/**
 * Meta event tracking, browser side.
 *
 * Every event is sent twice on purpose: once through the Pixel in the browser
 * and once through the Conversions API on the server. Both copies carry the
 * same `eventID`, which is how Meta recognises them as one event rather than
 * two. Without that ID, server-side tracking doubles every conversion number.
 *
 * The server copy exists because the browser copy is unreliable — ad blockers,
 * Safari's ITP and iOS privacy settings drop a meaningful share of it. The
 * server copy is not blockable, so conversions keep reaching Meta and campaigns
 * keep optimising.
 */

export type MetaEvent =
  | 'PageView'
  | 'ViewContent'
  | 'Lead'
  | 'CompleteRegistration'
  | 'Contact'
  | 'Search'
  | 'SubmitApplication';

export interface EventPayload {
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
  [key: string]: unknown;
}

/**
 * Personal details used for Meta's advanced matching. They are hashed on the
 * server before being sent — never hashed here, and never logged.
 */
export interface UserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    __META_PIXEL_ID?: string;
    __API_BASE?: string;
  }
}

function newEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Fires one event to the Pixel and mirrors it to the Conversions API.
 * Returns the event ID, mostly so tests can assert the two copies match.
 *
 * Never throws and never rejects: analytics must not be able to break a form
 * submission or a page.
 */
export function trackEvent(
  name: MetaEvent,
  payload: EventPayload = {},
  userData?: UserData
): string {
  const eventId = newEventId();

  try {
    window.fbq?.('track', name, payload, { eventID: eventId });
  } catch {
    /* pixel blocked or not loaded — the server copy still goes */
  }

  const apiBase = window.__API_BASE;
  if (apiBase) {
    try {
      void fetch(`${apiBase}/api/meta/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        keepalive: true,
        body: JSON.stringify({
          eventName: name,
          eventId,
          eventSourceUrl: typeof location !== 'undefined' ? location.href : undefined,
          customData: payload,
          userData,
        }),
      }).catch(() => {});
    } catch {
      /* ignore */
    }
  }

  return eventId;
}

/** Course page view. Called on load from the course layout. */
export function trackCourseView(courseName: string, category: string, price?: number): string {
  return trackEvent('ViewContent', {
    content_name: courseName,
    content_category: category,
    content_type: 'product',
    ...(price !== undefined ? { value: price, currency: 'GEL' } : {}),
  });
}

/** A completed enquiry or enrollment form. The main conversion. */
export function trackLead(
  formName: string,
  user: UserData,
  extra: EventPayload = {}
): string {
  return trackEvent('Lead', { content_name: formName, ...extra }, user);
}
