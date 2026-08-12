# The Great Escape Board 🎈

A fun, interactive board for tracking multiple colleagues serving out their notice periods.

Add a name, last working day, and notice length (30/60/90/120 days) — each person appears as a
horizontal slider so you can compare everyone's "happiness altitude" at a glance, from 🏢 Office
to Peak Freedom 🚀. Once someone's last day has passed, they ascend to Heaven ☁️👼.

## Data storage: your Google Sheet, connected automatically

This connects to your sheet:
https://docs.google.com/spreadsheets/d/17f5MrTZ_bN5aqCPz3K9NswLJ3j8FOQ6T4tdqxe-WhZI/edit

The connection URL lives in one place, [`config.js`](./config.js) — set it once, and the page
connects on its own from then on. Nobody typing anything into the page each time.

### One-time setup (5 minutes)

1. Open the sheet above.
2. Make sure a tab named **Sheet1** exists, with row 1 as headers:
   `name | lastDay | notice`
   (The script creates this automatically if it's missing.)
3. **Extensions → Apps Script**.
4. Delete the placeholder code, and paste in the contents of
   [`apps-script/Code.gs`](./apps-script/Code.gs) from this project.
5. Click **Deploy → New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Click **Deploy**, authorize it when prompted, then copy the URL ending in `/exec`.
7. Open [`config.js`](./config.js) and paste it in:
   ```js
   window.SHEET_WEBAPP_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";
   ```
8. Save. Open `index.html` — it connects automatically.

From then on, adding or removing someone updates the actual rows in your sheet, and the page
polls every 15 seconds so multiple people looking at the board (or editing the sheet directly)
stay in sync.

## If it shows "Couldn't reach the sheet"

The status dot at the top of the page tells you exactly what's wrong:

- **"No Google Sheet connected"** — `config.js` still has an empty `SHEET_WEBAPP_URL`. Do step 7 above.
- **"Sheet returned a non-JSON response"** — almost always means the deployment's access isn't
  set to **Anyone**, or you're using an old URL from a previous deployment. Go to
  **Deploy → Manage deployments** in the Apps Script editor, check the access setting, and make
  sure `config.js` has the exact `/exec` URL shown there.
- **"HTTP 403" / "HTTP 401"** — same as above: access needs to be "Anyone", not "Anyone with a
  Google account" or "Only myself".
- **Any network-style error while opening the page as a local file** (`file://...`) — some
  browsers block this kind of cross-origin request from a file opened directly. Serve the folder
  instead of double-clicking it:
  ```bash
  python3 -m http.server 8000
  ```
  then open `http://localhost:8000`.
- **Redeploying `Code.gs` after an edit** generates a **new** `/exec` URL unless you choose
  "Manage deployments → Edit → same deployment" — update `config.js` if that happens.

## Files

- `index.html` — the board itself
- `config.js` — the one place the Apps Script URL lives
- `apps-script/Code.gs` — the Google Apps Script backend (paste into your sheet's Apps Script editor)

## Data format

One row per person in the sheet: `name`, `lastDay` (YYYY-MM-DD), `notice` (days).

The `lastDay` column is kept as plain text and always normalized to `YYYY-MM-DD` by the
Apps Script backend, on both read and write — so editing the sheet by hand (which Sheets
would otherwise auto-convert to a locale-formatted date) can't produce an "Invalid date"
on the board. If you edit `Code.gs` in your deployment, re-paste the updated
[`apps-script/Code.gs`](./apps-script/Code.gs) and redeploy for this to take effect.
