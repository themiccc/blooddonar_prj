const express = require('express');
const router = express.Router();
const BloodRequest = require('../models/BloodRequest');
const Donor = require('../models/Donor');

// @route   POST /api/request
// @desc    Submit a new blood request (Patient/User)
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { patientName, bloodGroup, hospitalName, contactNumber, location, urgency } = req.body;

    if (!patientName || !bloodGroup || !hospitalName || !contactNumber || !location) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const request = await BloodRequest.create({
      patientName,
      bloodGroup,
      hospitalName,
      contactNumber,
      location,
      urgency: urgency || 'Normal',
      requestDate: new Date(),
      status: 'Pending'
    });

    res.status(201).json({ success: true, message: 'Blood request submitted successfully!', data: request });
  } catch (error) {
    console.error('Request creation error:', error);
    res.status(500).json({ success: false, message: 'Server error processing blood request' });
  }
});

// @route   GET /api/request/search
// @desc    Search available donors by blood group and/or location (City)
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { bloodGroup, city } = req.query;

    const query = {
      status: 'Approved' // Only show approved donors
    };

    if (bloodGroup && bloodGroup !== 'All') {
      query.bloodGroup = bloodGroup;
    }
    if (city && city.trim() !== '') {
      query.city = { $regex: city.trim(), $options: 'i' };
    }

    const donors = await Donor.find(query);

    // Format the response, stripping out passwords
    const sanitized = donors.map(d => ({
      id: d._id,
      name: d.name,
      age: d.age,
      gender: d.gender,
      bloodGroup: d.bloodGroup,
      mobile: d.mobile,
      email: d.email,
      address: d.address,
      city: d.city,
      isAvailable: d.isAvailable
    }));

    res.status(200).json({ success: true, count: sanitized.length, data: sanitized });
  } catch (error) {
    console.error('Donor search error:', error);
    res.status(500).json({ success: false, message: 'Server error searching donors' });
  }
});

// @route   GET /api/request/active
// @desc    Get all active (pending) blood requests
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const requests = await BloodRequest.find({ status: 'Pending' });
    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching active requests' });
  }
});

module.exports = router;
