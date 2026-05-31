const express = require('express');
const router = express.Router();
const Donor = require('../models/Donor');
const BloodRequest = require('../models/BloodRequest');
const { protect, donorOnly } = require('../middleware/auth');

// Apply protection to all donor endpoints
router.use(protect);
router.use(donorOnly);

// @route   GET /api/donor/profile
// @desc    Get donor profile
// @access  Private (Donor only)
router.get('/profile', async (req, res) => {
  try {
    const donor = await Donor.findById(req.user.id);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Profile not found' });
    }
    // Remove password
    const profile = { ...donor };
    if (profile.password) delete profile.password;
    
    res.status(200).json({ success: true, data: donor });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving profile' });
  }
});

// @route   PUT /api/donor/profile
// @desc    Update profile details (name, age, gender, bloodGroup, mobile, address, city)
// @access  Private (Donor only)
router.put('/profile', async (req, res) => {
  try {
    const { name, age, gender, bloodGroup, mobile, address, city } = req.body;
    
    const updated = await Donor.findByIdAndUpdate(req.user.id, {
      name,
      age: parseInt(age),
      gender,
      bloodGroup,
      mobile,
      address,
      city
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    res.status(200).json({ success: true, message: 'Profile updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
});

// @route   PUT /api/donor/availability
// @desc    Toggle donor availability status
// @access  Private (Donor only)
router.put('/availability', async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    if (isAvailable === undefined) {
      return res.status(400).json({ success: false, message: 'Availability status is required' });
    }

    const updated = await Donor.findByIdAndUpdate(req.user.id, { isAvailable });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: `Availability updated to ${isAvailable ? 'Available' : 'Unavailable'}`, 
      data: { isAvailable: updated.isAvailable } 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating availability' });
  }
});

// @route   GET /api/donor/requests
// @desc    Get active blood requests matching donor's blood group
// @access  Private (Donor only)
router.get('/requests', async (req, res) => {
  try {
    const donor = await Donor.findById(req.user.id);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    // Find pending requests matching this blood group
    const requests = await BloodRequest.find({
      bloodGroup: donor.bloodGroup,
      status: 'Pending'
    });

    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching matching requests' });
  }
});

module.exports = router;
