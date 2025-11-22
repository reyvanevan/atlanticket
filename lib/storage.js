const fs = require('fs');
const path = require('path');

/**
 * Core storage operations untuk local JSON files
 */

const STORAGE_PATH = {
  TICKETS: './db/tickets.json',
  BUKTI: './db/bukti_transfer.json',
  CONCERTS: './db/concerts.json',
  ADMIN: './db/admin.json'
};

/**
 * Load JSON file safely
 */
const loadJSON = (filePath, defaultValue = {}) => {
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`❌ Error loading ${filePath}:`, err.message);
    return defaultValue;
  }
};

/**
 * Save JSON file safely
 */
const saveJSON = (filePath, data, label = 'Data') => {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    const count = data.tickets?.length || data.bukti_transfer?.length || data.concerts?.length || data.admins?.length || 0;
    console.log(`✅ ${label} saved (${count} records)`);
    return true;
  } catch (err) {
    console.error(`❌ Error saving ${label}:`, err.message);
    return false;
  }
};

/**
 * Initialize all storage files
 */
const initializeStorage = () => {
  const defaultFiles = {
    [STORAGE_PATH.TICKETS]: { tickets: [] },
    [STORAGE_PATH.BUKTI]: { bukti_transfer: [] },
    [STORAGE_PATH.CONCERTS]: { concerts: [] },
    [STORAGE_PATH.ADMIN]: { admins: [] }
  };

  Object.entries(defaultFiles).forEach(([filePath, defaultData]) => {
    if (!fs.existsSync(filePath)) {
      saveJSON(filePath, defaultData, `Created ${path.basename(filePath)}`);
    }
  });
};

module.exports = {
  STORAGE_PATH,
  loadJSON,
  saveJSON,
  initializeStorage
};
