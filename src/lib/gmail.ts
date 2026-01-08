// Gmail OAuth Integration using Google Identity Services
// Requires: VITE_GOOGLE_CLIENT_ID in .env

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// Include modify and send scopes for full functionality
const GMAIL_SCOPES = 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send';

interface TokenResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

interface GmailMessagePart {
  partId?: string;
  mimeType: string;
  filename?: string;
  body: {
    attachmentId?: string;
    size?: number;
    data?: string;
  };
  parts?: GmailMessagePart[];
}

interface GmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload?: {
    headers: { name: string; value: string }[];
    parts?: GmailMessagePart[];
    body?: { data: string };
    mimeType?: string;
  };
  internalDate: string;
  labelIds: string[];
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
}

interface ParsedEmail {
  id: string;
  from: string;
  fromEmail: string;
  to: string;
  subject: string;
  preview: string;
  body: string;
  date: Date;
  isRead: boolean;
  isStarred: boolean;
  provider: 'gmail';
  labels: string[];
  hasAttachment: boolean;
  attachments: EmailAttachment[];
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
export const initGmailAuth = async (): Promise<void> => {
  if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID === 'your_google_client_id.apps.googleusercontent.com') {
    throw new Error('Google Client ID not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file.');
  }

  await loadGoogleScript();

  return new Promise((resolve) => {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: GMAIL_SCOPES,
      callback: () => {
        resolve();
      },
    });
    resolve();
  });
};

// Request access token (triggers OAuth popup)
export const connectGmail = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Gmail auth not initialized. Call initGmailAuth first.'));
      return;
    }

    tokenClient.callback = (response: TokenResponse) => {
      if (response.access_token) {
        accessToken = response.access_token;
        // Store token expiry
        const expiryTime = Date.now() + response.expires_in * 1000;
        localStorage.setItem('gmail_token', response.access_token);
        localStorage.setItem('gmail_token_expiry', expiryTime.toString());
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
  const token = localStorage.getItem('gmail_token');
  const expiry = localStorage.getItem('gmail_token_expiry');

  if (token && expiry) {
    const expiryTime = parseInt(expiry, 10);
    if (Date.now() < expiryTime) {
      accessToken = token;
      return token;
    }
  }

  return null;
};

// Disconnect Gmail
export const disconnectGmail = (): void => {
  if (accessToken) {
    google.accounts.oauth2.revoke(accessToken, () => {
      console.log('Gmail access revoked');
    });
  }
  accessToken = null;
  localStorage.removeItem('gmail_token');
  localStorage.removeItem('gmail_token_expiry');
};

// Check if Gmail is connected
export const isGmailConnected = (): boolean => {
  return getStoredToken() !== null;
};

// Gmail label IDs
export type GmailFolder = 'INBOX' | 'SENT' | 'SPAM' | 'TRASH';

// Fetch emails from Gmail API with optional folder filter
export const fetchGmailMessages = async (
  maxResults: number = 20,
  folder: GmailFolder = 'INBOX'
): Promise<ParsedEmail[]> => {
  const token = accessToken || getStoredToken();

  if (!token) {
    throw new Error('Not authenticated. Please connect Gmail first.');
  }

  try {
    // Fetch message list with folder filter
    const params = new URLSearchParams({
      maxResults: maxResults.toString(),
      labelIds: folder,
    });

    const listResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!listResponse.ok) {
      if (listResponse.status === 401) {
        disconnectGmail();
        throw new Error('Session expired. Please reconnect Gmail.');
      }
      throw new Error('Failed to fetch messages');
    }

    const listData = await listResponse.json();
    const messages: GmailMessage[] = listData.messages || [];

    // Fetch full details for each message
    const emailPromises = messages.map(async (msg) => {
      const msgResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return msgResponse.json();
    });

    const fullMessages = await Promise.all(emailPromises);

    // Parse messages into our format
    return fullMessages.map((msg: GmailMessage) => parseGmailMessage(msg));
  } catch (error) {
    console.error('Error fetching Gmail messages:', error);
    throw error;
  }
};

// Helper to recursively extract attachments from message parts
const extractAttachments = (parts: GmailMessagePart[] | undefined): EmailAttachment[] => {
  const attachments: EmailAttachment[] = [];

  if (!parts) return attachments;

  for (const part of parts) {
    // Check if this part is an attachment
    if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
      attachments.push({
        id: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size || 0,
      });
    }

    // Recursively check nested parts
    if (part.parts) {
      attachments.push(...extractAttachments(part.parts));
    }
  }

  return attachments;
};

