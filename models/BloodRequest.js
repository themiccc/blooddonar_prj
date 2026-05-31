const mongoose = require('mongoose');
const { isMongo, jsonDb } = require('../config/db');

// Define Mongoose Schema
const BloodRequestSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  hospitalName: { type: String, required: true },
  contactNumber: { type: String, required: true },
  location: { type: String, required: true },
  requestDate: { type: Date, default: Date.now },
  status: { type: String, default: 'Pending' }, // Pending, Fulfilled, Cancelled
  urgency: { type: String, default: 'Normal' } // Normal, Urgent, Emergency
});

const MongooseBloodRequest = mongoose.model('BloodRequest', BloodRequestSchema);

// Dual Mode Abstraction
const BloodRequest = {
  create: async (data) => {
    if (isMongo()) {
      return await MongooseBloodRequest.create(data);
    } else {
      const requests = jsonDb.read('requests.json');
      const newRequest = {
        _id: Date.now().toString(),
        patientName: data.patientName,
        bloodGroup: data.bloodGroup,
        hospitalName: data.hospitalName,
        contactNumber: data.contactNumber,
        location: data.location,
        requestDate: data.requestDate || new Date().toISOString(),
        status: data.status || 'Pending',
        urgency: data.urgency || 'Normal'
      };
      requests.push(newRequest);
      jsonDb.write('requests.json', requests);
      return newRequest;
    }
  },

  find: async (query = {}) => {
    if (isMongo()) {
      // Sort by date descending
      return await MongooseBloodRequest.find(query).sort({ requestDate: -1 });
    } else {
      let requests = jsonDb.read('requests.json');
      // Apply basic query filtering if specified
      let filtered = requests.filter(req => {
        for (let key in query) {
          if (typeof query[key] === 'string' && typeof req[key] === 'string') {
            if (req[key].toLowerCase() !== query[key].toLowerCase()) {
              return false;
            }
          } else if (typeof query[key] === 'object' && query[key] !== null) {
            if (query[key].$ne && req[key] === query[key].$ne) return false;
            if (query[key].$regex) {
              const regex = new RegExp(query[key].$regex, query[key].$options || 'i');
              if (!regex.test(req[key] || '')) return false;
            }
          } else if (req[key] !== query[key]) {
            return false;
          }
        }
        return true;
      });
      // Sort descending by date
      return filtered.sort((a, b) => new Date(b.requestDate) - new Date(a.requestDate));
    }
  },

  findById: async (id) => {
    if (isMongo()) {
      return await MongooseBloodRequest.findById(id);
    } else {
      const requests = jsonDb.read('requests.json');
      return requests.find(r => r._id === id.toString()) || null;
    }
  },

  findByIdAndUpdate: async (id, updateData) => {
    if (isMongo()) {
      return await MongooseBloodRequest.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      const requests = jsonDb.read('requests.json');
      const idx = requests.findIndex(r => r._id === id.toString());
      if (idx === -1) return null;
      
      requests[idx] = { ...requests[idx], ...updateData };
      jsonDb.write('requests.json', requests);
      return requests[idx];
    }
  },

  findByIdAndDelete: async (id) => {
    if (isMongo()) {
      return await MongooseBloodRequest.findByIdAndDelete(id);
    } else {
      const requests = jsonDb.read('requests.json');
      const idx = requests.findIndex(r => r._id === id.toString());
      if (idx === -1) return null;
      const deleted = requests.splice(idx, 1)[0];
      jsonDb.write('requests.json', requests);
      return deleted;
    }
  },

  countDocuments: async (query = {}) => {
    if (isMongo()) {
      return await MongooseBloodRequest.countDocuments(query);
    } else {
      const requests = await BloodRequest.find(query);
      return requests.length;
    }
  }
};

module.exports = BloodRequest;
