const mongoose = require('mongoose');
const { isMongo, jsonDb } = require('../config/db');

// Define Mongoose Schema
const DonorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, required: true },
  bloodGroup: { type: String, required: true },
  mobile: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  isAvailable: { type: Boolean, default: true },
  status: { type: String, default: 'Pending' } // Pending, Approved, Rejected
});

const MongooseDonor = mongoose.model('Donor', DonorSchema);

// Dual Mode Abstraction
const Donor = {
  create: async (data) => {
    if (isMongo()) {
      return await MongooseDonor.create(data);
    } else {
      const donors = jsonDb.read('donors.json');
      // Check unique email
      if (donors.some(d => d.email.toLowerCase() === data.email.toLowerCase())) {
        throw new Error('Email already registered');
      }
      const newDonor = {
        _id: Date.now().toString(),
        name: data.name,
        age: parseInt(data.age),
        gender: data.gender,
        bloodGroup: data.bloodGroup,
        mobile: data.mobile,
        email: data.email,
        password: data.password,
        address: data.address,
        city: data.city,
        isAvailable: data.isAvailable !== undefined ? data.isAvailable : true,
        status: data.status || 'Pending'
      };
      donors.push(newDonor);
      jsonDb.write('donors.json', donors);
      return newDonor;
    }
  },

  find: async (query = {}) => {
    if (isMongo()) {
      return await MongooseDonor.find(query);
    } else {
      let donors = jsonDb.read('donors.json');
      // Apply basic query filtering if specified
      return donors.filter(donor => {
        for (let key in query) {
          // Allow case-insensitive search on string fields
          if (typeof query[key] === 'string' && typeof donor[key] === 'string') {
            if (donor[key].toLowerCase() !== query[key].toLowerCase()) {
              return false;
            }
          } else if (typeof query[key] === 'object' && query[key] !== null) {
            // Support simple $ne, $regex, etc.
            if (query[key].$ne && donor[key] === query[key].$ne) return false;
            if (query[key].$regex) {
              const regex = new RegExp(query[key].$regex, query[key].$options || 'i');
              if (!regex.test(donor[key] || '')) return false;
            }
          } else if (donor[key] !== query[key]) {
            return false;
          }
        }
        return true;
      });
    }
  },

  findOne: async (query = {}) => {
    if (isMongo()) {
      return await MongooseDonor.findOne(query);
    } else {
      const donors = await Donor.find(query);
      return donors[0] || null;
    }
  },

  findById: async (id) => {
    if (isMongo()) {
      return await MongooseDonor.findById(id);
    } else {
      const donors = jsonDb.read('donors.json');
      return donors.find(d => d._id === id.toString()) || null;
    }
  },

  findByIdAndUpdate: async (id, updateData) => {
    if (isMongo()) {
      return await MongooseDonor.findByIdAndUpdate(id, updateData, { new: true });
    } else {
      const donors = jsonDb.read('donors.json');
      const idx = donors.findIndex(d => d._id === id.toString());
      if (idx === -1) return null;
      
      // Update fields
      donors[idx] = { ...donors[idx], ...updateData };
      jsonDb.write('donors.json', donors);
      return donors[idx];
    }
  },

  findByIdAndDelete: async (id) => {
    if (isMongo()) {
      return await MongooseDonor.findByIdAndDelete(id);
    } else {
      const donors = jsonDb.read('donors.json');
      const idx = donors.findIndex(d => d._id === id.toString());
      if (idx === -1) return null;
      const deleted = donors.splice(idx, 1)[0];
      jsonDb.write('donors.json', donors);
      return deleted;
    }
  },

  countDocuments: async (query = {}) => {
    if (isMongo()) {
      return await MongooseDonor.countDocuments(query);
    } else {
      const donors = await Donor.find(query);
      return donors.length;
    }
  }
};

module.exports = Donor;
