/*
 * ═══════════════════════════════════════════════════════════════
 *  WhenAmIFree — background.js (Manifest V3 Service Worker)
 *  OAuth token management via chrome.identity
 * ═══════════════════════════════════════════════════════════════
 *
 *  SETUP GUIDE — Read this before loading the extension
 *  ─────────────────────────────────────────────────────────────
 *
 *  STEP 1 — Create a Google Cloud Project & enable the Calendar API
 *  ─────────────────────────────────────────────────────────────
 *  1. Go to https://console.cloud.google.com/
 *  2. Click "Select a project" → "New Project". Give it any name
 *     (e.g. "WhenAmIFree") and click Create.
 *  3. In the left sidebar go to APIs & Services → Library.
 *  4. Search for "Google Calendar API" and click Enable.
 *
 *  STEP 2 — Set up OAuth 2.0 credentials
 *  ─────────────────────────────────────────────────────────────
 *  1. In the left sidebar go to APIs & Services → Credentials.
 *  2. Click "+ Create Credentials" → "OAuth client ID".
 *  3. If prompted, configure the OAuth consent screen first:
 *     - User type: External
 *     - App name: WhenAmIFree
 *     - Add your email as a test user
 *     - Scopes: add https://www.googleapis.com/auth/calendar.readonly
 *  4. Back in "Create OAuth client ID":
 *     - Application type: Chrome Extension
 *     - Item ID: paste your extension's ID from chrome://extensions/
 *       (You need to load it first — see Step 3 below, then come back)
 *  5. Click Create. Copy the client_id shown — it looks like:
 *       123456789012-abcdefghijklmnopqrstuvwxyz012345.apps.googleusercontent.com
 *
 *  STEP 3 — Load the extension in Chrome (Developer Mode)
 *  ─────────────────────────────────────────────────────────────
 *  1. Open Chrome and go to chrome://extensions/
 *  2. Toggle on "Developer mode" (top-right switch).
 *  3. Click "Load unpacked" and select this folder (the one with manifest.json).
 *  4. The extension will appear with an auto-generated Extension ID.
 *     Copy that ID — you'll need it for Step 2 above.
 *  5. After you get your OAuth client_id (Step 2), continue to Step 4.
 *
 *  STEP 4 — Paste your client_id into manifest.json
 *  ─────────────────────────────────────────────────────────────
 *  Open manifest.json and replace the placeholder in the "oauth2" block:
 *
 *    "oauth2": {
 *      "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",  ← replace this
 *      ...
 *    }
 *
 *  After saving manifest.json, go back to chrome://extensions/ and click
 *  the refresh icon on the WhenAmIFree card. The extension is now ready.
 *
 * ═══════════════════════════════════════════════════════════════
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_AUTH_TOKEN') {
    const interactive = message.interactive === true;

    chrome.identity.getAuthToken({ interactive }, (token) => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else if (!token) {
        sendResponse({ error: 'No token returned from identity API.' });
      } else {
        sendResponse({ token });
      }
    });

    // Return true to signal async response
    return true;
  }

  if (message.type === 'REMOVE_AUTH_TOKEN') {
    const token = message.token;

    if (!token) {
      sendResponse({ ok: true });
      return true;
    }

    chrome.identity.removeCachedAuthToken({ token }, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse({ ok: true });
      }
    });

    return true;
  }
});
