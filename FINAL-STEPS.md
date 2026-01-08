# Final Deployment Steps

## ✅ What I've Done For You:

1. ✅ Got your Google refresh token
2. ✅ Updated Firebase Functions to use modern env vars
3. ✅ Created `.env` files with your credentials
4. ✅ Fixed all TypeScript errors
5. ✅ Built the functions successfully

## 🚀 What YOU Need To Do (3 Simple Commands):

### Step 1: Login to Firebase

Run this command and follow the prompts in your browser:

```bash
npx firebase login
```

This will open your browser. Log in with your Google account.

### Step 2: Initialize Firebase Project

```bash
npx firebase init
```

When prompted, answer:

- **Which Firebase features?**: Use arrow keys to select:
  - ✅ Functions (press space to select)
  - ✅ Hosting (press space to select)
  - Then press Enter

- **Use existing project**: Select **flowstate-5d88b**

- **Language**: TypeScript

- **ESLint**: No

- **Install dependencies**: Yes

- **Public directory**: Type `dist` and press Enter

- **Single-page app**: Yes

- **Overwrite index.html**: **NO** (Important!)

- **Overwrite any other files**: **NO**

### Step 3: Deploy to Firebase

```bash
npx firebase deploy --only functions
```

Wait 2-3 minutes for deployment to complete.

## 🎉 That's It!

Once deployed:
- Go to svbruvik.no
- Calendar and Mail should work automatically
- No more OAuth login prompts
- Everyone accesses YOUR Google account

## 🔒 Important Security Notes

Your credentials are stored in these files (all ignored by git):
- `functions/.env` - Contains your refresh token
- `.env.deploy` - Backup of credentials
- `.env` - Your Google Client Secret

**Never commit these files to GitHub!**

## ❓ Troubleshooting

### "Failed to authenticate"
→ Run `npx firebase login` again

### "Permission denied" during deploy
→ Make sure you selected the correct project (flowstate-5d88b) in step 2

### Functions still not working after deploy
→ Check Firebase Console: https://console.firebase.google.com/project/flowstate-5d88b/functions
→ Look for any error messages

## 📝 After Successful Deployment

The site will automatically use YOUR Google account for:
- Gmail (read, send, delete emails)
- Google Calendar (view, create, edit, delete events)

No more "Connect Gmail" or "Connect Calendar" buttons needed!

---

**Ready?** Start with Step 1: `npx firebase login`
