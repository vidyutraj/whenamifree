# WhenAmIFree

A Chrome Extension that connects to your Google Calendar and drafts availability messages for recruiters — in seconds.

Set your date range, working hours, and preferred slot duration. WhenAmIFree finds your free windows and generates a ready-to-send message you can copy straight into an email.

---

## Install as a Chrome Extension

### Step 1 — Download

Click the green **Code** button on this page → **Download ZIP** → unzip the folder anywhere on your computer.

### Step 2 — Load in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Toggle **Developer mode** on (top-right corner)
3. Click **Load unpacked**
4. Select the unzipped `freefinder` folder
5. The WhenAmIFree icon appears in your Chrome toolbar

### Step 3 — Connect your calendar

Click the WhenAmIFree icon → **Connect Calendar** → sign in with Google and allow calendar access.

> **Note:** This extension is currently in private testing. Your Google account must be added to the test user list before you can connect your calendar. Contact the developer to get access.

---

## Usage

1. **Date Range** — pick a start/end date or use the quick-select chips (This week / Next week / Next 2 weeks)
2. **Available Hours** — toggle work hours (9–5) or set a custom range
3. **Slot Duration** — choose 30 / 45 / 60 / 90 min, or type a custom duration
4. **Days of Week** — toggle which days to include
5. **Timezone** — auto-detected from your browser, change if needed
6. **Message Style** — Professional, Casual, or Slots only
7. Click **Find My Availability** → copy the drafted message

---

## Local Test Harness

A browser-based test page (`test.html`) is included for validating calendar logic without loading the Chrome extension.

**Requirements:** Must be served from localhost (Google OAuth blocks `file://` redirects).

```bash
python3 -m http.server 8081
```

Then open `http://localhost:8081/test.html`.

**Mock mode** — works instantly with no setup. Generates synthetic busy events so you can test the free-window logic and message output.

**Real calendar mode** — requires a Web Application OAuth client_id from [Google Cloud Console](https://console.cloud.google.com/apis/credentials) with `http://localhost:8081/test.html` as an authorized redirect URI.

---

## Developer Setup

If you want to run your own instance with a different Google Cloud project:

1. **Create a Google Cloud project** at [console.cloud.google.com](https://console.cloud.google.com)
2. Enable the **Google Calendar API** (APIs & Services → Library)
3. Configure the **OAuth consent screen** (Google Auth Platform → Branding)
4. Create two OAuth clients:
   - **Chrome Extension** type — use the extension ID from `chrome://extensions/` as the Item ID
   - **Web application** type — add `http://localhost:8081/test.html` as a redirect URI (for local testing only)
5. Paste the Chrome Extension client_id into `manifest.json`:
   ```json
   "oauth2": {
     "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
     "scopes": ["https://www.googleapis.com/auth/calendar.readonly"]
   }
   ```
6. Reload the extension in `chrome://extensions/`

See `background.js` for the full step-by-step setup guide in the comment block at the top.

---

## Tech

- Manifest V3 Chrome Extension
- `chrome.identity` for OAuth token management
- Google Calendar API — `freeBusy` endpoint
- Vanilla JS, no frameworks or build step required
