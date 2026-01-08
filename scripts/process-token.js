import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';

const redirectUrl = 'http://localhost:3000/oauth2callback?code=4/0ATX87lN2vFrN7pbl2ZQIR-T_gB9vOmcQE5J4jC3l1JmJynuqBD-i0FLDiF7YG7IcBF-Jvg&scope=https://www.googleapis.com/auth/gmail.modify%20https://www.googleapis.com/auth/gmail.send%20https://www.googleapis.com/auth/calendar';

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  REDIRECT_URI
);

const url = new URL(redirectUrl);
const code = url.searchParams.get('code');

console.log('Getting tokens...\n');

try {
  const { tokens } = await oauth2Client.getToken(code);

  console.log('✅ Success!\n');
  console.log('Your refresh token:', tokens.refresh_token);
  console.log('\n=== Run these commands ===\n');
  console.log(`npx firebase functions:config:set google.client_id="${GOOGLE_CLIENT_ID}"`);
  console.log(`npx firebase functions:config:set google.client_secret="${GOOGLE_CLIENT_SECRET}"`);
  console.log(`npx firebase functions:config:set google.refresh_token="${tokens.refresh_token}"`);
} catch (error) {
  console.error('Error:', error.message);
}
