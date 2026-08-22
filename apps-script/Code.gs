/**
 * Google Apps Script Web App — Wedding Invitation Data API
 * 
 * Deployed as a web app with "Anyone" access.
 * Uses Google Sheets as the data store.
 * 
 * Sheet 1 "Guests": id | name | ticketCount | createdAt
 * Sheet 2 "RSVPs": guestId | attendance | attendeeNames | phone | message | submittedAt
 */

// ============================================================
// Configuration
// ============================================================

/**
 * Returns the active spreadsheet.
 * Replace with SpreadsheetApp.openById('YOUR_SHEET_ID') if needed.
 */
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function getGuestsSheet() {
  return getSpreadsheet().getSheetByName('Guests');
}

function getRsvpsSheet() {
  return getSpreadsheet().getSheetByName('RSVPs');
}

// ============================================================
// HTTP Handlers
// ============================================================

/**
 * Handles GET requests.
 * Routes by e.parameter.action: getGuest, getAllGuests
 */
function doGet(e) {
  var action = e.parameter.action;

  try {
    switch (action) {
      case 'getGuest':
        return jsonResponse(handleGetGuest(e.parameter.id));
      case 'getAllGuests':
        return jsonResponse(handleGetAllGuests());
      default:
        return jsonResponse({ error: true, message: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ error: true, message: err.message });
  }
}

/**
 * Handles POST requests.
 * Routes by body.action: createGuest, updateGuest, deleteGuest, submitRsvp
 */
function doPost(e) {
  var body;

  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ error: true, message: 'Invalid JSON body' });
  }

  var action = body.action;

  try {
    switch (action) {
      case 'createGuest':
        return jsonResponse(handleCreateGuest(body));
      case 'updateGuest':
        return jsonResponse(handleUpdateGuest(body));
      case 'deleteGuest':
        return jsonResponse(handleDeleteGuest(body));
      case 'submitRsvp':
        return jsonResponse(handleSubmitRsvp(body));
      default:
        return jsonResponse({ error: true, message: 'Unknown action: ' + action });
    }
  } catch (err) {
    return jsonResponse({ error: true, message: err.message });
  }
}

// ============================================================
// Action Handlers
// ============================================================

/**
 * Get a single guest by ID, including RSVP status.
 */
function handleGetGuest(id) {
  if (!id) {
    return { error: true, message: 'Missing guest id' };
  }

  var sheet = getGuestsSheet();
  var data = sheet.getDataRange().getValues();

  // Skip header row (row 0)
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      var guest = {
        id: data[i][0],
        name: data[i][1],
        ticketCount: data[i][2],
        createdAt: data[i][3]
      };

      // Check RSVP status
      var rsvp = findRsvpByGuestId(id);
      guest.rsvpStatus = rsvp ? 'submitted' : 'not_submitted';
      if (rsvp) {
        guest.rsvp = rsvp;
      }

      return guest;
    }
  }

  return { error: true, message: 'Guest not found' };
}

/**
 * Get all guests with their RSVP status.
 */
function handleGetAllGuests() {
  var sheet = getGuestsSheet();
  var data = sheet.getDataRange().getValues();
  var guests = [];

  // Build a map of RSVPs by guestId for efficient lookup
  var rsvpMap = buildRsvpMap();

  // Skip header row
  for (var i = 1; i < data.length; i++) {
    var id = data[i][0];
    if (!id) continue; // Skip empty rows

    var guest = {
      id: id,
      name: data[i][1],
      ticketCount: data[i][2],
      createdAt: data[i][3],
      rsvpStatus: rsvpMap[id] ? 'submitted' : 'not_submitted'
    };

    guests.push(guest);
  }

  return { guests: guests };
}

/**
 * Create a new guest record.
 * Validates name uniqueness and generates a unique ID.
 */
function handleCreateGuest(body) {
  var name = (body.name || '').trim();
  var ticketCount = body.ticketCount;

  // Validate name
  if (!name || name.length === 0) {
    return { error: true, message: 'Name is required' };
  }
  if (name.length > 100) {
    return { error: true, message: 'Name must be 100 characters or less' };
  }

  // Validate ticketCount
  if (!Number.isInteger(ticketCount) || ticketCount < 1 || ticketCount > 20) {
    return { error: true, message: 'Ticket count must be an integer between 1 and 20' };
  }

  var sheet = getGuestsSheet();
  var data = sheet.getDataRange().getValues();

  // Check for duplicate name (case-insensitive)
  for (var i = 1; i < data.length; i++) {
    if (data[i][1] && data[i][1].toString().toLowerCase() === name.toLowerCase()) {
      return { error: true, message: 'Duplicate name' };
    }
  }

  // Generate unique ID
  var id = generateUniqueId(data);

  // Append new row
  var createdAt = new Date().toISOString();
  sheet.appendRow([id, name, ticketCount, createdAt]);

  return {
    success: true,
    id: id,
    name: name,
    ticketCount: ticketCount,
    createdAt: createdAt
  };
}

/**
 * Update an existing guest record (name and/or ticketCount).
 */
