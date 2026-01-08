// Google Calendar OAuth Integration using Google Identity Services
// Requires: VITE_GOOGLE_CLIENT_ID in .env

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// Full calendar access for read and write
const CALENDAR_SCOPES = 'https://www.googleapis.com/auth/calendar';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: { email: string; displayName?: string }[];
  status: string;
}

interface CalendarListEntry {
  id: string;
  summary: string;
  primary?: boolean;
  backgroundColor?: string;
}

export interface ParsedCalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color?: string;
  provider: 'google';
  location?: string;
  attendees?: string[];
}

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let accessToken: string | null = null;

// Load Google Identity Services script
export const loadGoogleScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
};

// Initialize the token client
export const initCalendarAuth = async (): Promise<void> => {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_client_id.apps.googleusercontent.com') {
    throw new Error('Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file.');
  }

  await loadGoogleScript();

  return new Promise((resolve) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: CALENDAR_SCOPES,
      callback: () => {
        resolve();
      },
    });
    resolve();
  });
};

// Request access token (triggers OAuth popup)
export const connectGoogleCalendar = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Calendar auth not initialized. Call initCalendarAuth first.'));
      return;
    }

    tokenClient.callback = (response: TokenResponse) => {
      if (response.access_token) {
        accessToken = response.access_token;
        // Store token expiry
        const expiryTime = Date.now() + response.expires_in * 1000;
        localStorage.setItem('gcal_token', response.access_token);
        localStorage.setItem('gcal_token_expiry', expiryTime.toString());
        resolve(response.access_token);
      } else {
        reject(new Error('Failed to get access token'));
      }
    };

    // Request access token
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

// Check if we have a valid stored token
export const getStoredToken = (): string | null => {
  const token = localStorage.getItem('gcal_token');
  const expiry = localStorage.getItem('gcal_token_expiry');

  if (token && expiry) {
    const expiryTime = parseInt(expiry, 10);
    if (Date.now() < expiryTime) {
      accessToken = token;
      return token;
    }
  }

  return null;
};

// Disconnect Google Calendar
export const disconnectGoogleCalendar = (): void => {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken, () => {
      console.log('Google Calendar access revoked');
    });
  }
  accessToken = null;
  localStorage.removeItem('gcal_token');
  localStorage.removeItem('gcal_token_expiry');
};

// Check if Google Calendar is connected
export const isGoogleCalendarConnected = (): boolean => {
  return getStoredToken() !== null;
};

// Fetch calendar list
export const fetchCalendarList = async (): Promise<CalendarListEntry[]> => {
  const token = accessToken || getStoredToken();

  if (!token) {
    throw new Error('Not authenticated. Please connect Google Calendar first.');
  }

  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        disconnectGoogleCalendar();
        throw new Error('Session expired. Please reconnect Google Calendar.');
      }
      throw new Error('Failed to fetch calendar list');
    }

    const data = await response.json();
    return data.items || [];
  } catch (error) {
    console.error('Error fetching calendar list:', error);
    throw error;
  }
};

// Fetch events from Google Calendar
export const fetchGoogleCalendarEvents = async (
  timeMin?: Date,
  timeMax?: Date,
  calendarId: string = 'primary'
): Promise<ParsedCalendarEvent[]> => {
  const token = accessToken || getStoredToken();

  if (!token) {
    throw new Error('Not authenticated. Please connect Google Calendar first.');
  }

  // Default to current month if not specified
  const now = new Date();
  const defaultTimeMin = new Date(now.getFullYear(), now.getMonth(), 1);
  const defaultTimeMax = new Date(now.getFullYear(), now.getMonth() + 2, 0);

  const params = new URLSearchParams({
    timeMin: (timeMin || defaultTimeMin).toISOString(),
    timeMax: (timeMax || defaultTimeMax).toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: '250',
  });

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        disconnectGoogleCalendar();
        throw new Error('Session expired. Please reconnect Google Calendar.');
      }
      throw new Error('Failed to fetch calendar events');
    }

    const data = await response.json();
    const events: GoogleCalendarEvent[] = data.items || [];

    return events.map((event) => parseGoogleCalendarEvent(event));
  } catch (error) {
    console.error('Error fetching Google Calendar events:', error);
    throw error;
  }
};

// Create event params interface
export interface CreateCalendarEventParams {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  calendarId?: string;
}

// Create a new event in Google Calendar
export const createGoogleCalendarEvent = async (
  params: CreateCalendarEventParams
): Promise<ParsedCalendarEvent> => {
  const token = accessToken || getStoredToken();

  if (!token) {
    throw new Error('Not authenticated. Please connect Google Calendar first.');
  }

  const calendarId = params.calendarId || 'primary';

  // Build the event body
  const eventBody: {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime?: string; date?: string; timeZone: string };
    end: { dateTime?: string; date?: string; timeZone: string };
  } = {
    summary: params.title,
    description: params.description,
    location: params.location,
    start: {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
  };

  if (params.allDay) {
    // All-day events use date strings (YYYY-MM-DD)
    eventBody.start.date = params.start.toISOString().split('T')[0];
    eventBody.end.date = params.end.toISOString().split('T')[0];
  } else {
    eventBody.start.dateTime = params.start.toISOString();
    eventBody.end.dateTime = params.end.toISOString();
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventBody),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        disconnectGoogleCalendar();
        throw new Error('Session expired. Please reconnect Google Calendar.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to create event');
    }

    const createdEvent: GoogleCalendarEvent = await response.json();
    return parseGoogleCalendarEvent(createdEvent);
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
  }
};

// Delete an event from Google Calendar
export const deleteGoogleCalendarEvent = async (
  eventId: string,
  calendarId: string = 'primary'
): Promise<void> => {
  const token = accessToken || getStoredToken();

  if (!token) {
    throw new Error('Not authenticated. Please connect Google Calendar first.');
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok && response.status !== 204) {
      if (response.status === 401) {
        disconnectGoogleCalendar();
        throw new Error('Session expired. Please reconnect Google Calendar.');
      }
      throw new Error('Failed to delete event');
    }
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    throw error;
  }
};

// Parse Google Calendar event into our format
const parseGoogleCalendarEvent = (event: GoogleCalendarEvent): ParsedCalendarEvent => {
  const isAllDay = !event.start.dateTime;

  let start: Date;
  let end: Date;

  if (isAllDay) {
    // All-day events use date strings (YYYY-MM-DD)
    start = new Date(event.start.date + 'T00:00:00');
    end = new Date(event.end.date + 'T00:00:00');
  } else {
    start = new Date(event.start.dateTime!);
    end = new Date(event.end.dateTime!);
  }

  return {
    id: event.id,
    title: event.summary || '(No Title)',
    description: event.description,
    start,
    end,
    allDay: isAllDay,
    provider: 'google',
    location: event.location,
    attendees: event.attendees?.map((a) => a.displayName || a.email),
  };
};

// Type declarations for Google Identity Services (if not already declared)
declare global {
  interface Window {
    google: typeof google;
  }

  namespace google.accounts.oauth2 {
    interface TokenClient {
      callback: (response: TokenResponse) => void;
      requestAccessToken: (config?: { prompt?: string }) => void;
    }

    function initTokenClient(config: {
      client_id: string;
      scope: string;
      callback: (response: TokenResponse) => void;
    }): TokenClient;

    function revoke(token: string, callback: () => void): void;
  }
}