// Parse Gmail message into our Email format
const parseGmailMessage = (msg: GmailMessage): ParsedEmail => {
  const headers = msg.payload?.headers || [];

  const getHeader = (name: string): string => {
    const header = headers.find((h) => h.name.toLowerCase() === name.toLowerCase());
    return header?.value || '';
  };

  const fromHeader = getHeader('From');
  const fromMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/) || [null, fromHeader, fromHeader];
  const fromName = fromMatch[1]?.replace(/"/g, '').trim() || 'Unknown';
  const fromEmail = fromMatch[2] || fromHeader;

  // Decode body
  let body = msg.snippet || '';
  if (msg.payload?.body?.data) {
    try {
      body = atob(msg.payload.body.data.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      body = msg.snippet || '';
    }
  } else if (msg.payload?.parts) {
    const textPart = msg.payload.parts.find((p) => p.mimeType === 'text/plain');
    if (textPart?.body?.data) {
      try {
        body = atob(textPart.body.data.replace(/-/g, '+').replace(/_/g, '/'));
      } catch {
        body = msg.snippet || '';
      }
    }
  }

  // Extract attachments
  const attachments = extractAttachments(msg.payload?.parts);
  const hasAttachment = attachments.length > 0;

  return {
    id: msg.id,
    from: fromName,
    fromEmail: fromEmail,
    to: getHeader('To'),
    subject: getHeader('Subject') || '(No Subject)',
    preview: msg.snippet || '',
    body: body,
    date: new Date(parseInt(msg.internalDate, 10)),
    isRead: !msg.labelIds?.includes('UNREAD'),
    isStarred: msg.labelIds?.includes('STARRED') || false,
    provider: 'gmail',
    labels: msg.labelIds || [],
    hasAttachment,
    attachments,
  };
};

// Delete email (move to trash)
export const deleteGmailMessage = async (messageId: string): Promise<void> => {
  const token = accessToken || getStoredToken();

  if (!token) {
    throw new Error('Not authenticated. Please connect Gmail first.');
  }

  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/trash`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        disconnectGmail();
        throw new Error('Session expired. Please reconnect Gmail.');
      }
      throw new Error('Failed to delete message');
    }
  } catch (error) {
    console.error('Error deleting Gmail message:', error);
    throw error;
  }
};

// Permanently delete email (skip trash)
export const permanentlyDeleteGmailMessage = async (messageId: string): Promise<void> => {
  const token = accessToken || getStoredToken();

  if (!token) {
    throw new Error('Not authenticated. Please connect Gmail first.');
  }

  try {
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/batchDelete',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: [messageId] }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        disconnectGmail();
        throw new Error('Session expired. Please reconnect Gmail.');
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to permanently delete message');
    }
  } catch (error) {
    console.error('Error permanently deleting Gmail message:', error);
    throw error;
  }
};

// Interface for sending emails
interface SendEmailParams {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  inReplyTo?: string;
  threadId?: string;
  attachments?: { filename: string; content: string; mimeType: string }[];
}

// Create RFC 2822 formatted email
const createRawEmail = (params: SendEmailParams): string => {
  const boundary = 'boundary_' + Date.now().toString(36);
  const hasAttachments = params.attachments && params.attachments.length > 0;

  let email = '';

  // Headers
  email += `To: ${params.to}\r\n`;
  if (params.cc) email += `Cc: ${params.cc}\r\n`;
  if (params.bcc) email += `Bcc: ${params.bcc}\r\n`;
  email += `Subject: ${params.subject}\r\n`;
  if (params.inReplyTo) {
    email += `In-Reply-To: ${params.inReplyTo}\r\n`;
    email += `References: ${params.inReplyTo}\r\n`;
  }

  if (hasAttachments) {
    email += `Content-Type: multipart/mixed; boundary="${boundary}"\r\n`;
    email += `MIME-Version: 1.0\r\n\r\n`;

    // Body part
    email += `--${boundary}\r\n`;
    email += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    email += `${params.body}\r\n\r\n`;

    // Attachment parts
    for (const attachment of params.attachments!) {
      email += `--${boundary}\r\n`;
      email += `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"\r\n`;
      email += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
      email += `Content-Transfer-Encoding: base64\r\n\r\n`;
      email += `${attachment.content}\r\n\r\n`;
    }

    email += `--${boundary}--`;
  } else {
    email += `Content-Type: text/plain; charset="UTF-8"\r\n`;
    email += `MIME-Version: 1.0\r\n\r\n`;
    email += params.body;
  }

  return email;
};