function handleUpdateGuest(body) {
  var id = body.id;

  if (!id) {
    return { error: true, message: 'Missing guest id' };
  }

  var sheet = getGuestsSheet();
  var data = sheet.getDataRange().getValues();
  var rowIndex = -1;

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      rowIndex = i;
      break;
    }
  }

  if (rowIndex === -1) {
    return { error: true, message: 'Guest not found' };
  }

  // Update name if provided
  if (body.name !== undefined) {
    var newName = (body.name || '').trim();
    if (!newName || newName.length === 0) {
      return { error: true, message: 'Name is required' };
    }
    if (newName.length > 100) {
      return { error: true, message: 'Name must be 100 characters or less' };
    }

    // Check for duplicate name (excluding current record)
    for (var i = 1; i < data.length; i++) {
      if (i !== rowIndex && data[i][1] && data[i][1].toString().toLowerCase() === newName.toLowerCase()) {
        return { error: true, message: 'Duplicate name' };
      }
    }

    sheet.getRange(rowIndex + 1, 2).setValue(newName);
  }

  // Update ticketCount if provided
  if (body.ticketCount !== undefined) {
    var ticketCount = body.ticketCount;
    if (!Number.isInteger(ticketCount) || ticketCount < 1 || ticketCount > 20) {
      return { error: true, message: 'Ticket count must be an integer between 1 and 20' };
    }
    sheet.getRange(rowIndex + 1, 3).setValue(ticketCount);
  }

  return { success: true };
}

/**
 * Delete a guest record by ID.
 */
function handleDeleteGuest(body) {
  var id = body.id;

  if (!id) {
    return { error: true, message: 'Missing guest id' };
  }

  var sheet = getGuestsSheet();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      // Delete the row (sheet rows are 1-indexed, +1 for header)
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }

  return { error: true, message: 'Guest not found' };
}

/**
 * Submit or update an RSVP for a guest.
 * Upsert behavior: update existing if guestId already has a record.
 */
function handleSubmitRsvp(body) {
  var guestId = body.guestId;

  if (!guestId) {
    return { error: true, message: 'Missing guestId' };
  }

  // Verify guest exists
  var guestsSheet = getGuestsSheet();
  var guestsData = guestsSheet.getDataRange().getValues();
  var guestFound = false;

  for (var i = 1; i < guestsData.length; i++) {
    if (guestsData[i][0] === guestId) {
      guestFound = true;
      break;
    }
  }

  if (!guestFound) {
    return { error: true, message: 'Guest not found' };
  }

  var attendance = body.attendance;
  var attendeeNames = body.attendeeNames || [];
  var phone = body.phone || '';
  var message = body.message || '';
  var submittedAt = new Date().toISOString();

  // Serialize attendeeNames as JSON string for storage
  var attendeeNamesStr = JSON.stringify(attendeeNames);

  var rsvpSheet = getRsvpsSheet();
  var rsvpData = rsvpSheet.getDataRange().getValues();

  // Check if RSVP already exists for this guest (upsert)
  for (var i = 1; i < rsvpData.length; i++) {
    if (rsvpData[i][0] === guestId) {
      // Update existing row
      var row = i + 1; // 1-indexed
      rsvpSheet.getRange(row, 2).setValue(attendance);
      rsvpSheet.getRange(row, 3).setValue(attendeeNamesStr);
      rsvpSheet.getRange(row, 4).setValue(phone);
      rsvpSheet.getRange(row, 5).setValue(message);
      rsvpSheet.getRange(row, 6).setValue(submittedAt);
      return { success: true, updated: true };
    }
  }

  // Append new RSVP row
  rsvpSheet.appendRow([guestId, attendance, attendeeNamesStr, phone, message, submittedAt]);
  return { success: true, created: true };
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Generate a unique 8-character alphanumeric ID.
 * Checks for collisions against existing guest IDs.
 */
function generateUniqueId(existingData) {
  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var existingIds = {};

  // Build set of existing IDs
  for (var i = 1; i < existingData.length; i++) {
    if (existingData[i][0]) {
      existingIds[existingData[i][0]] = true;
    }
  }

  var id;
  var maxAttempts = 100;
  var attempts = 0;

  do {
    id = '';
    for (var j = 0; j < 8; j++) {
      id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    attempts++;
    if (attempts > maxAttempts) {
      throw new Error('Could not generate unique ID after ' + maxAttempts + ' attempts');
    }
  } while (existingIds[id]);

  return id;
}

/**
 * Find an RSVP record by guest ID.
 * Returns the parsed record or null.
 */
function findRsvpByGuestId(guestId) {
  var sheet = getRsvpsSheet();
  var data = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === guestId) {
      return {
        guestId: data[i][0],
        attendance: data[i][1],
        attendeeNames: parseAttendeeNames(data[i][2]),
        phone: data[i][3],
        message: data[i][4],
        submittedAt: data[i][5]
      };
    }
  }

  return null;
}

/**
 * Build a map of guestId → RSVP record for efficient bulk lookups.
 */
function buildRsvpMap() {
  var sheet = getRsvpsSheet();
  var data = sheet.getDataRange().getValues();
  var map = {};

  for (var i = 1; i < data.length; i++) {
    if (data[i][0]) {
      map[data[i][0]] = {
        guestId: data[i][0],
        attendance: data[i][1],
        attendeeNames: parseAttendeeNames(data[i][2]),
        phone: data[i][3],
        message: data[i][4],
        submittedAt: data[i][5]
      };
    }
  }

  return map;
}

/**
 * Parse attendee names from stored JSON string.
 * Returns an array, handling both JSON strings and plain values.
 */
function parseAttendeeNames(value) {
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (e) {
      return [value];
    }
  }
  return [];
}

/**
 * Create a JSON response with appropriate MIME type.
 * CORS is handled automatically by Google Apps Script for web apps,
 * but we set headers for completeness.
 */
function jsonResponse(data) {
  var output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
