import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { google } from 'googleapis';

admin.initializeApp();

// Store your Google OAuth credentials in Firebase Functions config
// Run: firebase functions:config:set google.client_id="YOUR_CLIENT_ID" google.client_secret="YOUR_CLIENT_SECRET" google.refresh_token="YOUR_REFRESH_TOKEN"

const GOOGLE_CLIENT_ID = functions.config().google?.client_id;
const GOOGLE_CLIENT_SECRET = functions.config().google?.client_secret;
const GOOGLE_REFRESH_TOKEN = functions.config().google?.refresh_token;

// Create OAuth2 client
const getOAuth2Client = () => {
  const oauth2Client = new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'https://svbruvik.no' // Your redirect URI
  );

  oauth2Client.setCredentials({
    refresh_token: GOOGLE_REFRESH_TOKEN,
  });

  return oauth2Client;
};

// Gmail API proxy functions
export const getGmailMessages = functions.https.onCall(async (data, context) => {
  try {
    const { maxResults = 20, folder = 'INBOX' } = data;

    const oauth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // List messages
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      labelIds: [folder],
    });

    const messages = response.data.messages || [];

    // Fetch full details for each message
    const fullMessages = await Promise.all(
      messages.map(async (msg) => {
        const msgDetail = await gmail.users.messages.get({
          userId: 'me',
          id: msg.id!,
          format: 'full',
        });
        return msgDetail.data;
      })
    );

    return { success: true, messages: fullMessages };
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch messages');
  }
});

export const deleteGmailMessage = functions.https.onCall(async (data, context) => {
  try {
    const { messageId } = data;

    const oauth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    await gmail.users.messages.trash({
      userId: 'me',
      id: messageId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting Gmail message:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete message');
  }
});

export const permanentlyDeleteGmailMessage = functions.https.onCall(async (data, context) => {
  try {
    const { messageId } = data;

    const oauth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    await gmail.users.messages.delete({
      userId: 'me',
      id: messageId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error permanently deleting Gmail message:', error);
    throw new functions.https.HttpsError('internal', 'Failed to permanently delete message');
  }
});

export const sendGmailMessage = functions.https.onCall(async (data, context) => {
  try {
    const { rawMessage } = data;

    const oauth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: rawMessage,
      },
    });

    return { success: true, messageId: response.data.id };
  } catch (error) {
    console.error('Error sending Gmail message:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send message');
  }
});

export const toggleGmailStar = functions.https.onCall(async (data, context) => {
  try {
    const { messageId, isCurrentlyStarred } = data;

    const oauth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: isCurrentlyStarred ? [] : ['STARRED'],
        removeLabelIds: isCurrentlyStarred ? ['STARRED'] : [],
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error toggling Gmail star:', error);
    throw new functions.https.HttpsError('internal', 'Failed to toggle star');
  }
});

export const getGmailAttachment = functions.https.onCall(async (data, context) => {
  try {
    const { messageId, attachmentId } = data;

    const oauth2Client = getOAuth2Client();
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const response = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: attachmentId,
    });

    return { success: true, data: response.data.data };
  } catch (error) {
    console.error('Error fetching Gmail attachment:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch attachment');
  }
});

// Google Calendar API proxy functions
export const getCalendarEvents = functions.https.onCall(async (data, context) => {
  try {
    const { timeMin, timeMax, maxResults = 100 } = data;

    const oauth2Client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return { success: true, events: response.data.items };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    throw new functions.https.HttpsError('internal', 'Failed to fetch calendar events');
  }
});

export const createCalendarEvent = functions.https.onCall(async (data, context) => {
  try {
    const { event } = data;

    const oauth2Client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });

    return { success: true, event: response.data };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create calendar event');
  }
});

export const updateCalendarEvent = functions.https.onCall(async (data, context) => {
  try {
    const { eventId, event } = data;

    const oauth2Client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId,
      requestBody: event,
    });

    return { success: true, event: response.data };
  } catch (error) {
    console.error('Error updating calendar event:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update calendar event');
  }
});

export const deleteCalendarEvent = functions.https.onCall(async (data, context) => {
  try {
    const { eventId } = data;

    const oauth2Client = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete calendar event');
  }
});
