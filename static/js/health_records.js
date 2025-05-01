document.addEventListener("DOMContentLoaded", function() {
  // Debug mode - set to true to see console logs
  const DEBUG = true;

  function log(...args) {
      if (DEBUG) console.log(...args);
  }

  log("Health Records JS loaded");

  // Safely get DOM element - returns null if element doesn't exist
  function getElement(id) {
      return document.getElementById(id);
  }

  // Safely add event listener - only adds if element exists
  function addEventListenerSafe(element, event, handler) {
      if (element) {
          element.addEventListener(event, handler);
          return true;
      }
      return false;
  }

  // Set current date
  const currentDateElement = getElement("current-date");
  if (currentDateElement) {
      const currentDate = new Date();
      const dateOptions = { year: "numeric", month: "long", day: "numeric" };
      currentDateElement.textContent = `Today's date: ${currentDate.toLocaleDateString("en-US", dateOptions)}`;
  }

  // DOM Elements
  const mainContent = getElement("main-content");
  const historyPage = getElement("history-page");
  const seeHistoryBtn = getElement("seeHistoryBtn");
  const backToMainBtn = getElement("backToMainBtn");
  const editHealthRecordsBtn = getElement("editHealthRecordsBtn");
  const openAddHealthRecordBtn = getElement("openAddHealthRecord");
  const addHealthRecordModal = getElement("addHealthRecordModal");
  const addHealthRecordForm = getElement("addHealthRecordForm");
  const cancelAddHealthRecordBtn = getElement("cancelAddHealthRecord");
  const recordCategory = getElement("recordCategory");
  const vitalSignsOptions = getElement("vitalSignsOptions");
  const biometricsOptions = getElement("biometricsOptions");
  const valueInput = getElement("valueInput");
  const bloodPressureInputs = getElement("bloodPressureInputs");
  const medicalNotesInputs = getElement("medicalNotesInputs");
  const vitalSignType = getElement("vitalSignType");
  const biometricType = getElement("biometricType");
  const editHealthRecordsModal = getElement("editHealthRecordsModal");
  const healthRecordSelect = getElement("healthRecordSelect");
  const editHealthRecordForm = getElement("editHealthRecordForm");
  const editFormFields = getElement("editFormFields");
  const noRecordSelected = getElement("noRecordSelected");
  const cancelEditHealthRecordBtn = getElement("cancelEditHealthRecord");
  const deleteHealthRecordBtn = getElement("deleteHealthRecordBtn");
  const deleteConfirmationModal = getElement("deleteConfirmationModal");
  const cancelDeleteBtn = getElement("cancelDeleteBtn");
  const confirmDeleteBtn = getElement("confirmDeleteBtn");
  const editModalCloseBtn = getElement("editModalCloseBtn");
  const premiumUpgradeModal = getElement("premiumUpgradeModal");
  const closePremiumModal = getElement("closePremiumModal");
  const upgradePremiumBtn = getElement("upgradePremiumBtn");
  const addVitalSignBtn = getElement("addVitalSignBtn");
  const addBiometricBtn = getElement("addBiometricBtn");
  const addMedicalNoteBtn = getElement("addMedicalNoteBtn");

  // Data storage
  let healthRecords = [];
  let selectedRecordId = null;

  // Icons for different health record types
  const icons = {
      // Vital Signs
      "blood-pressure": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>`,
      "temperature": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`,
      "heart-rate": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>`,
      "respiratory-rate": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>`,
      "oxygen-saturation": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>`,
      
      // Biometrics
      "weight": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>`,
      "height": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>`,
      "bmi": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>`,
      "blood-sugar": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>`,
      
      // Medical Notes
      "medical-notes": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>`,
      
      // Default icon
      "default": `<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>`
  };

  // Get icon for a record type
  function getIcon(record) {
      if (record.category === "medical-notes") {
          return icons["medical-notes"];
      }
      
      return icons[record.type] || icons["default"];
  }

  // Format date for display
  function formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  // Format time with AM/PM
  function formatTimeWithAMPM(timeString) {
      if (!timeString) return "";
      
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      
      return `${hour12}:${minutes} ${ampm}`;
  }

  // Format date and time for "Last taken" display
  function formatLastTaken(dateString, timeString) {
      const date = formatDate(dateString);
      const time = formatTimeWithAMPM(timeString);
      return `${date}, ${time}`;
  }

  // Category-specific buttons
  addEventListenerSafe(addVitalSignBtn, "click", () => {
      openAddModal("vital-signs");
  });

  addEventListenerSafe(addBiometricBtn, "click", () => {
      openAddModal("biometrics");
  });

  addEventListenerSafe(addMedicalNoteBtn, "click", () => {
      openAddModal("medical-notes");
  });

  // Open add modal with pre-selected category
  function openAddModal(category = null) {
      log("Opening add modal with category:", category);
      
      if (!addHealthRecordModal) {
          log("Error: Add health record modal not found");
          return;
      }
      
      // Check if we've reached the limit
      const uniqueVitalSigns = new Set(
          healthRecords
              .filter(record => record.category === "vital-signs")
              .map(record => record.type)
      ).size;
      
      const uniqueBiometrics = new Set(
          healthRecords
              .filter(record => record.category === "biometrics")
              .map(record => record.type)
      ).size;
      
      const medicalNotesCount = healthRecords.filter(
          record => record.category === "medical-notes"
      ).length;
      
      const totalRecordTypes = uniqueVitalSigns + uniqueBiometrics + (medicalNotesCount > 0 ? 1 : 0);
      
      if (totalRecordTypes >= 3) {
          showPremiumModal();
          return;
      }
      
      // Reset form
      if (addHealthRecordForm) {
          addHealthRecordForm.reset();
      }
      
      // Set default date and time
      const now = new Date();
      const formattedDate = now.toISOString().split("T")[0];
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      const formattedTime = `${hours}:${minutes}`;
      
      const dateInput = getElement("dateTaken");
      const timeInput = getElement("timeTaken");
      
      if (dateInput) dateInput.value = formattedDate;
      if (timeInput) timeInput.value = formattedTime;
      
      // Pre-select category if provided
      if (category && recordCategory) {
          recordCategory.value = category;
          handleCategoryChange();
      }
      
      // Show modal
      addHealthRecordModal.classList.remove("hidden");
      addHealthRecordModal.classList.add("flex");
  }

  // Close add modal
  function closeAddModal() {
      log("Closing add modal");
      
      if (!addHealthRecordModal) {
          log("Error: Add health record modal not found");
          return;
      }
      
      addHealthRecordModal.classList.add("hidden");
      addHealthRecordModal.classList.remove("flex");
      
      if (addHealthRecordForm) {
          addHealthRecordForm.reset();
      }
  }

  // Show premium upgrade modal
  function showPremiumModal() {
      log("Showing premium modal");
      
      if (!premiumUpgradeModal) {
          log("Error: Premium upgrade modal not found");
          alert("You've reached the maximum number of health record types (3). Please upgrade to premium.");
          return;
      }
      
      premiumUpgradeModal.classList.remove("hidden");
      premiumUpgradeModal.classList.add("flex");
  }

  // Close premium modal
  function closePremiumModalFn() {
      log("Closing premium modal");
      
      if (!premiumUpgradeModal) {
          log("Error: Premium upgrade modal not found");
          return;
      }
      
      premiumUpgradeModal.classList.add("hidden");
      premiumUpgradeModal.classList.remove("flex");
  }

  // Handle category change
  function handleCategoryChange() {
      log("Handling category change");
      
      if (!recordCategory) {
          log("Error: Record category element not found");
          return;
      }
      
      const category = recordCategory.value;
      
      // Hide all category-specific inputs
      if (vitalSignsOptions) vitalSignsOptions.classList.add("hidden");
      if (biometricsOptions) biometricsOptions.classList.add("hidden");
      if (valueInput) valueInput.classList.add("hidden");
      if (bloodPressureInputs) bloodPressureInputs.classList.add("hidden");
      if (medicalNotesInputs) medicalNotesInputs.classList.add("hidden");
      
      // Show relevant inputs based on category
      if (category === "vital-signs") {
          if (vitalSignsOptions) vitalSignsOptions.classList.remove("hidden");
          if (valueInput) valueInput.classList.remove("hidden");
          handleVitalSignTypeChange();
      } else if (category === "biometrics") {
          if (biometricsOptions) biometricsOptions.classList.remove("hidden");
          if (valueInput) valueInput.classList.remove("hidden");
      } else if (category === "medical-notes") {
          if (medicalNotesInputs) medicalNotesInputs.classList.remove("hidden");
      }
  }

  // Handle vital sign type change
  function handleVitalSignTypeChange() {
      log("Handling vital sign type change");
      
      if (!vitalSignType) {
          log("Error: Vital sign type element not found");
          return;
      }
      
      const type = vitalSignType.value;
      const recordValueInput = getElement("recordValue");
      
      // Hide blood pressure inputs by default
      if (bloodPressureInputs) bloodPressureInputs.classList.add("hidden");
      
      // Show blood pressure inputs if blood pressure is selected
      if (type === "blood-pressure") {
          if (bloodPressureInputs) bloodPressureInputs.classList.remove("hidden");
          if (recordValueInput) recordValueInput.classList.add("hidden");
      } else {
          if (recordValueInput) recordValueInput.classList.remove("hidden");
      }
  }

  // Open edit modal
  function openEditModal() {
      log("Opening edit modal");
      
      if (!editHealthRecordsModal) {
          log("Error: Edit health records modal not found");
          return;
      }
      
      // Populate select with health records
      populateHealthRecordSelect();
      
      // Show modal
      editHealthRecordsModal.classList.remove("hidden");
      editHealthRecordsModal.classList.add("flex");
  }

  // Close edit modal
  function closeEditModal() {
      log("Closing edit modal");
      
      if (!editHealthRecordsModal) {
          log("Error: Edit health records modal not found");
          return;
      }
      
      editHealthRecordsModal.classList.add("hidden");
      editHealthRecordsModal.classList.remove("flex");
      
      if (editHealthRecordForm) editHealthRecordForm.classList.add("hidden");
      if (noRecordSelected) noRecordSelected.classList.remove("hidden");
      if (editModalCloseBtn) editModalCloseBtn.classList.remove("hidden");
      
      selectedRecordId = null;
  }

  // Open delete confirmation modal
  function openDeleteModal() {
      log("Opening delete confirmation modal");
      
      if (!deleteConfirmationModal) {
          log("Error: Delete confirmation modal not found");
          return;
      }
      
      deleteConfirmationModal.classList.remove("hidden");
      deleteConfirmationModal.classList.add("flex");
  }

  // Close delete confirmation modal
  function closeDeleteModal() {
      log("Closing delete confirmation modal");
      
      if (!deleteConfirmationModal) {
          log("Error: Delete confirmation modal not found");
          return;
      }
      
      deleteConfirmationModal.classList.add("hidden");
      deleteConfirmationModal.classList.remove("flex");
  }

  // Populate health record select
  function populateHealthRecordSelect() {
      log("Populating health record select");
      
      if (!healthRecordSelect) {
          log("Error: Health record select element not found");
          return;
      }
      
      // Clear existing options except the first one
      while (healthRecordSelect.options.length > 1) {
          healthRecordSelect.remove(1);
      }
      
      // Add all health records to select
      healthRecords.forEach(record => {
          const option = document.createElement("option");
          option.value = record.id;
          
          let label = "";
          if (record.category === "vital-signs" || record.category === "biometrics") {
              const typeLabel = record.type.replace(/-/g, " ");
              label = `${typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1)} (${formatDate(record.date)})`;
          } else if (record.category === "medical-notes") {
              label = `${record.subject} (${formatDate(record.date)})`;
          }
          
          option.textContent = label;
          healthRecordSelect.appendChild(option);
      });
  }

  // Handle health record selection
  function handleHealthRecordSelection() {
      log("Handling health record selection");
      
      if (!healthRecordSelect) {
          log("Error: Health record select element not found");
          return;
      }
      
      const recordId = parseInt(healthRecordSelect.value);
      
      if (recordId) {
          selectedRecordId = recordId;
          const record = healthRecords.find(r => r.id === recordId);
          
          if (record) {
              // Show form, hide message
              if (editHealthRecordForm) editHealthRecordForm.classList.remove("hidden");
              if (noRecordSelected) noRecordSelected.classList.add("hidden");
              if (editModalCloseBtn) editModalCloseBtn.classList.add("hidden");
              
              // Populate form fields based on record type
              populateEditForm(record);
          }
      } else {
          // Hide form, show message
          if (editHealthRecordForm) editHealthRecordForm.classList.add("hidden");
          if (noRecordSelected) noRecordSelected.classList.remove("hidden");
          if (editModalCloseBtn) editModalCloseBtn.classList.remove("hidden");
          selectedRecordId = null;
      }
  }

  // Populate edit form with record data
  function populateEditForm(record) {
      log("Populating edit form with record:", record);
      
      if (!editFormFields) {
          log("Error: Edit form fields container not found");
          return;
      }
      
      // Clear existing fields
      editFormFields.innerHTML = "";
      
      // Add common fields
      const dateField = createFormField("date", "Date", record.date, "date");
      const timeField = createFormField("time", "Time", record.time, "time");
      
      editFormFields.appendChild(dateField);
      editFormFields.appendChild(timeField);
      
      // Add category-specific fields
      if (record.category === "vital-signs" || record.category === "biometrics") {
          const typeLabel = record.type.replace(/-/g, " ");
          const typeLabelCapitalized = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);
          
          // Add type as hidden field
          const typeField = document.createElement("input");
          typeField.type = "hidden";
          typeField.name = "type";
          typeField.value = record.type;
          editFormFields.appendChild(typeField);
          
          // Add category as hidden field
          const categoryField = document.createElement("input");
          categoryField.type = "hidden";
          categoryField.name = "category";
          categoryField.value = record.category;
          editFormFields.appendChild(categoryField);
          
          if (record.type === "blood-pressure") {
              // Add blood pressure fields
              const bpContainer = document.createElement("div");
              bpContainer.className = "mb-4";
              
              const bpLabel = document.createElement("label");
              bpLabel.className = "block text-sm font-medium text-gray-700 mb-2";
              bpLabel.textContent = typeLabelCapitalized;
              
              const bpInputsContainer = document.createElement("div");
              bpInputsContainer.className = "flex space-x-2";
              
              const systolicContainer = document.createElement("div");
              systolicContainer.className = "w-1/2";
              
              const systolicLabel = document.createElement("label");
              systolicLabel.className = "block text-xs font-medium text-gray-700";
              systolicLabel.textContent = "Systolic";
              
              const systolicInput = document.createElement("input");
              systolicInput.type = "number";
              systolicInput.name = "systolic";
              systolicInput.value = record.systolic;
              systolicInput.className = "mt-1 block w-full border border-gray-300 rounded-md p-2";
              
              systolicContainer.appendChild(systolicLabel);
              systolicContainer.appendChild(systolicInput);
              
              const diastolicContainer = document.createElement("div");
              diastolicContainer.className = "w-1/2";
              
              const diastolicLabel = document.createElement("label");
              diastolicLabel.className = "block text-xs font-medium text-gray-700";
              diastolicLabel.textContent = "Diastolic";
              
              const diastolicInput = document.createElement("input");
              diastolicInput.type = "number";
              diastolicInput.name = "diastolic";
              diastolicInput.value = record.diastolic;
              diastolicInput.className = "mt-1 block w-full border border-gray-300 rounded-md p-2";
              
              diastolicContainer.appendChild(diastolicLabel);
              diastolicContainer.appendChild(diastolicInput);
              
              bpInputsContainer.appendChild(systolicContainer);
              bpInputsContainer.appendChild(diastolicContainer);
              
              bpContainer.appendChild(bpLabel);
              bpContainer.appendChild(bpInputsContainer);
              
              editFormFields.appendChild(bpContainer);
          } else {
              // Add value field
              const valueField = createFormField("value", typeLabelCapitalized, record.value, "text");
              editFormFields.appendChild(valueField);
          }
      } else if (record.category === "medical-notes") {
          // Add category as hidden field
          const categoryField = document.createElement("input");
          categoryField.type = "hidden";
          categoryField.name = "category";
          categoryField.value = record.category;
          editFormFields.appendChild(categoryField);
          
          // Add subject field
          const subjectField = createFormField("subject", "Subject", record.subject, "text");
          editFormFields.appendChild(subjectField);
          
          // Add body field
          const bodyContainer = document.createElement("div");
          bodyContainer.className = "mb-4";
          
          const bodyLabel = document.createElement("label");
          bodyLabel.className = "block text-sm font-medium text-gray-700 mb-2";
          bodyLabel.textContent = "Notes";
          
          const bodyTextarea = document.createElement("textarea");
          bodyTextarea.name = "body";
          bodyTextarea.value = record.body || "";
          bodyTextarea.rows = 3;
          bodyTextarea.className = "mt-1 block w-full border border-gray-300 rounded-md p-2";
          
          bodyContainer.appendChild(bodyLabel);
          bodyContainer.appendChild(bodyTextarea);
          
          editFormFields.appendChild(bodyContainer);
      }
  }

  // Create form field
  function createFormField(name, label, value, type = "text") {
      const container = document.createElement("div");
      container.className = "mb-4";
      
      const labelElement = document.createElement("label");
      labelElement.className = "block text-sm font-medium text-gray-700 mb-2";
      labelElement.textContent = label;
      
      const input = document.createElement("input");
      input.type = type;
      input.name = name;
      input.value = value;
      input.className = "mt-1 block w-full border border-gray-300 rounded-md p-2";
      
      container.appendChild(labelElement);
      container.appendChild(input);
      
      return container;
  }

  // Load health records from server
  function loadHealthRecords() {
      log("Loading health records from server");
      fetch("/api/health-records")
          .then(response => {
              if (!response.ok) {
                  throw new Error(`HTTP error! Status: ${response.status}`);
              }
              return response.json();
          })
          .then(data => {
              log("Received health records from server:", data);
              healthRecords = data;
              renderHealthRecords();
              renderHealthRecordsHistory();
          })
          .catch(error => {
              log("Error loading health records:", error);
              healthRecords = [];
              renderHealthRecords();
              renderHealthRecordsHistory();
          });
  }

  // Render health records
  function renderHealthRecords() {
      log("Rendering health records");
      
      // Filter records by category
      const vitalSigns = healthRecords.filter(record => record.category === "vital-signs");
      const biometrics = healthRecords.filter(record => record.category === "biometrics");
      const medicalNotes = healthRecords.filter(record => record.category === "medical-notes");
      
      // Render each category
      renderCategoryRecords("vital-signs", vitalSigns);
      renderCategoryRecords("biometrics", biometrics);
      renderCategoryRecords("medical-notes", medicalNotes);
  }

  // Render records for a specific category
  function renderCategoryRecords(category, records) {
      log(`Rendering ${category} records:`, records);
      
      const container = getElement(`${category}-container`);
      const emptyState = getElement(`${category}-empty-state`);
      
      if (!container) {
          log(`Error: ${category} container not found`);
          return;
      }
      
      if (!emptyState) {
          log(`Error: ${category} empty state not found`);
          // Continue anyway
      }
      
      // Clear existing records
      if (container) {
          Array.from(container.children).forEach(child => {
              if (emptyState && child !== emptyState) {
                  child.remove();
              } else if (!emptyState) {
                  child.remove();
              }
          });
      }
      
      // Show empty state if no records
      if (records.length === 0) {
          if (emptyState) emptyState.style.display = "block";
          return;
      }
      
      // Hide empty state
      if (emptyState) emptyState.style.display = "none";
      
      // Group records by type
      const recordsByType = {};
      
      records.forEach(record => {
          const key = record.type || "note";
          if (!recordsByType[key]) {
              recordsByType[key] = [];
          }
          recordsByType[key].push(record);
      });
      
      // Render each type
      Object.entries(recordsByType).forEach(([type, typeRecords]) => {
          // Sort records by date (newest first)
          typeRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
          
          // Get the most recent record
          const latestRecord = typeRecords[0];
          
          // Create record element
          const recordElement = createRecordElement(latestRecord, category);
          container.appendChild(recordElement);
      });
  }

  // Create record element
  function createRecordElement(record, category) {
      const div = document.createElement("div");
      div.className = "p-4 flex items-center justify-between health-record-card";
      div.dataset.id = record.id;
      
      let content = "";
      
      if (category === "vital-signs" || category === "biometrics") {
          const typeLabel = record.type.replace(/-/g, " ");
          const typeLabelCapitalized = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);
          const icon = getIcon(record);
          const lastTaken = formatLastTaken(record.date, record.time);
          
          if (record.type === "blood-pressure") {
              content = `
                  <div class="flex items-center flex-grow">
                      <div class="mr-3">
                          ${icon}
                      </div>
                      <div>
                          <h3 class="font-medium">${typeLabelCapitalized}</h3>
                          <p class="text-gray-500 text-sm">${record.systolic}/${record.diastolic} mmHg</p>
                      </div>
                  </div>
                  <div class="text-right">
                      <p class="text-gray-400 text-xs">Last taken:</p>
                      <p class="text-gray-500 text-xs">${lastTaken}</p>
                  </div>
              `;
          } else {
              content = `
                  <div class="flex items-center flex-grow">
                      <div class="mr-3">
                          ${icon}
                      </div>
                      <div>
                          <h3 class="font-medium">${typeLabelCapitalized}</h3>
                          <p class="text-gray-500 text-sm">${record.value}</p>
                      </div>
                  </div>
                  <div class="text-right">
                      <p class="text-gray-400 text-xs">Last taken:</p>
                      <p class="text-gray-500 text-xs">${lastTaken}</p>
                  </div>
              `;
          }
      } else if (category === "medical-notes") {
          const icon = getIcon(record);
          const lastTaken = formatLastTaken(record.date, record.time);
          
          content = `
              <div class="flex items-center flex-grow">
                  <div class="mr-3">
                      ${icon}
                  </div>
                  <div>
                      <h3 class="font-medium">${record.subject}</h3>
                      <p class="text-gray-500 text-sm">${record.body ? (record.body.length > 50 ? record.body.substring(0, 50) + "..." : record.body) : ""}</p>
                  </div>
              </div>
              <div class="text-right">
                  <p class="text-gray-400 text-xs">Last taken:</p>
                  <p class="text-gray-500 text-xs">${lastTaken}</p>
              </div>
          `;
      }
      
      div.innerHTML = content;
      
      return div;
  }

  // Render health records history
  function renderHealthRecordsHistory() {
      log("Rendering health records history");
      
      const container = getElement("health-records-history");
      const emptyState = getElement("history-empty-state");
      
      if (!container) {
          log("Error: Health records history container not found");
          return;
      }
      
      // Clear existing records
      if (container) {
          Array.from(container.children).forEach(child => {
              if (emptyState && child !== emptyState) {
                  child.remove();
              } else if (!emptyState) {
                  child.remove();
              }
          });
      }
      
      // Show empty state if no records
      if (healthRecords.length === 0) {
          if (emptyState) emptyState.style.display = "block";
          return;
      }
      
      // Hide empty state
      if (emptyState) emptyState.style.display = "none";
      
      // Sort records by date (newest first)
      const sortedRecords = [...healthRecords].sort((a, b) => b.timestamp - a.timestamp);
      
      // Group records by date
      const recordsByDate = {};
      
      sortedRecords.forEach(record => {
          if (!recordsByDate[record.date]) {
              recordsByDate[record.date] = [];
          }
          recordsByDate[record.date].push(record);
      });
      
      // Render each date group
      Object.entries(recordsByDate).forEach(([date, dateRecords]) => {
          // Create date header
          const dateHeader = document.createElement("div");
          dateHeader.className = "p-4 bg-gray-50";
          
          const dateObj = new Date(date);
          const formattedDate = dateObj.toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric"
          });
          
          dateHeader.innerHTML = `<h3 class="font-medium">${formattedDate}</h3>`;
          container.appendChild(dateHeader);
          
          // Sort records by time
          dateRecords.sort((a, b) => {
              const timeA = a.time.split(":");
              const timeB = b.time.split(":");
              const hourA = parseInt(timeA[0]);
              const hourB = parseInt(timeB[0]);
              if (hourA !== hourB) return hourB - hourA;
              return parseInt(timeA[1]) - parseInt(timeB[1]);
          });
          
          // Render each record
          dateRecords.forEach(record => {
              const recordElement = createHistoryRecordElement(record);
              container.appendChild(recordElement);
          });
      });
  }

  // Create history record element
  function createHistoryRecordElement(record) {
      const div = document.createElement("div");
      div.className = "p-4 border-t";
      div.dataset.id = record.id;
      
      let content = "";
      const icon = getIcon(record);
      const time = formatTimeWithAMPM(record.time);
      
      if (record.category === "vital-signs" || record.category === "biometrics") {
          const typeLabel = record.type.replace(/-/g, " ");
          const typeLabelCapitalized = typeLabel.charAt(0).toUpperCase() + typeLabel.slice(1);
          const categoryLabel = record.category === "vital-signs" ? "Vital Sign" : "Biometric";
          
          if (record.type === "blood-pressure") {
              content = `
                  <div class="flex justify-between items-start">
                      <div class="flex items-start">
                          <div class="mr-3 mt-1">
                              ${icon}
                          </div>
                          <div>
                              <span class="text-xs text-gray-400">${categoryLabel}</span>
                              <h3 class="font-medium">${typeLabelCapitalized}</h3>
                              <p class="text-gray-500 text-sm">${record.systolic}/${record.diastolic} mmHg</p>
                          </div>
                      </div>
                      <div class="text-right">
                          <p class="text-gray-400 text-xs">Taken at:</p>
                          <p class="text-gray-500 text-xs">${time}</p>
                      </div>
                  </div>
              `;
          } else {
              content = `
                  <div class="flex justify-between items-start">
                      <div class="flex items-start">
                          <div class="mr-3 mt-1">
                              ${icon}
                          </div>
                          <div>
                              <span class="text-xs text-gray-400">${categoryLabel}</span>
                              <h3 class="font-medium">${typeLabelCapitalized}</h3>
                              <p class="text-gray-500 text-sm">${record.value}</p>
                          </div>
                      </div>
                      <div class="text-right">
                          <p class="text-gray-400 text-xs">Taken at:</p>
                          <p class="text-gray-500 text-xs">${time}</p>
                      </div>
                  </div>
              `;
          }
      } else if (record.category === "medical-notes") {
          content = `
              <div class="flex justify-between items-start">
                  <div class="flex items-start">
                      <div class="mr-3 mt-1">
                          ${icon}
                      </div>
                      <div>
                          <span class="text-xs text-gray-400">Medical Note</span>
                          <h3 class="font-medium">${record.subject}</h3>
                          <p class="text-gray-500 text-sm">${record.body || ""}</p>
                      </div>
                  </div>
                  <div class="text-right">
                      <p class="text-gray-400 text-xs">Taken at:</p>
                      <p class="text-gray-500 text-xs">${time}</p>
                  </div>
              </div>
          `;
      }
      
      div.innerHTML = content;
      
      return div;
  }

  // Add health record to server
  function addHealthRecord(record) {
      log("Adding health record to server:", record);
      fetch("/api/health-records", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify(record),
          credentials: 'same-origin'
      })
          .then(response => {
              if (!response.ok) {
                  if (response.status === 403) {
                      // Premium limit reached
                      showPremiumModal();
                      throw new Error("Premium limit reached");
                  }
                  return response.json().then(err => {
                      throw new Error(err.error || `HTTP error! Status: ${response.status}`);
                  });
              }
              return response.json();
          })
          .then(data => {
              log("Server response after adding health record:", data);
              // Reload health records from server
              loadHealthRecords();
          })
          .catch(error => {
              log("Error adding health record:", error);
              // If not a premium error, show general error
              if (!error.message.includes("Premium")) {
                  alert("There was an error adding the health record: " + error.message);
              }
          });
  }

  // Update health record on server
  function updateHealthRecord(recordId, updatedFields) {
      log("Updating health record on server:", recordId, updatedFields);
      fetch(`/api/health-records/${recordId}`, {
          method: "PUT",
          headers: {
              "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedFields),
          credentials: 'same-origin'
      })
          .then(response => {
              if (!response.ok) {
                  return response.json().then(err => {
                      throw new Error(err.error || `HTTP error! Status: ${response.status}`);
                  });
              }
              return response.json();
          })
          .then(data => {
              log("Server response after updating health record:", data);
              // Reload health records from server
              loadHealthRecords();
          })
          .catch(error => {
              log("Error updating health record:", error);
              alert("There was an error updating the health record: " + error.message);
          });
  }

  // Delete health record from server
  function deleteHealthRecord(recordId) {
      log("Deleting health record from server:", recordId);
      fetch(`/api/health-records/${recordId}`, {
          method: "DELETE",
          credentials: 'same-origin'
      })
          .then(response => {
              if (!response.ok) {
                  return response.json().then(err => {
                      throw new Error(err.error || `HTTP error! Status: ${response.status}`);
                  });
              }
              return response.json();
          })
          .then(data => {
              log("Server response after deleting health record:", data);
              // Reload health records from server
              loadHealthRecords();
          })
          .catch(error => {
              log("Error deleting health record:", error);
              alert("There was an error deleting the health record: " + error.message);
          });
  }

  // Event Listeners

  // Toggle between main content and history page
  addEventListenerSafe(seeHistoryBtn, "click", () => {
      if (mainContent) mainContent.classList.add("hidden");
      if (historyPage) historyPage.classList.remove("hidden");
  });

  addEventListenerSafe(backToMainBtn, "click", () => {
      if (historyPage) historyPage.classList.add("hidden");
      if (mainContent) mainContent.classList.remove("hidden");
  });

  // Open edit modal
  addEventListenerSafe(editHealthRecordsBtn, "click", openEditModal);

  // Open add modal
  addEventListenerSafe(openAddHealthRecordBtn, "click", () => openAddModal());

  // Close add modal
  addEventListenerSafe(cancelAddHealthRecordBtn, "click", closeAddModal);

  // Close add modal when clicking outside
  addEventListenerSafe(addHealthRecordModal, "click", e => {
      if (e.target === addHealthRecordModal) {
          closeAddModal();
      }
  });

  // Handle category change
  addEventListenerSafe(recordCategory, "change", handleCategoryChange);

  // Handle vital sign type change
  addEventListenerSafe(vitalSignType, "change", handleVitalSignTypeChange);

  // Handle biometric type change
  addEventListenerSafe(biometricType, "change", () => {
      // No special handling needed for biometric type changes
      const recordValueInput = getElement("recordValue");
      if (recordValueInput) recordValueInput.classList.remove("hidden");
  });

  // Handle health record selection
  addEventListenerSafe(healthRecordSelect, "change", handleHealthRecordSelection);

  // Close edit modal
  addEventListenerSafe(cancelEditHealthRecordBtn, "click", closeEditModal);

  // Close edit modal when clicking outside
  addEventListenerSafe(editHealthRecordsModal, "click", e => {
      if (e.target === editHealthRecordsModal) {
          closeEditModal();
      }
  });

  // Close edit modal with close button
  addEventListenerSafe(editModalCloseBtn, "click", closeEditModal);

  // Open delete confirmation modal
  addEventListenerSafe(deleteHealthRecordBtn, "click", e => {
      e.preventDefault();
      openDeleteModal();
  });

  // Close delete confirmation modal
  addEventListenerSafe(cancelDeleteBtn, "click", closeDeleteModal);

  // Close delete confirmation modal when clicking outside
  addEventListenerSafe(deleteConfirmationModal, "click", e => {
      if (e.target === deleteConfirmationModal) {
          closeDeleteModal();
      }
  });

  // Confirm delete
  addEventListenerSafe(confirmDeleteBtn, "click", () => {
      if (selectedRecordId) {
          // Delete from server
          deleteHealthRecord(selectedRecordId);

          // Close modals
          closeDeleteModal();
          closeEditModal();

          // Clear the selected record ID
          selectedRecordId = null;
      }
  });

  // Close premium modal
  addEventListenerSafe(closePremiumModal, "click", closePremiumModalFn);

  // Handle premium upgrade
  addEventListenerSafe(upgradePremiumBtn, "click", () => {
      alert("This would redirect to the premium upgrade page.");
      closePremiumModalFn();
  });

  // Handle add health record form submission
  addEventListenerSafe(addHealthRecordForm, "submit", e => {
      e.preventDefault();

      const formData = new FormData(addHealthRecordForm);
      const category = formData.get("category");
      
      // Create base record object
      const record = {
          category,
          date: formData.get("date"),
          time: formData.get("time"),
          timestamp: new Date(`${formData.get("date")}T${formData.get("time")}`).getTime()
      };

      // Add category-specific fields
      if (category === "vital-signs") {
          record.type = formData.get("vitalSignType");
          
          if (record.type === "blood-pressure") {
              record.systolic = parseInt(formData.get("systolic"));
              record.diastolic = parseInt(formData.get("diastolic"));
              record.value = `${record.systolic}/${record.diastolic}`;
          } else {
              record.value = formData.get("value");
          }
      } else if (category === "biometrics") {
          record.type = formData.get("biometricType");
          record.value = formData.get("value");
      } else if (category === "medical-notes") {
          record.subject = formData.get("subject");
          record.body = formData.get("body");
      }

      // Add record to server
      addHealthRecord(record);

      // Close modal and reset form
      closeAddModal();
  });

  // Handle edit health record form submission
  addEventListenerSafe(editHealthRecordForm, "submit", e => {
      e.preventDefault();

      if (selectedRecordId) {
          const formData = new FormData(editHealthRecordForm);
          const category = formData.get("category");
          
          // Create base updated fields object
          const updatedFields = {
              date: formData.get("date"),
              time: formData.get("time"),
              timestamp: new Date(`${formData.get("date")}T${formData.get("time")}`).getTime()
          };

          // Add category-specific fields
          if (category === "vital-signs" || category === "biometrics") {
              if (formData.get("type") === "blood-pressure") {
                  updatedFields.systolic = parseInt(formData.get("systolic"));
                  updatedFields.diastolic = parseInt(formData.get("diastolic"));
              } else {
                  updatedFields.value = formData.get("value");
              }
          } else if (category === "medical-notes") {
              updatedFields.subject = formData.get("subject");
              updatedFields.body = formData.get("body");
          }

          // Update record on server
          updateHealthRecord(selectedRecordId, updatedFields);

          // Close modal
          closeEditModal();
      }
  });

  // Initialize
  loadHealthRecords();

});