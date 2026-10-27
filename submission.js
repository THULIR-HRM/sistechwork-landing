/**
 * ============================================================================
 * SUBMISSION SERVICE FOR GOOGLE APPS SCRIPT / GOOGLE SHEETS INTEGRATION
 * ============================================================================
 * Handles preparing data, verifying configuration, making HTTP requests,
 * and reporting status back to the UI.
 * ============================================================================
 */

class SubmissionService {
  constructor(config) {
    this.config = config || window.APP_CONFIG || {};
    this.isSubmitting = false;
  }

  /**
   * Check if Google Apps Script URL is set and valid
   */
  isConfigured() {
    const url = this.config.GOOGLE_APPS_SCRIPT_URL;
    return Boolean(
      url &&
      typeof url === 'string' &&
      url.trim().length > 0 &&
      !url.includes("YOUR_GOOGLE_APPS_SCRIPT") &&
      url.startsWith("https://script.google.com/")
    );
  }

  /**
   * Formats raw form data into Google Sheets ready payload
   */
  formatPayload(formData) {
    // Determine degree text
    let degreeText = formData.degree;
    if (degreeText === 'Other' && formData.degreeOther) {
      degreeText = `Other: ${formData.degreeOther.trim()}`;
    }

    // Determine department text
    let deptText = formData.department;
    if (deptText === 'Other' && formData.departmentOther) {
      deptText = `Other: ${formData.departmentOther.trim()}`;
    }

    // Convert array of preferred roles to a clean comma-separated string
    const rolesText = Array.isArray(formData.preferredRoles)
      ? formData.preferredRoles.join(", ")
      : String(formData.preferredRoles || "");

    // Current formatted timestamp
    const now = new Date();
    const formattedTimestamp = now.toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'medium',
      hour12: true
    });
    const isoTimestamp = now.toISOString();

    return {
      fullName: formData.fullName ? formData.fullName.trim() : "",
      email: formData.email ? formData.email.trim() : "",
      contactNumber: formData.contactNumber ? formData.contactNumber.trim() : "",
      collegeName: formData.collegeName ? formData.collegeName.trim() : "",
      degree: degreeText,
      department: deptText,
      location: formData.location ? formData.location.trim() : "",
      yearOfPassing: formData.yearOfPassing || "",
      gradingType: formData.gradingType || "CGPA",
      cgpaOrPercentage: formData.cgpaOrPercentage ? String(formData.cgpaOrPercentage).trim() : "",
      twelfthPercentage: formData.twelfthPercentage ? String(formData.twelfthPercentage).trim() : "",
      tenthPercentage: formData.tenthPercentage ? String(formData.tenthPercentage).trim() : "",
      numberOfArrears: formData.numberOfArrears || "0",
      preferredJobRoles: rolesText,
      submissionTimestamp: formattedTimestamp,
      submissionIsoTime: isoTimestamp
    };
  }

  /**
   * Submits formatted candidate data to Google Apps Script Web App
   * @param {Object} formData 
   * @returns {Promise<{success: boolean, message: string, isTestMode?: boolean, data?: any}>}
   */
  async submitRegistration(formData) {
    if (this.isSubmitting) {
      return {
        success: false,
        message: "A submission request is already in progress. Please wait."
      };
    }

    const payload = this.formatPayload(formData);

    // If Google Apps Script URL has not been provided yet
    if (!this.isConfigured()) {
      return {
        success: false,
        isNotConfigured: true,
        message: "Google Apps Script Web App URL has not been configured yet in config.js. Form validation succeeded! Please configure GOOGLE_APPS_SCRIPT_URL to connect Google Sheets.",
        payload: payload
      };
    }

    this.isSubmitting = true;
    const targetUrl = this.config.GOOGLE_APPS_SCRIPT_URL.trim();

    try {
      /**
       * Note: Google Apps Script Web App requires POST data formatted as
       * urlencoded or JSON string. Often browser fetch encounters CORS unless 
       * mode: 'no-cors' is used or the Apps Script sends CORS headers.
       * We use URLSearchParams or text/plain JSON with mode: 'no-cors' to guarantee
       * delivery without CORS blocking in the browser.
       */
      const formDataToSend = new URLSearchParams();
      for (const [key, value] of Object.entries(payload)) {
        formDataToSend.append(key, value);
      }

      // Also send raw JSON payload field for Apps Script doPost parsing
      formDataToSend.append("jsonData", JSON.stringify(payload));

      const response = await fetch(targetUrl, {
        method: "POST",
        mode: "no-cors", // Crucial for Google Apps Script Web App redirects
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: formDataToSend.toString()
      });

      // With mode 'no-cors', the response type is 'opaque'. A non-throwing completion
      // indicates the network request was successfully dispatched and received by Google.
      this.isSubmitting = false;
      return {
        success: true,
        message: "Registration submitted successfully! Your details have been recorded.",
        payload: payload
      };
    } catch (networkError) {
      this.isSubmitting = false;
      console.error("Submission Network Error:", networkError);
      return {
        success: false,
        message: `Network error while submitting to Google Sheets: ${networkError.message || 'Unable to reach the server'}. Your details have been preserved.`,
        error: networkError
      };
    }
  }
}

// Export to window
window.SubmissionService = SubmissionService;
