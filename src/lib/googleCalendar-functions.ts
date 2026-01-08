// Google Calendar Integration using Firebase Functions (server-side OAuth)
// This allows everyone to access YOUR Google Calendar without logging in

import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

export interface ParsedCalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  attendees?: string[];
}

// No authentication needed - Firebase Functions handle it server-side
export const isGoogleCalendarConnected = (): boolean => {
  return true; // Always connected since we use your account
};

export const connectGoogleCalendar = async (): Promise<void> => {
  // No-op: Already connected via server-side
  return Promise.resolve();
};

export const disconnectGoogleCalendar = (): void => {
  // No-op: Can't disconnect from server-side
};

export const initGoogleCalendarAuth = async (): Promise<void> => {
  // No-op: No client-side auth needed
  return Promise.resolve();
};

// Parse Google Calendar event
const parseCalendarEvent = (event: any): ParsedCalendarEvent => {
  const start = event.start?.dateTime
    ? new Date(event.start.dateTime)
    : new Date(event.start.date);
  const end = event.end?.dateTime
    ? new Date(event.end.dateTime)
    : new Date(event.end.date);

  return {
    id: event.id,
    title: event.summary || '(No title)',
    description: event.description,
    start,
    end,
    allDay: !event.start?.dateTime,
    location: event.location,
    attendees: event.attendees?.map((a: any) => a.email) || [],
  };
};

export const fetchGoogleCalendarEvents = async (
  timeMin?: Date,
  timeMax?: Date
): Promise<ParsedCalendarEvent[]> => {
  const getEvents = httpsCallable(functions, 'getCalendarEvents');

  const result = await getEvents({
    timeMin: timeMin?.toISOString(),
    timeMax: timeMax?.toISOString(),
  });

  const data = result.data as any;

  if (!data.success) {
    throw new Error('Failed to fetch calendar events');
  }

  return (data.events || []).map(parseCalendarEvent);
};

export const createGoogleCalendarEvent = async (event: {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  location?: string;
  attendees?: string[];
}): Promise<ParsedCalendarEvent> => {
  const createEvent = httpsCallable(functions, 'createCalendarEvent');

  const googleEvent = {
    summary: event.title,
    description: event.description,
    location: event.location,
    start: event.allDay
      ? { date: event.start.toISOString().split('T')[0] }
      : { dateTime: event.start.toISOString() },
    end: event.allDay
      ? { date: event.end.toISOString().split('T')[0] }
      : { dateTime: event.end.toISOString() },
    attendees: event.attendees?.map(email => ({ email })),
  };

  const result = await createEvent({ event: googleEvent });
  const data = result.data as any;

  if (!data.success) {
    throw new Error('Failed to create calendar event');
  }

  return parseCalendarEvent(data.event);
};

export const updateGoogleCalendarEvent = async (
  eventId: string,
  event: {
    title?: string;
    description?: string;
    start?: Date;
    end?: Date;
    allDay?: boolean;
    location?: string;
    attendees?: string[];
  }
): Promise<ParsedCalendarEvent> => {
  const updateEvent = httpsCallable(functions, 'updateCalendarEvent');

  const googleEvent: any = {};
  if (event.title !== undefined) googleEvent.summary = event.title;
  if (event.description !== undefined) googleEvent.description = event.description;
  if (event.location !== undefined) googleEvent.location = event.location;

  if (event.start !== undefined) {
    googleEvent.start = event.allDay
      ? { date: event.start.toISOString().split('T')[0] }
      : { dateTime: event.start.toISOString() };
  }

  if (event.end !== undefined) {
    googleEvent.end = event.allDay
      ? { date: event.end.toISOString().split('T')[0] }
      : { dateTime: event.end.toISOString() };
  }

  if (event.attendees !== undefined) {
    googleEvent.attendees = event.attendees.map(email => ({ email }));
  }

  const result = await updateEvent({ eventId, event: googleEvent });
  const data = result.data as any;

  if (!data.success) {
    throw new Error('Failed to update calendar event');
  }

  return parseCalendarEvent(data.event);
};

export const deleteGoogleCalendarEvent = async (eventId: string): Promise<void> => {
  const deleteEvent = httpsCallable(functions, 'deleteCalendarEvent');
  await deleteEvent({ eventId });
};
