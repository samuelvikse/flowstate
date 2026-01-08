// Helper script to generate Google OAuth refresh token
// Run: node scripts/get-refresh-token.js

const { google } = require('googleapis');
const readline = require('readline');

// Load your Google OAuth credentials from .env
require('dotenv').config();

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'YOUR_CLIENT_SECRET_HERE';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/calendar',
];

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

// Generate authentication URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // Force to get refresh token
});

console.log('\n=== Google OAuth Refresh Token Generator ===\n');
console.log('Step 1: Open this URL in your browser:');
console.log('\n' + authUrl + '\n');
console.log('Step 2: After authorizing, you will be redirected to a URL.');
console.log('Copy the ENTIRE redirect URL (starting with http://localhost:3000...)');
console.log('\nNote: The page will show an error - that\'s expected! Just copy the URL.\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Paste the redirect URL here: ', async (redirectUrl) => {
  try {
    // Extract code from URL
    const url = new URL(redirectUrl);
    const code = url.searchParams.get('code');

    if (!code) {
      console.error('\n❌ Error: Could not find authorization code in URL');
      console.log('Make sure you copied the full redirect URL');
      rl.close();
      return;
    }

    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    console.log('\n✅ Success! Here are your tokens:\n');
    console.log('Access Token:', tokens.access_token);
    console.log('\nRefresh Token:', tokens.refresh_token);
    console.log('\n=== Add these to your Firebase Functions config ===\n');
    console.log('Run these commands:\n');
    console.log(`firebase functions:config:set google.client_id="${GOOGLE_CLIENT_ID}"`);
    console.log(`firebase functions:config:set google.client_secret="${GOOGLE_CLIENT_SECRET}"`);
    console.log(`firebase functions:config:set google.refresh_token="${tokens.refresh_token}"`);
    console.log('\n=== IMPORTANT: Keep refresh_token SECRET! ===\n');

  } catch (error) {
    console.error('\n❌ Error getting tokens:', error.message);
  }

  rl.close();
});
