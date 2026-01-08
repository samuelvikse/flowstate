# Remaining Steps - Quick Guide

I've done as much as I can automatically. Here's what YOU need to do to complete the setup:

## ✅ What I've Done For You

- ✅ Created Firebase Functions for Gmail and Calendar
- ✅ Updated all frontend code to use Firebase Functions
- ✅ Installed dependencies (firebase-tools, dotenv, etc.)
- ✅ Updated .gitignore for Firebase
- ✅ Created setup scripts
- ✅ Built and tested - everything compiles!

## 📝 What You Need To Do (3 Main Steps)

### Step 1: Get Your Google Client Secret

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth Client (ID: `979024846870-pkc3hc0r706mkegt8cfulnlamcb9q9vu`)
3. Look for **"Client secret"** at the top (looks like: `GOCSPX-xxxxx`)
4. Copy it

### Step 2: Add Client Secret to .env File

Open your `.env` file and add this line:

```
GOOGLE_CLIENT_SECRET=paste_your_client_secret_here
```

Save the file.

### Step 3: Generate Your Refresh Token

Run this command in the terminal:

```bash
node scripts/get-refresh-token.js
```

Follow the instructions:
1. It will print a URL - **open it in your browser**
2. Log into YOUR Google account (not your girlfriend's!)
3. Click "Allow" to grant permissions
4. You'll be redirected to a URL (page will show error - that's OK!)
5. **Copy the ENTIRE URL** from your browser
6. Paste it back into the terminal
7. The script will output 3 commands - **RUN THEM** (they look like this):

```bash
firebase functions:config:set google.client_id="..."
firebase functions:config:set google.client_secret="..."
firebase functions:config:set google.refresh_token="..."
```

### Step 4: Login to Firebase

```bash
npx firebase login
```

### Step 5: Initialize Firebase Project

```bash
npx firebase init
```

When prompted:
- **Functions**: Yes
- **Hosting**: Yes
- **Use existing project**: Select `flowstate-5d88b`
- **Language**: TypeScript
- **ESLint**: No (optional)
- **Install dependencies**: Yes
- **Public directory**: dist
- **Single-page app**: Yes
- **Overwrite files**: **NO** (if asked)

### Step 6: Deploy Firebase Functions

```bash
npx firebase deploy --only functions
```

This takes 2-3 minutes. Wait for it to complete.

### Step 7: Test!

Your site should now work! Go to svbruvik.no and test:
- Calendar should load YOUR events automatically
- Mail should load YOUR emails automatically
- No login prompts for anyone
- Your girlfriend can add/edit/delete events and emails on YOUR account

## 🔒 Security Note

Your refresh token gives FULL access to your Gmail and Calendar. Keep it secret!

## ❓ Having Issues?

### "Client secret not configured"
→ Make sure you added `GOOGLE_CLIENT_SECRET` to your `.env` file in Step 2

### "Could not find authorization code in URL"
→ Make sure you copied the ENTIRE redirect URL from your browser (starts with `http://localhost:3000/`)

### "Permission denied"
→ Make sure you clicked "Allow" when granting permissions. Re-run Step 3.

### Functions not deploying
→ Make sure you ran `firebase login` first
→ Make sure you selected the correct project in `firebase init`

## 🎉 After Setup

Once this works:
- No more OAuth login prompts
- Everyone uses YOUR Google account
- Your girlfriend can manage YOUR calendar and emails
- All data syncs in real-time

Good luck! 🚀
