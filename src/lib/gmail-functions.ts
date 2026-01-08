// Gmail Integration using Firebase Functions (server-side OAuth)
// This allows everyone to access YOUR Gmail account without logging in

import { initializeApp } from 'firebase/app';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { GmailFolder, EmailAttachment } from './gmail';

// Initialize Firebase (same config as in firebase.ts)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig, 'gmail-functions');
const functions = getFunctions(app);

// No authentication needed - Firebase Functions handle it server-side
export const isGmailConnected = (): boolean => {
  return true; // Always connected since we use your account
};

export const connectGmail = async (): Promise<void> => {
  // No-op: Already connected via server-side
  return Promise.resolve();
};

export const disconnectGmail = (): void => {
  // No-op: Can't disconnect from server-side
};

export const initGmailAuth = async (): Promise<void> => {
  // No-op: No client-side auth needed
  return Promise.resolve();
};

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

// Helper to parse Gmail message
const parseGmailMessage = (msg: any): ParsedEmail => {
  const headers = msg.payload?.headers || [];

  const getHeader = (name: string): string => {
    const header = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
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
    const textPart = msg.payload.parts.find((p: any) => p.mimeType === 'text/plain');
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

const extractAttachments = (parts: any[] | undefined): EmailAttachment[] => {
  const attachments: EmailAttachment[] = [];

  if (!parts) return attachments;

  for (const part of parts) {
    if (part.filename && part.filename.length > 0 && part.body?.attachmentId) {
      attachments.push({
        id: part.body.attachmentId,
        filename: part.filename,
        mimeType: part.mimeType,
        size: part.body.size || 0,
      });
    }

    if (part.parts) {
      attachments.push(...extractAttachments(part.parts));
    }
  }

  return attachments;
};

export const fetchGmailMessages = async (
  maxResults: number = 20,
  folder: GmailFolder = 'INBOX'
): Promise<ParsedEmail[]> => {
  const getMessages = httpsCallable(functions, 'getGmailMessages');
  const result = await getMessages({ maxResults, folder });
  const data = result.data as any;

  if (!data.success) {
    throw new Error('Failed to fetch messages');
  }

  return data.messages.map(parseGmailMessage);
};

export const deleteGmailMessage = async (messageId: string): Promise<void> => {
  const deleteMessage = httpsCallable(functions, 'deleteGmailMessage');
  await deleteMessage({ messageId });
};

export const permanentlyDeleteGmailMessage = async (messageId: string): Promise<void> => {
  const permanentlyDelete = httpsCallable(functions, 'permanentlyDeleteGmailMessage');
  await permanentlyDelete({ messageId });
};

export const toggleGmailStar = async (messageId: string, isCurrentlyStarred: boolean): Promise<void> => {
  const toggleStar = httpsCallable(functions, 'toggleGmailStar');
  await toggleStar({ messageId, isCurrentlyStarred });
};

export const fetchGmailAttachment = async (
  messageId: string,
  attachmentId: string
): Promise<string> => {
  const getAttachment = httpsCallable(functions, 'getGmailAttachment');
  const result = await getAttachment({ messageId, attachmentId });
  const data = result.data as any;

  if (!data.success) {
    throw new Error('Failed to fetch attachment');
  }

  return data.data;
};

export const getGmailAttachmentPreview = async (
  messageId: string,
  attachment: EmailAttachment
): Promise<string> => {
  const base64Data = await fetchGmailAttachment(messageId, attachment.id);
  const standardBase64 = base64Data.replace(/-/g, '+').replace(/_/g, '/');
  return `data:${attachment.mimeType};base64,${standardBase64}`;
};

export const downloadGmailAttachment = async (
  messageId: string,
  attachment: EmailAttachment
): Promise<void> => {
  const base64Data = await fetchGmailAttachment(messageId, attachment.id);
  const standardBase64 = base64Data.replace(/-/g, '+').replace(/_/g, '/');

  const binaryString = atob(standardBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: attachment.mimeType });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = attachment.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Create RFC 2822 formatted email
const createRawEmail = (params: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  inReplyTo?: string;
  threadId?: string;
  attachments?: { filename: string; content: string; mimeType: string }[];
}): string => {
  const boundary = 'boundary_' + Date.now().toString(36);
  const hasAttachments = params.attachments && params.attachments.length > 0;

  let email = '';
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
    email += `--${boundary}\r\n`;
    email += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    email += `${params.body}\r\n\r\n`;

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

export const sendGmailMessage = async (params: {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  inReplyTo?: string;
  threadId?: string;
  attachments?: { filename: string; content: string; mimeType: string }[];
}): Promise<string> => {
  const rawEmail = createRawEmail(params);
  const encodedEmail = btoa(unescape(encodeURIComponent(rawEmail)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const sendMessage = httpsCallable(functions, 'sendGmailMessage');
  const result = await sendMessage({ rawMessage: encodedEmail });
  const data = result.data as any;

  if (!data.success) {
    throw new Error('Failed to send message');
  }

  return data.messageId;
};

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
    threadId: originalEmail.id.split('-')[0],
    attachments,
  });
};

export const getGmailProfile = async (): Promise<{ email: string; name?: string }> => {
  // Since we're using your account server-side, return your email
  return { email: 'your-email@gmail.com' }; // You'll need to update this
};
