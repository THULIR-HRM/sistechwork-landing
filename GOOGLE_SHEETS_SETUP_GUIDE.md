# Google Sheets Integration Guide for Job Interview Registration

This guide outlines how to connect your **Job Interview Registration Web Application** directly to a **Google Sheet** using Google Apps Script.

---

## 1. Overview of the Architecture

Your application is architecturally structured into clean, decoupled modules:

* [index.html](file:///c:/Users/SMILE/.antigravity-ide/landing%20page/index.html) – The semantic, responsive single-page application layout with header, form cards, and footer.
* [style.css](file:///c:/Users/SMILE/.antigravity-ide/landing%20page/style.css) – Visual design system recreating the Sistechwork header and footer.
* [config.js](file:///c:/Users/SMILE/.antigravity-ide/landing%20page/config.js) – Central configuration containing the `GOOGLE_APPS_SCRIPT_URL` variable, passing years, and degree/department options.
* [submission.js](file:///c:/Users/SMILE/.antigravity-ide/landing%20page/submission.js) – Standalone submission client that formats the payload, checks connection status, prevents duplicates, and sends data to Google Apps Script.
* [app.js](file:///c:/Users/SMILE/.antigravity-ide/landing%20page/app.js) – Real-time validation engine, dynamic UI toggling, and button state controller.
* [google-apps-script-code.js](file:///c:/Users/SMILE/.antigravity-ide/landing%20page/google-apps-script-code.js) – Ready-to-paste Google Apps Script backend code with automatic header generation.

---

## 2. Step-by-Step Setup in Google Sheets

### Step A: Create a New Google Sheet
1. Navigate to [Google Sheets](https://sheets.new) in your browser.
2. Name your spreadsheet (e.g., `Sistechwork Job Interview Registrations 2026`).

### Step B: Open the Apps Script Editor
1. In the Google Sheets top menu, click **Extensions** > **Apps Script**.
2. Rename the project to `Interview Registration Handler`.

### Step C: Paste the Backend Script
1. Delete any boilerplate code inside `Code.gs`.
2. Open [google-apps-script-code.js](file:///c:/Users/SMILE/.antigravity-ide/landing%20page/google-apps-script-code.js) and copy its entire content into `Code.gs`:

```javascript
function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Automatically create branded header row on first submission
    if (sheet.getLastRow() === 0) {
      var headers = [
        "Submission Timestamp",
        "Full Name",
        "Email ID",
        "Contact Number",
        "College Name",
        "Degree",
        "Department",
        "Location",
        "Year of Passing",
        "Grading Type",
        "CGPA / Percentage",
        "12th Standard %",
        "10th Standard %",
        "Number of Arrears",
        "Preferred Job Roles",
        "ISO Timestamp"
      ];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#0066ff").setFontColor("#ffffff");
      sheet.setFrozenRows(1);
    }

    var data = {};
    if (e.parameter && Object.keys(e.parameter).length > 0) {
      data = e.parameter;
    } else if (e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.postData.contents;
      }
    }

    var row = [
      data.submissionTimestamp || Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss"),
      data.fullName || "",
      data.email || "",
      data.contactNumber || "",
      data.collegeName || "",
      data.degree || "",
      data.department || "",
      data.location || "",
      data.yearOfPassing || "",
      data.gradingType || "",
      data.cgpaOrPercentage || "",
      data.twelfthPercentage || "",
      data.tenthPercentage || "",
      data.numberOfArrears || "",
      data.preferredJobRoles || "",
      data.submissionIsoTime || new Date().toISOString()
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success", message: "Response recorded successfully." }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
```

3. Save the script (**Ctrl + S** or the disk icon).

### Step D: Deploy as a Web App
1. Click the blue **Deploy** button in the top right corner and select **New deployment**.
2. Click the gear icon beside "Select type" and choose **Web app**.
3. Configure the settings:
   * **Description**: `Job Interview Web App v1`
   * **Execute as**: `Me (your email)`
   * **Who has access**: `Anyone` *(Crucial: This allows your web form to submit records without requiring candidates to sign into Google).*
4. Click **Deploy**.
5. When prompted, click **Authorize access**, select your Google account, and click **Allow**.
6. Copy the generated **Web app URL** (it ends with `/exec`).

---

## 3. Connecting the Web App URL to Your Project

Open [config.js](file:///c:/Users/SMILE/.antigravity-ide/landing%20page/config.js) and paste your URL into `GOOGLE_APPS_SCRIPT_URL`:

```javascript
const APP_CONFIG = {
  // Paste your deployed Google Apps Script Web App Executable URL here:
  GOOGLE_APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycb.../exec",
  
  // ... other configurable lists
};
```

That's it! When you refresh the registration page:
1. The badge will change to **`Google Sheets: Connected`** with a live green indicator.
2. When candidates complete and submit the form, their data is instantly appended to your Google Sheet in real-time.
