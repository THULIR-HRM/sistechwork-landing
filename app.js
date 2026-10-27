/**
 * ============================================================================
 * MAIN APPLICATION LOGIC & FORM VALIDATION ENGINE
 * ============================================================================
 * Handles:
 * - Dynamic population of dropdowns from config
 * - Conditional 'Other' input toggling
 * - Grading scale dynamic limits (CGPA 0-10 vs Percentage 0-100)
 * - Strict real-time field validation with live error clearing
 * - Submit button state synchronization (disabled until 100% valid)
 * - Submission handling and feedback modal/banners
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize services and elements
  const config = window.APP_CONFIG || {};
  const submissionService = new window.SubmissionService(config);

  const form = document.getElementById('registrationForm');
  const confirmationScreen = document.getElementById('confirmationScreen');
  const submitBtn = document.getElementById('submitBtn');
  const submitBtnText = document.getElementById('submitBtnText');
  const submitBtnSpinner = document.getElementById('submitBtnSpinner');
  const progressBadge = document.getElementById('formProgressBadge');
  const progressBarFill = document.getElementById('formProgressBarFill');
  const statusNotice = document.getElementById('formStatusNotice');

  // Fields and containers
  const fullNameInput = document.getElementById('fullName');
  const emailInput = document.getElementById('email');
  const contactNumberInput = document.getElementById('contactNumber');
  const collegeNameInput = document.getElementById('collegeName');
  const degreeSelect = document.getElementById('degree');
  const degreeOtherGroup = document.getElementById('degreeOtherGroup');
  const degreeOtherInput = document.getElementById('degreeOther');
  const departmentSelect = document.getElementById('department');
  const departmentOtherGroup = document.getElementById('departmentOtherGroup');
  const departmentOtherInput = document.getElementById('departmentOther');
  const locationInput = document.getElementById('location');

  const passingYearSelect = document.getElementById('passingYear');
  const gradingTypeSelect = document.getElementById('gradingType');
  const cgpaOrPercentageInput = document.getElementById('cgpaOrPercentage');
  const cgpaHint = document.getElementById('cgpaHint');
  const twelfthPercentageInput = document.getElementById('twelfthPercentage');
  const tenthPercentageInput = document.getElementById('tenthPercentage');
  const arrearsSelect = document.getElementById('arrears');

  const jobRolesContainer = document.getElementById('jobRolesContainer');

  // Feedback modal elements
  const responseModal = document.getElementById('responseModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalMessage = document.getElementById('modalMessage');
  const modalIcon = document.getElementById('modalIcon');
  const modalCloseBtn = document.getElementById('modalCloseBtn');
  const modalDataPreview = document.getElementById('modalDataPreview');
  const modalDataList = document.getElementById('modalDataList');

  // Track touched state for user-friendly error display
  const touchedFields = new Set();

  // Populate dynamic dropdown options from config
  populateDropdowns();

  // Populate Job Roles checkboxes
  populateJobRoles();

  // Set up event listeners
  setupEventListeners();

  // Initial validation check to ensure Submit button starts disabled
  updateFormState();

  // Check and display Google Sheets connection status badge
  checkGoogleSheetsConfig();

  // ==========================================================================
  // SETUP FUNCTIONS
  // ==========================================================================

  function populateDropdowns() {
    // Populate Degree
    if (config.DEGREES && degreeSelect) {
      degreeSelect.innerHTML = '<option value="" disabled selected>Select your degree</option>';
      config.DEGREES.forEach(deg => {
        const opt = document.createElement('option');
        opt.value = deg;
        opt.textContent = deg;
        degreeSelect.appendChild(opt);
      });
    }

    // Populate Department
    if (config.DEPARTMENTS && departmentSelect) {
      departmentSelect.innerHTML = '<option value="" disabled selected>Select your department</option>';
      config.DEPARTMENTS.forEach(dept => {
        const opt = document.createElement('option');
        opt.value = dept;
        opt.textContent = dept;
        departmentSelect.appendChild(opt);
      });
    }

    // Populate Passing Years
    if (config.PASSING_YEARS && passingYearSelect) {
      passingYearSelect.innerHTML = '<option value="" disabled selected>Select graduation year</option>';
      config.PASSING_YEARS.forEach(year => {
        const opt = document.createElement('option');
        opt.value = year;
        opt.textContent = year;
        passingYearSelect.appendChild(opt);
      });
    }

    // Populate Number of Arrears
    if (config.ARREARS_OPTIONS && arrearsSelect) {
      arrearsSelect.innerHTML = '<option value="" disabled selected>Select standing arrears count</option>';
      config.ARREARS_OPTIONS.forEach(arr => {
        const opt = document.createElement('option');
        opt.value = arr;
        opt.textContent = arr === '0' ? '0 (No Arrears / All Cleared)' : arr;
        arrearsSelect.appendChild(opt);
      });
    }
  }

  function populateJobRoles() {
    if (!jobRolesContainer || !config.JOB_ROLES) return;
    jobRolesContainer.innerHTML = '';

    config.JOB_ROLES.forEach(role => {
      const label = document.createElement('label');
      label.className = 'role-checkbox-card';
      label.setAttribute('for', role.id);

      label.innerHTML = `
        <div class="custom-checkbox-wrapper">
          <input type="checkbox" id="${role.id}" name="preferredRoles" value="${role.name}">
          <span class="custom-checkmark" aria-hidden="true">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
          </span>
        </div>
        <div class="role-text-group">
          <div class="role-name">${role.name}</div>
          <div class="role-desc">${role.description}</div>
        </div>
      `;

      jobRolesContainer.appendChild(label);
    });
  }

  function checkGoogleSheetsConfig() {
    const isReady = submissionService.isConfigured();
    const configNotice = document.getElementById('configStatusBadge');
    if (!configNotice) return;

    if (isReady) {
      configNotice.className = 'integration-status-pill status-connected';
      configNotice.innerHTML = `
        <span class="status-pulse-dot online"></span>
        <span>Google Sheets: Connected</span>
      `;
    } else {
      configNotice.className = 'integration-status-pill status-ready';
      configNotice.innerHTML = `
        <span class="status-pulse-dot standby"></span>
        <span>Google Sheets Integration: Ready (Awaiting Web App URL)</span>
      `;
    }
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================

  function setupEventListeners() {
    // Text inputs & blur validation
    const standardInputs = [
      fullNameInput,
      emailInput,
      contactNumberInput,
      collegeNameInput,
      locationInput,
      cgpaOrPercentageInput,
      twelfthPercentageInput,
      tenthPercentageInput,
      degreeOtherInput,
      departmentOtherInput
    ];

    standardInputs.forEach(input => {
      if (!input) return;

      input.addEventListener('input', () => {
        touchedFields.add(input.id);
        validateSingleField(input.id);
        updateFormState();
      });

      input.addEventListener('blur', () => {
        touchedFields.add(input.id);
        validateSingleField(input.id);
        updateFormState();
      });
    });

    // Dropdowns
    const dropdowns = [degreeSelect, departmentSelect, passingYearSelect, gradingTypeSelect, arrearsSelect];
    dropdowns.forEach(select => {
      if (!select) return;

      select.addEventListener('change', () => {
        touchedFields.add(select.id);

        if (select === degreeSelect) {
          handleDegreeChange();
        } else if (select === departmentSelect) {
          handleDepartmentChange();
        } else if (select === gradingTypeSelect) {
          handleGradingTypeChange();
        }

        validateSingleField(select.id);
        updateFormState();
      });

      select.addEventListener('blur', () => {
        touchedFields.add(select.id);
        validateSingleField(select.id);
        updateFormState();
      });
    });

    // Job role checkboxes
    jobRolesContainer.addEventListener('change', (e) => {
      if (e.target.name === 'preferredRoles') {
        touchedFields.add('preferredRoles');
        // Toggle selected card styling
        const card = e.target.closest('.role-checkbox-card');
        if (card) {
          if (e.target.checked) {
            card.classList.add('selected');
          } else {
            card.classList.remove('selected');
          }
        }
        validateJobRoles();
        updateFormState();
      }
    });

    // Form submit button
    form.addEventListener('submit', handleFormSubmit);

    // Modal close button
    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', closeModal);
    }

    // Close modal on backdrop click
    if (responseModal) {
      responseModal.addEventListener('click', (e) => {
        if (e.target === responseModal) {
          closeModal();
        }
      });
    }

    // Keyboard support: prevent submitting on Enter if form is invalid
    form.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        const { isValid } = validateAllFields();
        if (!isValid) {
          e.preventDefault();
        }
      }
    });
  }

  // ==========================================================================
  // DYNAMIC CONDITIONAL LOGIC
  // ==========================================================================

  function handleDegreeChange() {
    const isOther = degreeSelect.value === 'Other';
    if (isOther) {
      degreeOtherGroup.classList.remove('hidden');
      degreeOtherInput.setAttribute('required', 'required');
    } else {
      degreeOtherGroup.classList.add('hidden');
      degreeOtherInput.removeAttribute('required');
      degreeOtherInput.value = '';
      clearFieldError('degreeOther');
    }
  }

  function handleDepartmentChange() {
    const isOther = departmentSelect.value === 'Other';
    if (isOther) {
      departmentOtherGroup.classList.remove('hidden');
      departmentOtherInput.setAttribute('required', 'required');
    } else {
      departmentOtherGroup.classList.add('hidden');
      departmentOtherInput.removeAttribute('required');
      departmentOtherInput.value = '';
      clearFieldError('departmentOther');
    }
  }

  function handleGradingTypeChange() {
    const type = gradingTypeSelect.value;
    if (type === 'CGPA') {
      cgpaHint.textContent = 'Scale: 0.00 to 10.00 (e.g., 8.65)';
      cgpaOrPercentageInput.setAttribute('placeholder', 'Enter CGPA (e.g. 8.65)');
      cgpaOrPercentageInput.setAttribute('step', '0.01');
      cgpaOrPercentageInput.setAttribute('max', '10');
    } else {
      cgpaHint.textContent = 'Scale: 0.00 to 100.00% (e.g., 86.5)';
      cgpaOrPercentageInput.setAttribute('placeholder', 'Enter Percentage (e.g. 86.5)');
      cgpaOrPercentageInput.setAttribute('step', '0.01');
      cgpaOrPercentageInput.setAttribute('max', '100');
    }
    // Revalidate CGPA field on type change if it has a value
    if (cgpaOrPercentageInput.value) {
      validateSingleField('cgpaOrPercentage');
    }
  }

  // ==========================================================================
  // VALIDATION RULES
  // ==========================================================================

  function getFieldErrors() {
    const errors = {};

    // 1. Full Name
    const nameVal = fullNameInput.value.trim();
    if (!nameVal) {
      errors.fullName = 'Full Name is required.';
    } else if (nameVal.length < 2) {
      errors.fullName = 'Name must be at least 2 characters.';
    } else if (!/^[A-Za-z\s.'-]+$/.test(nameVal)) {
      errors.fullName = 'Full Name should only contain letters and spaces.';
    }

    // 2. Email ID
    const emailVal = emailInput.value.trim();
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailVal) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(emailVal)) {
      errors.email = 'Please provide a valid email address (e.g., name@domain.com).';
    }

    // 3. Contact Number
    const phoneVal = contactNumberInput.value.trim().replace(/[\s-]/g, '');
    const phoneRegex = /^[0-9]{10,14}$/;
    if (!phoneVal) {
      errors.contactNumber = 'Contact Number is required.';
    } else if (!phoneRegex.test(phoneVal)) {
      errors.contactNumber = 'Enter a valid 10-digit mobile number.';
    }

    // 4. College Name
    const collegeVal = collegeNameInput.value.trim();
    if (!collegeVal) {
      errors.collegeName = 'College / University Name is required.';
    } else if (collegeVal.length < 3) {
      errors.collegeName = 'College name must be at least 3 characters.';
    }

    // 5. Degree
    const degreeVal = degreeSelect.value;
    if (!degreeVal) {
      errors.degree = 'Please select your degree.';
    } else if (degreeVal === 'Other') {
      const otherVal = degreeOtherInput.value.trim();
      if (!otherVal) {
        errors.degreeOther = 'Please specify your degree name.';
      } else if (otherVal.length < 2) {
        errors.degreeOther = 'Degree specification must be at least 2 characters.';
      }
    }

    // 6. Department
    const deptVal = departmentSelect.value;
    if (!deptVal) {
      errors.department = 'Please select your department.';
    } else if (deptVal === 'Other') {
      const otherVal = departmentOtherInput.value.trim();
      if (!otherVal) {
        errors.departmentOther = 'Please specify your department name.';
      } else if (otherVal.length < 2) {
        errors.departmentOther = 'Department specification must be at least 2 characters.';
      }
    }

    // 7. Location
    const locVal = locationInput.value.trim();
    if (!locVal) {
      errors.location = 'Current location / city is required.';
    } else if (locVal.length < 2) {
      errors.location = 'Location must be at least 2 characters.';
    }

    // 8. Year of Passing
    const yearVal = passingYearSelect.value;
    if (!yearVal) {
      errors.passingYear = 'Please select your year of passing.';
    }

    // 9. Grading Type & CGPA / Percentage
    const gradingType = gradingTypeSelect.value;
    const cgpaVal = cgpaOrPercentageInput.value.trim();
    if (!gradingType) {
      errors.gradingType = 'Grading type is required.';
    }
    if (!cgpaVal) {
      errors.cgpaOrPercentage = `Please enter your ${gradingType || 'CGPA'}.`;
    } else {
      const num = parseFloat(cgpaVal);
      if (isNaN(num)) {
        errors.cgpaOrPercentage = 'Please enter a valid numeric value.';
      } else if (gradingType === 'CGPA') {
        if (num < 0 || num > 10.0) {
          errors.cgpaOrPercentage = 'CGPA must be between 0.00 and 10.00.';
        }
      } else {
        if (num < 0 || num > 100.0) {
          errors.cgpaOrPercentage = 'Percentage must be between 0 and 100%.';
        }
      }
    }

    // 10. 12th Standard Percentage
    const twVal = twelfthPercentageInput.value.trim();
    if (!twVal) {
      errors.twelfthPercentage = '12th Standard percentage is required.';
    } else {
      const num = parseFloat(twVal);
      if (isNaN(num) || num < 0 || num > 100.0) {
        errors.twelfthPercentage = 'Please enter a valid percentage between 0 and 100.';
      }
    }

    // 11. 10th Standard Percentage
    const tenVal = tenthPercentageInput.value.trim();
    if (!tenVal) {
      errors.tenthPercentage = '10th Standard percentage is required.';
    } else {
      const num = parseFloat(tenVal);
      if (isNaN(num) || num < 0 || num > 100.0) {
        errors.tenthPercentage = 'Please enter a valid percentage between 0 and 100.';
      }
    }

    // 12. Number of Arrears
    const arrVal = arrearsSelect.value;
    if (arrVal === '' || arrVal === null || arrVal === undefined) {
      errors.arrears = 'Please select your arrears count.';
    }

    // 13. Preferred Job Roles
    const selectedRoles = getSelectedRoles();
    if (selectedRoles.length === 0) {
      errors.preferredRoles = 'Please select at least one preferred job role.';
    }

    return errors;
  }

  function getSelectedRoles() {
    const checked = jobRolesContainer.querySelectorAll('input[name="preferredRoles"]:checked');
    return Array.from(checked).map(c => c.value);
  }

  function validateSingleField(fieldId) {
    const errors = getFieldErrors();
    const errorMsg = errors[fieldId];

    if (errorMsg && touchedFields.has(fieldId)) {
      setFieldError(fieldId, errorMsg);
    } else {
      clearFieldError(fieldId);
    }
  }

  function validateJobRoles() {
    const errors = getFieldErrors();
    const errorContainer = document.getElementById('preferredRolesError');
    if (!errorContainer) return;

    if (errors.preferredRoles && touchedFields.has('preferredRoles')) {
      errorContainer.textContent = errors.preferredRoles;
      errorContainer.classList.add('visible');
    } else {
      errorContainer.textContent = '';
      errorContainer.classList.remove('visible');
    }
  }

  function setFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}Error`);

    if (input) {
      input.classList.add('input-invalid');
      input.classList.remove('input-valid');
      input.setAttribute('aria-invalid', 'true');
    }

    if (errorEl) {
      errorEl.textContent = message;
      errorEl.classList.add('visible');
    }
  }

  function clearFieldError(fieldId) {
    const input = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}Error`);

    if (input) {
      input.classList.remove('input-invalid');
      // Only add valid class if touched and has value
      if (touchedFields.has(fieldId) && input.value) {
        input.classList.add('input-valid');
      }
      input.removeAttribute('aria-invalid');
    }

    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.remove('visible');
    }
  }

  function validateAllFields() {
    const errors = getFieldErrors();
    const errorKeys = Object.keys(errors);
    const isValid = errorKeys.length === 0;

    return {
      isValid,
      errors,
      errorCount: errorKeys.length
    };
  }

  // ==========================================================================
  // REAL-TIME STATE & SUBMIT BUTTON SYNC
  // ==========================================================================

  function updateFormState() {
    const errors = getFieldErrors();
    const activeErrors = Object.keys(errors);

    // Calculate total mandatory fields count dynamically
    let totalFields = 13; // Base fields
    if (degreeSelect.value === 'Other') totalFields++;
    if (departmentSelect.value === 'Other') totalFields++;

    const completedFields = Math.max(0, totalFields - activeErrors.length);
    const percentComplete = Math.round((completedFields / totalFields) * 100);

    // Update progress pill & bar
    if (progressBadge) {
      if (activeErrors.length === 0) {
        progressBadge.className = 'progress-badge complete';
        progressBadge.innerHTML = `<span class="icon-check">✓</span> All Required Details Complete`;
      } else {
        progressBadge.className = 'progress-badge incomplete';
        progressBadge.textContent = `${completedFields} of ${totalFields} fields completed`;
      }
    }

    if (progressBarFill) {
      progressBarFill.style.width = `${percentComplete}%`;
      if (percentComplete === 100) {
        progressBarFill.classList.add('progress-ready');
      } else {
        progressBarFill.classList.remove('progress-ready');
      }
    }

    // Submit button state sync
    const isFormFullyValid = activeErrors.length === 0;

    if (isFormFullyValid) {
      submitBtn.removeAttribute('disabled');
      submitBtn.classList.remove('btn-disabled');
      submitBtn.classList.add('btn-ready');
      submitBtn.setAttribute('aria-disabled', 'false');

      if (statusNotice) {
        statusNotice.className = 'status-notice notice-ready';
        statusNotice.innerHTML = `
          <svg class="notice-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
          </svg>
          <span>All mandatory fields are valid. Ready to submit registration!</span>
        `;
      }
    } else {
      submitBtn.setAttribute('disabled', 'disabled');
      submitBtn.classList.add('btn-disabled');
      submitBtn.classList.remove('btn-ready');
      submitBtn.setAttribute('aria-disabled', 'true');

      if (statusNotice) {
        statusNotice.className = 'status-notice notice-pending';
        statusNotice.innerHTML = `
          <svg class="notice-icon" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
          </svg>
          <span>Please complete all required fields marked with <strong class="text-danger">*</strong> to activate the submit button.</span>
        `;
      }
    }
  }

  // ==========================================================================
  // FORM SUBMISSION HANDLER
  // ==========================================================================

  async function handleFormSubmit(e) {
    e.preventDefault();

    // Mark all fields as touched to display errors if any
    const allFieldIds = [
      'fullName', 'email', 'contactNumber', 'collegeName', 'degree',
      'department', 'location', 'passingYear', 'gradingType',
      'cgpaOrPercentage', 'twelfthPercentage', 'tenthPercentage', 'arrears',
      'preferredRoles'
    ];
    if (degreeSelect.value === 'Other') allFieldIds.push('degreeOther');
    if (departmentSelect.value === 'Other') allFieldIds.push('departmentOther');

    allFieldIds.forEach(id => touchedFields.add(id));

    // Full validation pass
    const { isValid, errors } = validateAllFields();

    if (!isValid) {
      // Highlight errors
      Object.keys(errors).forEach(fieldId => {
        if (fieldId === 'preferredRoles') {
          validateJobRoles();
        } else {
          setFieldError(fieldId, errors[fieldId]);
        }
      });

      // Scroll to the first invalid field
      const firstErrorField = Object.keys(errors)[0];
      const targetElement = document.getElementById(firstErrorField) || jobRolesContainer;
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof targetElement.focus === 'function') targetElement.focus();
      }
      return;
    }

    // Collect clean form values
    const formData = {
      fullName: fullNameInput.value,
      email: emailInput.value,
      contactNumber: contactNumberInput.value,
      collegeName: collegeNameInput.value,
      degree: degreeSelect.value,
      degreeOther: degreeOtherInput ? degreeOtherInput.value : '',
      department: departmentSelect.value,
      departmentOther: departmentOtherInput ? departmentOtherInput.value : '',
      location: locationInput.value,
      yearOfPassing: passingYearSelect.value,
      gradingType: gradingTypeSelect.value,
      cgpaOrPercentage: cgpaOrPercentageInput.value,
      twelfthPercentage: twelfthPercentageInput.value,
      tenthPercentage: tenthPercentageInput.value,
      numberOfArrears: arrearsSelect.value,
      preferredRoles: getSelectedRoles()
    };

    // Show submitting state on button
    setSubmittingState(true);

    try {
      const result = await submissionService.submitRegistration(formData);

      setSubmittingState(false);

      if (result.isNotConfigured) {
        // Form is 100% valid, but Google Sheets URL is waiting to be added
        showModal({
          type: 'ready-to-connect',
          title: 'Form Validation Successful!',
          subtitle: 'Google Sheets Integration Ready',
          message: 'Your registration details have been verified and all mandatory validation checks passed.',
          notice: 'Note: The Google Apps Script Web App URL has not been plugged in yet. Update <code>GOOGLE_APPS_SCRIPT_URL</code> in <strong>config.js</strong> to start logging responses directly to your Google Sheet.',
          data: result.payload,
          buttonText: 'Got it, Keep Editing'
        });
      } else if (result.success) {
        // Submission succeeded — display Google Forms-style confirmation screen in place of form
        showConfirmationScreen();
      } else {
        // Network or execution failure
        showModal({
          type: 'error',
          title: 'Submission Issue',
          subtitle: 'Connection Error',
          message: result.message || 'An error occurred while transmitting data. All your entered details have been preserved.',
          buttonText: 'Retry'
        });
      }
    } catch (err) {
      setSubmittingState(false);
      showModal({
        type: 'error',
        title: 'Unexpected Error',
        subtitle: 'System Notice',
        message: 'An unexpected error occurred. Your entered data has been preserved. Please try again.',
        buttonText: 'Dismiss'
      });
    }
  }

  function showConfirmationScreen() {
    // Hide the registration form
    if (form) {
      form.classList.add('hidden');
      form.style.display = 'none';
    }

    // Display Google Forms-style confirmation screen in place of form
    if (confirmationScreen) {
      confirmationScreen.classList.remove('hidden');
      confirmationScreen.style.display = 'flex';
      confirmationScreen.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  function setSubmittingState(isSubmitting) {
    if (isSubmitting) {
      submitBtn.setAttribute('disabled', 'disabled');
      submitBtn.classList.add('submitting');
      submitBtnText.textContent = 'Submitting Details...';
      submitBtnSpinner.classList.remove('hidden');
    } else {
      submitBtn.classList.remove('submitting');
      submitBtnText.textContent = 'Submit Registration';
      submitBtnSpinner.classList.add('hidden');
      updateFormState();
    }
  }

  function resetForm() {
    form.reset();
    touchedFields.clear();
    degreeOtherGroup.classList.add('hidden');
    departmentOtherGroup.classList.add('hidden');

    // Remove selected class from role cards
    document.querySelectorAll('.role-checkbox-card.selected').forEach(card => {
      card.classList.remove('selected');
    });

    // Clear all validation classes
    document.querySelectorAll('.input-valid, .input-invalid').forEach(el => {
      el.classList.remove('input-valid', 'input-invalid');
    });

    document.querySelectorAll('.field-error-message').forEach(el => {
      el.textContent = '';
      el.classList.remove('visible');
    });

    handleGradingTypeChange();
    updateFormState();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ==========================================================================
  // MODAL LOGIC
  // ==========================================================================

  let modalCloseCallback = null;

  function showModal({ type, title, subtitle, message, notice, data, buttonText, onClose }) {
    if (!responseModal) return;

    modalCloseCallback = onClose || null;

    modalTitle.textContent = title;
    modalMessage.innerHTML = `
      <p class="modal-subheading">${subtitle || ''}</p>
      <p class="modal-desc">${message || ''}</p>
      ${notice ? `<div class="modal-notice-box">${notice}</div>` : ''}
    `;

    modalCloseBtn.textContent = buttonText || 'Close';

    // Modal icon
    if (type === 'success') {
      modalIcon.className = 'modal-icon-badge success';
      modalIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;
    } else if (type === 'ready-to-connect') {
      modalIcon.className = 'modal-icon-badge ready';
      modalIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
      `;
    } else {
      modalIcon.className = 'modal-icon-badge error';
      modalIcon.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
      `;
    }

    // Modal payload preview
    if (data && modalDataList && modalDataPreview) {
      modalDataPreview.classList.remove('hidden');
      modalDataList.innerHTML = '';

      const displayItems = [
        { label: 'Candidate Name', val: data.fullName },
        { label: 'Email ID', val: data.email },
        { label: 'Contact', val: data.contactNumber },
        { label: 'College', val: data.collegeName },
        { label: 'Degree & Dept', val: `${data.degree} • ${data.department}` },
        { label: 'Location', val: data.location },
        { label: 'Year & Score', val: `${data.yearOfPassing} • ${data.gradingType}: ${data.cgpaOrPercentage}` },
        { label: '12th / 10th', val: `${data.twelfthPercentage}% / ${data.tenthPercentage}%` },
        { label: 'Arrears', val: data.numberOfArrears },
        { label: 'Roles Preferred', val: data.preferredJobRoles },
        { label: 'Timestamp', val: data.submissionTimestamp }
      ];

      displayItems.forEach(item => {
        const row = document.createElement('div');
        row.className = 'preview-data-row';
        row.innerHTML = `
          <span class="preview-key">${item.label}:</span>
          <span class="preview-val">${item.val}</span>
        `;
        modalDataList.appendChild(row);
      });
    } else if (modalDataPreview) {
      modalDataPreview.classList.add('hidden');
    }

    responseModal.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (!responseModal) return;
    responseModal.classList.remove('open');
    document.body.style.overflow = '';
    if (typeof modalCloseCallback === 'function') {
      const cb = modalCloseCallback;
      modalCloseCallback = null;
      cb();
    }
  }
});
