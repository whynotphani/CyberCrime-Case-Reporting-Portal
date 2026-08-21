const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

/**
 * In-Memory & Local JSON Disk Database Store
 */
const store = {
  citizens: [],
  cases: [],
  officers: [],
  otp_records: [],
  evidence: [],
  case_status_history: []
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function saveStore() {
  try {
    ensureDataDir();
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf8');
  } catch (err) {
    console.error('[MemoryDB] Failed to persist store to disk:', err.message);
  }
}

function loadStore() {
  try {
    ensureDataDir();
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf8');
      const loaded = JSON.parse(data);
      if (loaded.officers && loaded.officers.length > 0) store.officers = loaded.officers;
      if (loaded.cases && loaded.cases.length > 0) store.cases = loaded.cases;
      if (loaded.citizens && loaded.citizens.length > 0) store.citizens = loaded.citizens;
      if (loaded.evidence && loaded.evidence.length > 0) store.evidence = loaded.evidence;
      if (loaded.case_status_history && loaded.case_status_history.length > 0) store.case_status_history = loaded.case_status_history;
      console.log('[MemoryDB] Successfully loaded saved state from local disk (store.json).');
      return true;
    }
  } catch (err) {
    console.error('[MemoryDB] Failed to load store from disk:', err.message);
  }
  return false;
}

// Initial load on server startup
loadStore();

module.exports = {
  store,
  saveStore,
  loadStore
};
