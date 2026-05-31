const express = require('express');
const router = express.Router();
const Donor = require('../models/Donor');
const BloodRequest = require('../models/BloodRequest');
const { protect, adminOnly } = require('../middleware/auth');

// Apply protection to all admin endpoints
router.use(protect);
router.use(adminOnly);

// @route   GET /api/admin/stats
// @desc    Get system dashboard statistics
// @access  Private (Admin only)
router.get('/stats', async (req, res) => {
  try {
    const totalDonors = await Donor.countDocuments({});
    const approvedDonors = await Donor.countDocuments({ status: 'Approved' });
    const pendingDonors = await Donor.countDocuments({ status: 'Pending' });
    const rejectedDonors = await Donor.countDocuments({ status: 'Rejected' });

    const totalRequests = await BloodRequest.countDocuments({});
    const pendingRequests = await BloodRequest.countDocuments({ status: 'Pending' });
    const fulfilledRequests = await BloodRequest.countDocuments({ status: 'Fulfilled' });

    // Group donors by blood group for simple charts
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const bloodGroupDistribution = {};
    for (let bg of bloodGroups) {
      bloodGroupDistribution[bg] = await Donor.countDocuments({ bloodGroup: bg, status: 'Approved' });
    }

    res.status(200).json({
      success: true,
      data: {
        donors: { total: totalDonors, approved: approvedDonors, pending: pendingDonors, rejected: rejectedDonors },
        requests: { total: totalRequests, pending: pendingRequests, fulfilled: fulfilledRequests },
        bloodGroups: bloodGroupDistribution
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching statistics' });
  }
});

// @route   GET /api/admin/donors
// @desc    Get all donors (with optional search and filters)
// @access  Private (Admin only)
router.get('/donors', async (req, res) => {
  try {
    const { status, bloodGroup } = req.query;
    const filter = {};
    
    if (status && status !== 'All') {
      filter.status = status;
    }
    if (bloodGroup && bloodGroup !== 'All') {
      filter.bloodGroup = bloodGroup;
    }

    const donors = await Donor.find(filter);
    res.status(200).json({ success: true, count: donors.length, data: donors });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching donors' });
  }
});

// @route   PUT /api/admin/donor/:id/status
// @desc    Approve or reject a donor request
// @access  Private (Admin only)
router.put('/donor/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const updated = await Donor.findByIdAndUpdate(req.params.id, { status });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    res.status(200).json({ success: true, message: `Donor request ${status.toLowerCase()} successfully`, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating status' });
  }
});

// @route   PUT /api/admin/donor/:id
// @desc    Update donor information
// @access  Private (Admin only)
router.put('/donor/:id', async (req, res) => {
  try {
    const { name, age, gender, bloodGroup, mobile, email, address, city, isAvailable } = req.body;

    const updated = await Donor.findByIdAndUpdate(req.params.id, {
      name,
      age: parseInt(age),
      gender,
      bloodGroup,
      mobile,
      email,
      address,
      city,
      isAvailable
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    res.status(200).json({ success: true, message: 'Donor information updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating donor info' });
  }
});

// @route   DELETE /api/admin/donor/:id
// @desc    Delete donor
// @access  Private (Admin only)
router.delete('/donor/:id', async (req, res) => {
  try {
    const deleted = await Donor.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }
    res.status(200).json({ success: true, message: 'Donor deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting donor' });
  }
});

// @route   GET /api/admin/requests
// @desc    Get all blood requests
// @access  Private (Admin only)
router.get('/requests', async (req, res) => {
  try {
    const requests = await BloodRequest.find({});
    res.status(200).json({ success: true, count: requests.length, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching blood requests' });
  }
});

// @route   PUT /api/admin/request/:id/status
// @desc    Update blood request status
// @access  Private (Admin only)
router.put('/request/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Pending', 'Fulfilled', 'Cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value' });
    }

    const updated = await BloodRequest.findByIdAndUpdate(req.params.id, { status });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }

    res.status(200).json({ success: true, message: 'Request status updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error updating request status' });
  }
});

// @route   DELETE /api/admin/request/:id
// @desc    Delete blood request
// @access  Private (Admin only)
router.delete('/request/:id', async (req, res) => {
  try {
    const deleted = await BloodRequest.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Blood request not found' });
    }
    res.status(200).json({ success: true, message: 'Blood request deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error deleting request' });
  }
});

module.exports = router;
