/**
 * Generates a unique Case Registration Number
 * Format: CC-YYYYMMDD-XXXX (e.g. CC-20260820-8472)
 */
function generateCaseId() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `CC-${dateStr}-${randomDigits}`;
}

module.exports = generateCaseId;
