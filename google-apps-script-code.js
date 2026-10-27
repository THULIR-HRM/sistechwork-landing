/**
 * ============================================================================
 * GOOGLE APPS SCRIPT CODE (Copy & Paste this into your Google Apps Script editor)
 * ============================================================================
 * 
 * INSTRUCTIONS:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. Click Extensions > Apps Script
 * 3. Delete any code in the editor and paste this entire code
 * 4. Click 'Deploy' > 'New deployment'
 * 5. Select type: 'Web app'
 * 6. Set Description: "Job Interview Registration Webhook"
 * 7. Execute as: 'Me' (your email)
 * 8. Who has access: 'Anyone' (IMPORTANT: this allows the web form to submit without login)
 * 9. Click 'Deploy' and copy the 'Web app URL'
 * 10. Paste the Web App URL into config.js in your project:
 *     GOOGLE_APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycb.../exec"
 * ============================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Wait up to 10 seconds for concurrent requests

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Check if headers exist, if not create them automatically
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

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "active", message: "Job Interview Registration Webhook is operational." }))
    .setMimeType(ContentService.MimeType.JSON);
}
