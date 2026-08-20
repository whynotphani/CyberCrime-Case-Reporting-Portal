/**
 * In-Memory Database Store for offline / fast fallback
 */
const store = {
  citizens: [],
  cases: [],
  officers: [],
  otp_records: [],
  evidence: [],
  case_status_history: []
};

module.exports = {
  store
};