// Send a new email
export const sendGmailMessage = async (params: SendEmailParams): Promise<string> => {
  const token = accessToken || getStoredToken();

  if (!token) {
    throw new Error('Not authenticated. Please connect Gmail first.');
  }

  const rawEmail = createRawEmail(params);
  // Base64 URL encode the email
  const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  try {
    const body: { raw: string; threadId?: string } = { raw: encodedEmail };
    if (params.threadId) {
      body.threadId = params.threadId;
    }

    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        disconnectGmail();
        throw new Error('Session expired. Please reconnect Gmail.');
      }
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Failed to send message');
    }

    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('Error sending Gmail message:', error);
    throw error;
  }
};

// Reply to an email
export const replyToGmailMessage = async (
  originalEmail: ParsedEmail,
  replyBody: string,
  attachments?: { filename: string; content: string; mimeType: string }[]
): Promise<string> => {
  const subject = originalEmail.subject.startsWith('Re:')
    ? originalEmail.subject
    : `Re: ${originalEmail.subject}`;

  return sendGmailMessage({
    to: originalEmail.fromEmail,
    subject,
    body: replyBody,
    inReplyTo: originalEmail.id,
    threadId: originalEmail.id.split('-')[0], // Thread ID is part of message ID
    attachments,
  });
};

// Fetch attachment data from Gmail
export const fetchGmailAttachment = async (
  messageId: string,
  attachmentId: string
): Promise<string> => {
  const token = accessToken || getStoredToken();

  if (!token) {
    throw new Error('Not authenticated. Please connect Gmail first.');
  }

  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/attachments/${attachmentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        disconnectGmail();
        throw new Error('Session expired. Please reconnect Gmail.');
      }
      throw new Error('Failed to fetch attachment');
    }

    const data = await response.json();
    return data.data; // Base64 URL encoded data
  } catch (error) {
    console.error('Error fetching Gmail attachment:', error);
    throw error;
  }
};

// Download attachment as a file
// Get attachment data for preview (returns base64 data URL)
export const getGmailAttachmentPreview = async (
  messageId: string,
  attachment: EmailAttachment
): Promise<string> => {
  try {
    const base64Data = await fetchGmailAttachment(messageId, attachment.id);

    // Convert base64 URL encoding to standard base64
    const standardBase64 = base64Data.replace(/-/g, '+').replace(/_/g, '/');

    // Return as data URL for preview
    return `data:${attachment.mimeType};base64,${standardBase64}`;
  } catch (error) {
    console.error('Error getting attachment preview:', error);
    throw error;
  }
};

export const downloadGmailAttachment = async (
  messageId: string,
  attachment: EmailAttachment
): Promise<void> => {
  try {
    const base64Data = await fetchGmailAttachment(messageId, attachment.id);

    // Convert base64 URL encoding to standard base64
    const standardBase64 = base64Data.replace(/-/g, '+').replace(/_/g, '/');

    // Convert base64 to binary
    const binaryString = atob(standardBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create blob and download
    const blob = new Blob([bytes], { type: attachment.mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = attachment.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    throw error;
  }
};

// Toggle star on an email
export const toggleGmailStar = async (messageId: string, isCurrentlyStarred: boolean): Promise<void> => {
  const token = accessToken || getStoredToken();

  if (!token) {
    throw new Error('Not authenticated. Please connect Gmail first.');
  }

  try {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          addLabelIds: isCurrentlyStarred ? [] : ['STARRED'],
          removeLabelIds: isCurrentlyStarred ? ['STARRED'] : [],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 401) {
        disconnectGmail();
        throw new Error('Session expired. Please reconnect Gmail.');
      }
      throw new Error('Failed to toggle star');
    }
  } catch (error) {
    console.error('Error toggling Gmail star:', error);
    throw error;
  }
};

// Get user's email address (for "from" display)
export const getGmailProfile = async (): Promise<{ email: string; name?: string }> => {
  const token = accessToken || getStoredToken();

  if (!token) {
    throw new Error('Not authenticated.');
  }

  try {
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get profile');
    }

    const data = await response.json();
    return { email: data.emailAddress };
  } catch (error) {
    console.error('Error getting Gmail profile:', error);
    throw error;
  }
};

// Type declarations for Google Identity Services
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
