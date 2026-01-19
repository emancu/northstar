/**
 * Global Query State Management
 * Handles:
 * - Central query storage
 * - URL hash encoding/decoding for sharing
 * - State change notifications to all tabs
 *
 * Note: No localStorage persistence - queries only live in URL
 */

const URL_HASH_PREFIX = 'q=';

// Current query JSON
let currentQuery = null;

// Listeners for state changes
const listeners = [];

/**
 * Initialize query state from URL only
 * localStorage is NOT used for auto-loading (only for URL sync)
 */
export function initQueryState() {
  // ONLY check URL hash - no localStorage auto-loading
  const hashQuery = loadFromHash();
  if (hashQuery) {
    currentQuery = hashQuery;
    notifyListeners();
    return true;
  }

  return false;
}

/**
 * Get the current query
 */
export function getQuery() {
  return currentQuery;
}

/**
 * Set a new query (from file upload or other source)
 */
export function setQuery(queryJson) {
  currentQuery = queryJson;

  // Notify all listeners
  notifyListeners();
}

/**
 * Clear the current query
 */
export function clearQuery() {
  currentQuery = null;
  clearHash();
  notifyListeners();
}

/**
 * Add a listener for query changes
 * Listener will be called with the new query (or null if cleared)
 */
export function addListener(callback) {
  listeners.push(callback);
}

/**
 * Remove a listener
 */
export function removeListener(callback) {
  const index = listeners.indexOf(callback);
  if (index > -1) {
    listeners.splice(index, 1);
  }
}

/**
 * Notify all listeners of state change
 */
function notifyListeners() {
  listeners.forEach(callback => {
    try {
      callback(currentQuery);
    } catch (error) {
      console.error('Error in query state listener:', error);
    }
  });
}

/**
 * Encode JSON to URL-safe base64
 */
function encodeQuery(json) {
  const jsonString = JSON.stringify(json);
  const base64 = btoa(jsonString);
  // Make URL-safe
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Decode URL-safe base64 to JSON
 */
function decodeQuery(encoded) {
  // Restore standard base64
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding
  while (base64.length % 4) {
    base64 += '=';
  }
  const jsonString = atob(base64);
  return JSON.parse(jsonString);
}

/**
 * Load query from URL hash
 */
function loadFromHash() {
  try {
    const hash = window.location.hash;
    if (!hash || !hash.startsWith(`#${URL_HASH_PREFIX}`)) {
      return null;
    }

    const encoded = hash.substring(URL_HASH_PREFIX.length + 1);
    return decodeQuery(encoded);
  } catch (error) {
    console.error('Failed to decode query from URL:', error);
    return null;
  }
}

/**
 * Clear URL hash
 */
function clearHash() {
  window.history.replaceState(null, '', window.location.pathname);
}

/**
 * Check if a query is currently loaded
 */
export function hasQuery() {
  return currentQuery !== null;
}

/**
 * Get a shareable URL for the current query
 */
export function getShareableUrl() {
  if (!currentQuery) {
    return window.location.origin + window.location.pathname;
  }

  try {
    const encoded = encodeQuery(currentQuery);
    return `${window.location.origin}${window.location.pathname}#${URL_HASH_PREFIX}${encoded}`;
  } catch (error) {
    console.error('Failed to generate shareable URL:', error);
    return window.location.origin + window.location.pathname;
  }
}
