const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let isMongoConnected = false;
const dataFolder = path.join(__dirname, '..', 'data');

// Ensure data folder exists for JSON fallback
if (!fs.existsSync(dataFolder)) {
  fs.mkdirSync(dataFolder, { recursive: true });
}

// Initialise JSON database files if they don't exist
const initializeJsonDb = (filename, defaultData = []) => {
  const filePath = path.join(dataFolder, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
};

initializeJsonDb('donors.json');
initializeJsonDb('admins.json');
initializeJsonDb('requests.json');

const connectDB = async () => {
  try {
    mongoose.set('strictQuery', false);
    // Set a short timeout (3 seconds) for local MongoDB connections so fallback triggers quickly if not running
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blood_donor_db', {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`\x1b[32m[Database] MongoDB Connected: ${conn.connection.host}\x1b[0m`);
    isMongoConnected = true;
    return true;
  } catch (error) {
    console.warn(`\x1b[33m[Database] MongoDB connection failed: ${error.message}\x1b[0m`);
    console.warn(`\x1b[36m[Database] Falling back to Local JSON database stored in: ${dataFolder}\x1b[0m`);
    isMongoConnected = false;
    return false;
  }
};

// Local JSON DB Helper functions
const jsonDb = {
  read: (filename) => {
    try {
      const filePath = path.join(dataFolder, filename);
      if (!fs.existsSync(filePath)) {
        return [];
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data || '[]');
    } catch (err) {
      console.error(`Error reading ${filename}:`, err);
      return [];
    }
  },
  write: (filename, data) => {
    try {
      const filePath = path.join(dataFolder, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (err) {
      console.error(`Error writing to ${filename}:`, err);
      return false;
    }
  }
};

module.exports = {
  connectDB,
  isMongo: () => isMongoConnected,
  jsonDb
};
