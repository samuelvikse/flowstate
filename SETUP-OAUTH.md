# Firebase Functions OAuth Setup Guide

This guide will help you set up server-side OAuth so your girlfriend can access YOUR Google Calendar and Gmail without logging in.

## Prerequisites

1. Firebase CLI installed: `npm install -g firebase-tools`
2. Google Cloud Project with OAuth credentials
3. Google Client Secret (you'll need to get this from Google Cloud Console)

## Step-by-Step Setup

### Step 1: Get Google Client Secret

1. Go to **Google Cloud Console**: https://console.cloud.google.com/
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Click on your OAuth 2.0 Client ID (the one with ID: `979024846870-pkc3hc0r706mkegt8cfulnlamcb9q9vu`)
5. At the top right, click **"Download OAuth client"** or look for **"Client secret"**
6. Copy the **Client Secret** value (it looks like: `GOCSPX-xxxxxxxxxxxxx`)
7. Save it somewhere secure - you'll need it in the next steps

### Step 2: Update Google Cloud Console OAuth Settings

Still in the Google Cloud Console:

1. Under **Authorized redirect URIs**, add:
   - `http://localhost:3000/oauth2callback` (for generating token)
   - `https://svbruvik.no`
   - `https://www.svbruvik.no`

2. Under **Authorized JavaScript origins**, add:
   - `https://svbruvik.no`
   - `https://www.svbruvik.no`
   - `http://localhost:5173`

3. Click **Save**

### Step 3: Add Client Secret to .env

Add this line to your `.env` file:

```
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

Replace `your_client_secret_here` with the Client Secret you copied in Step 1.

### Step 4: Generate Your Google Refresh Token

Run the token generator script:

```bash
npm install dotenv
node scripts/get-refresh-token.js
```

This will:
1. Print a URL - **open it in your browser**
2. You'll be asked to log into YOUR Google account and grant permissions
3. After authorizing, you'll be redirected to a URL (the page will show an error - that's OK!)
4. **Copy the ENTIRE redirect URL** from your browser's address bar
5. Paste it back into the terminal

The script will output three commands like:

```bash
firebase functions:config:set google.client_id="..."
firebase functions:config:set google.client_secret="..."
firebase functions:config:set google.refresh_token="..."
```

**Run these three commands** to save your credentials to Firebase.

### Step 5: Login to Firebase

```bash
firebase login
```

Follow the prompts to log into your Firebase account.

### Step 6: Initialize Firebase (if not already done)

```bash
firebase init
```

Select:
- Functions: Yes
- Hosting: Yes
- Use existing project: Select your `flowstate-5d88b` project

### Step 7: Deploy Firebase Functions

```bash
firebase deploy --only functions
```

This will deploy all the Gmail and Calendar proxy functions to Firebase.

### Step 8: Update Your Frontend Code

The frontend needs to be updated to use the new Firebase Functions instead of direct OAuth.

I've created two new files:
- `src/lib/gmail-functions.ts` - Replaces `src/lib/gmail.ts`
- `src/lib/googleCalendar-functions.ts` - Replaces `src/lib/googleCalendar.ts`

**Important**: You need to update the imports in your pages to use the new `-functions` versions.

### Step 9: Test Locally (Optional)

Before deploying, test the functions locally:

```bash
firebase emulators:start
```

### Step 10: Deploy to Production

```bash
npm run build
git add .
git commit -m "Add Firebase Functions for server-side OAuth"
git push
```

## Security Notes

- **Your refresh token is SECRET** - it gives full access to your Google account
- Never commit the refresh token to git
- The token is stored securely in Firebase Functions config
- Only you and your girlfriend (with the password) can access the app

## Troubleshooting

### "Client secret not configured"
Make sure you added `GOOGLE_CLIENT_SECRET` to your `.env` file.

### "Failed to fetch messages"
Check that you ran the three `firebase functions:config:set` commands from Step 4.

### "Functions not found"
Make sure you deployed the functions with `firebase deploy --only functions`.

### "Permission denied"
Make sure you granted all permissions when generating the refresh token. You may need to re-run Step 4.

## What Happens Now?

- When anyone opens the Calendar or Mail pages, they'll automatically see YOUR data
- No login prompts
- Your girlfriend can add, edit, and delete calendar events and emails
- All actions are done using YOUR Google account
- The "Connect Gmail" and "Connect Calendar" buttons can be removed since it's always connected

## Next Steps

After setup is complete, you may want to:
1. Remove the connection UI buttons from the pages
2. Add your email address to `getGmailProfile()` in `gmail-functions.ts`
3. Test thoroughly before sharing with your girlfriend
