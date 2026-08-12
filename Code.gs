/**
 * The Great Escape Board — Google Sheets backend.
 *
 * Setup:
 * 1. Open your Google Sheet.
 * 2. Extensions -> Apps Script.
 * 3. Delete any starter code, paste this file in instead.
 * 4. Make sure the sheet tab is named "Sheet1" (or change SHEET_NAME below)
 *    and row 1 has headers: name | lastDay | notice
 * 5. Deploy -> New deployment -> type "Web app".
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 6. Copy the deployment URL (ends in /exec) and paste it into the site's
 *    "Connect Google Sheet" box.
 */

const SHEET_NAME = 'Sheet1';
const DATE_COL = 2; // lastDay column

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['name', 'lastDay', 'notice']);
  }
  // Force the lastDay column to plain text so Sheets never silently
  // reformats/re-locales a typed date — every write lands as literal yyyy-MM-dd.
  sheet.getRange(1, DATE_COL, Math.max(sheet.getMaxRows(), 1000), 1).setNumberFormat('@');
  return sheet;
}

// Normalizes any value we might encounter in the lastDay cell — a real Date
// (legacy rows, or someone pasting a date that Sheets auto-converted), an
// ISO string, or a locale-formatted string typed by hand — down to one
// canonical yyyy-MM-dd shape. Returns '' if it truly can't be read.
function formatDate_(value) {
  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  const str = String(value || '').trim();
  if (!str) return '';

  let m = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); // yyyy-MM-dd
  if (m) return pad_(m[1], 4) + '-' + pad_(m[2]) + '-' + pad_(m[3]);

  m = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/); // MM/dd/yyyy (Sheets default US locale)
  if (m) return pad_(m[3], 4) + '-' + pad_(m[1]) + '-' + pad_(m[2]);

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return Utilities.formatDate(parsed, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return '';
}

function pad_(n, len) {
  n = String(n);
  len = len || 2;
  while (n.length < len) n = '0' + n;
  return n;
}

function doGet(e) {
  const sheet = getSheet_();
  const values = sheet.getDataRange().getValues();
  values.shift(); // drop header row
  const people = values
    .filter(row => row[0] !== '' && row[0] !== null)
    .map(row => ({
      name: String(row[0]),
      lastDay: formatDate_(row[1]),
      notice: Number(row[2]) || 90
    }));
  return jsonOutput_({ people: people });
}

function doPost(e) {
  const payload = JSON.parse(e.postData.contents);
  const people = Array.isArray(payload.people) ? payload.people : [];
  const sheet = getSheet_();

  sheet.clearContents();
  sheet.appendRow(['name', 'lastDay', 'notice']);
  if (people.length > 0) {
    const rows = people.map(p => [p.name, formatDate_(p.lastDay), p.notice]);
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  }

  return jsonOutput_({ ok: true });
}

function jsonOutput_(obj) {
  // Apps Script web apps already send Access-Control-Allow-Origin: * on their
  // own for GET/POST responses; ContentService.MimeType.JSON is what makes
  // the page able to parse the response instead of treating it as HTML.
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
