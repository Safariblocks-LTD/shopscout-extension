# ✅ Magic Link Complete Setup Checklist

## Why No Email is Arriving

If you're not receiving the Magic Link email, it's because one or more of these Firebase settings is missing.

---

## 🔥 Firebase Console Setup (CRITICAL)

### Step 1: Enable Email/Password Provider

1. Go to https://console.firebase.google.com/
2. Select project: **shopscout-9bb63**
3. Click **Authentication** (left sidebar)
4. Click **Sign-in method** tab
5. Find **Email/Password** in the list
6. Click on it
7. Toggle **Enable** to ON
8. ✅ **CHECK the box**: "Email link (passwordless sign-in)"
9. Click **Save**

**Screenshot verification**: You should see "Email/Password" with status "Enabled" in the list

---

### Step 2: Verify Authorized Domains

1. Still in Authentication, click **Settings** tab
2. Scroll to **Authorized domains** section
3. Verify these domains are listed:
   - `localhost` (for development)
   - `shopscout-9bb63.firebaseapp.com` ← **MUST BE PRESENT**
   - `chrome-extension://jfmjepjaocjmdlbcamqmalhkfjcchb` (your extension)

4. If `shopscout-9bb63.firebaseapp.com` is missing:
   - Click **Add domain**
   - Enter: `shopscout-9bb63.firebaseapp.com`
   - Click **Add**

**Why this matters**: The Magic Link email contains a link to this domain. If it's not authorized, Firebase won't send the email.

---

### Step 3: Check Email Templates (Optional but Recommended)

1. In Authentication, click **Templates** tab
2. Find **Email link sign-in**
3. Click the pencil icon to edit
4. Verify:
   - **From name**: Firebase (shopscout-9bb63)
   - **Reply-to**: noreply@shopscout-9bb63.firebaseapp.com
   - Template looks correct

---

## 🧪 Test After Firebase Setup

### Step 1: Reload Extension

```
chrome://extensions/ → 🔄 Reload ShopScout
```

### Step 2: Open Background Console

```
1. chrome://extensions/
2. Find ShopScout
3. Click "service worker" (blue link)
4. Keep this console open
```

### Step 3: Try Sending Magic Link

1. Click ShopScout icon
2. Enter email: `celestine.kariuki@strathmore.edu`
3. Click "Send Magic Link"
4. Watch the background console for logs

**Expected logs:**
```
[Offscreen] Sending magic link to: celestine.kariuki@strathmore.edu
[Offscreen] Action code settings: {url: '...', handleCodeInApp: true}
[Offscreen] Magic link sent successfully to: celestine.kariuki@strathmore.edu
```

**If you see an error:**
```
[Offscreen] Failed to send magic link: [error details]
```
The error will tell you exactly what's wrong.

---

## 📧 Email Troubleshooting

### If No Email After 5 Minutes:

1. **Check spam/junk folder** - Firebase emails often go there
2. **Try a different email** - Gmail, Outlook, etc.
3. **Check Firebase Console logs**:
   - Firebase Console → Authentication → Users
   - Look for any error messages
4. **Verify Email/Password provider is enabled**
5. **Verify "Email link (passwordless sign-in)" is checked**

### Email Details:

- **From**: `noreply@shopscout-9bb63.firebaseapp.com`
- **Subject**: "Sign in to shopscout-9bb63"
- **Delivery time**: 30 seconds - 3 minutes
- **Link format**: `https://shopscout-9bb63.firebaseapp.com/__/auth/action?...`

---

## 🔍 Debug Checklist

Before asking for help, verify:

- [ ] Firebase Console → Authentication → Sign-in method
- [ ] Email/Password is **Enabled**
- [ ] "Email link (passwordless sign-in)" is **Checked**
- [ ] Authorized domains includes `shopscout-9bb63.firebaseapp.com`
- [ ] Extension is reloaded
- [ ] Background console shows no errors
- [ ] Tried checking spam folder
- [ ] Waited at least 3 minutes

---

## 🎯 Common Issues & Solutions

### Issue: "auth/invalid-action-code"

**Cause**: The URL in actionCodeSettings is not in authorized domains

**Fix**: Add `shopscout-9bb63.firebaseapp.com` to authorized domains

### Issue: "auth/unauthorized-domain"

**Cause**: Domain not authorized

**Fix**: Add the domain to Firebase Console → Authentication → Settings → Authorized domains

### Issue: No error, but no email

**Cause**: Email/Password provider not enabled OR "Email link" not checked

**Fix**: 
1. Enable Email/Password provider
2. Check "Email link (passwordless sign-in)"
3. Save

### Issue: Email goes to spam

**Solution**: This is normal. Check spam folder. You can add `noreply@shopscout-9bb63.firebaseapp.com` to your contacts to prevent this.

---

## ✅ Final Verification

After completing all steps:

1. **Reload extension**
2. **Open background console**
3. **Try sending magic link**
4. **Check console for success message**
5. **Check email (including spam)**
6. **Wait 3 minutes**

If you see "[Offscreen] Magic link sent successfully" in the console, the email was sent. If it doesn't arrive, it's likely in spam or the email provider is blocking it.

---

## 🆘 Still Not Working?

If you've done everything above and still no email:

1. **Screenshot your Firebase settings**:
   - Authentication → Sign-in method (showing Email/Password enabled)
   - Authentication → Settings (showing authorized domains)

2. **Share background console logs** when you try to send the link

3. **Try a different email provider** (Gmail, Outlook, Yahoo)

4. **Check Firebase Console → Authentication → Users** for any error messages

---

**The most common issue is forgetting to check "Email link (passwordless sign-in)" in the Email/Password provider settings.** Make sure that box is checked! ✅
