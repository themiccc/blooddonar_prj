const mongoose = require('mongoose');
const { isMongo, jsonDb } = require('../config/db');

// Define Mongoose Schema
const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const MongooseAdmin = mongoose.model('Admin', AdminSchema);

// Dual Mode Abstraction
const Admin = {
  create: async (data) => {
    if (isMongo()) {
      return await MongooseAdmin.create(data);
    } else {
      const admins = jsonDb.read('admins.json');
      if (admins.some(a => a.username.toLowerCase() === data.username.toLowerCase())) {
        throw new Error('Admin already exists');
      }
      const newAdmin = {
        _id: Date.now().toString(),
        username: data.username,
        password: data.password
      };
      admins.push(newAdmin);
      jsonDb.write('admins.json', admins);
      return newAdmin;
    }
  },

  findOne: async (query = {}) => {
    if (isMongo()) {
      return await MongooseAdmin.findOne(query);
    } else {
      const admins = jsonDb.read('admins.json');
      const found = admins.find(admin => {
        for (let key in query) {
          if (typeof query[key] === 'string' && typeof admin[key] === 'string') {
            if (admin[key].toLowerCase() !== query[key].toLowerCase()) {
              return false;
            }
          } else if (admin[key] !== query[key]) {
            return false;
          }
        }
        return true;
      });
      return found || null;
    }
  },

  countDocuments: async (query = {}) => {
    if (isMongo()) {
      return await MongooseAdmin.countDocuments(query);
    } else {
      const admins = jsonDb.read('admins.json');
      return admins.length;
    }
  }
};

module.exports = Admin;
