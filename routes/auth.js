const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Donor = require('../models/Donor');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey_blood_donor_finder_2026';

// Initialize Twilio Client dynamically if config exists
let twilioClient;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('\x1b[32m[SMS] Twilio client initialized successfully.\x1b[0m');
  } catch (err) {
    console.error('[SMS Error] Failed to initialize Twilio:', err.message);
  }
}

// Initialize SendGrid Mail Client dynamically if config exists
const sgMail = require('@sendgrid/mail');
if (process.env.SENDGRID_API_KEY) {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    console.log('\x1b[32m[Email] SendGrid client initialized successfully.\x1b[0m');
  } catch (err) {
    console.error('[Email Error] Failed to initialize SendGrid:', err.message);
  }
}

// Helper to sign JWT and set cookie
const sendTokenResponse = (user, role, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, email: user.email || user.username, role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  const cookieOptions = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  };

  res
    .status(statusCode)
    .cookie('token', token, cookieOptions)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name || user.username,
        email: user.email || user.username,
        role
      }
    });
};

// @route   POST /api/auth/register
// @desc    Register a new donor
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, age, gender, bloodGroup, mobile, email, password, address, city } = req.body;

    // Validate request
    if (!name || !age || !gender || !bloodGroup || !mobile || !email || !password || !address || !city) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    // Check if email already registered
    const existing = await Donor.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email address already registered' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create donor (default isAvailable: true, status: 'Pending')
    const donor = await Donor.create({
      name,
      age: parseInt(age),
      gender,
      bloodGroup,
      mobile,
      email,
      password: hashedPassword,
      address,
      city,
      isAvailable: true,
      status: 'Pending'
    });

    // Auto log in after registration (generates token)
    sendTokenResponse(donor, 'donor', 201, res);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Donor Login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Find donor
    const donor = await Donor.findOne({ email });
    if (!donor) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, donor.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check application status
    if (donor.status === 'Rejected') {
      return res.status(403).json({ success: false, message: 'Your donor account request was rejected by admin.' });
    }

    sendTokenResponse(donor, 'donor', 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});

// @route   POST /api/auth/admin-login
// @desc    Admin Login
// @access  Public
router.post('/admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Please provide username and password' });
    }

    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }

    sendTokenResponse(admin, 'admin', 200, res);
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ success: false, message: 'Server error during admin login' });
  }
});

// @route   GET /api/auth/logout
// @desc    Clear cookies and logout
// @access  Public
router.get('/logout', (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

// @route   GET /api/auth/me
// @desc    Get logged in user details
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    if (req.user.role === 'donor') {
      const donor = await Donor.findById(req.user.id);
      if (!donor) {
        return res.status(404).json({ success: false, message: 'Donor not found' });
      }
      res.status(200).json({
        success: true,
        user: {
          id: donor._id,
          name: donor.name,
          email: donor.email,
          role: 'donor',
          status: donor.status,
          isAvailable: donor.isAvailable,
          bloodGroup: donor.bloodGroup,
          city: donor.city,
          address: donor.address,
          age: donor.age,
          gender: donor.gender,
          mobile: donor.mobile
        }
      });
    } else if (req.user.role === 'admin') {
      const admin = await Admin.findOne({ username: req.user.email }); // in signToken, email holds username for admin
      res.status(200).json({
        success: true,
        user: {
          id: req.user.id,
          name: req.user.email,
          role: 'admin'
        }
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving session user' });
  }
});

// Memory store for active OTP codes
const otpStore = {};

// @route   POST /api/auth/send-otp
// @desc    Generate and send systematic OTP (supports real Twilio SMS & fallback logs)
// @access  Public
router.post('/send-otp', async (req, res) => {
  const { recipient } = req.body;
  
  if (!recipient) {
    return res.status(400).json({ success: false, message: 'Recipient phone or email is required' });
  }

  // Generate random 4-digit verification code
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Store OTP (valid for 5 minutes)
  otpStore[recipient] = {
    otp,
    expires: Date.now() + 5 * 60 * 1000
  };

  // Log to terminal console in magenta highlights
  console.log(`\n\x1b[45m\x1b[37m [OTP SYSTEM] Verification Code for ${recipient} is: ${otp} \x1b[0m\n`);

  // Check recipient type
  const isPhone = /^\+?[0-9\s\-()]{7,15}$/.test(recipient);
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient);
  let twilioSuccess = false;
  let sendgridSuccess = false;

  if (isPhone && twilioClient && process.env.TWILIO_PHONE_NUMBER) {
    try {
      await twilioClient.messages.create({
        body: `Your LifeLine verification code is: ${otp}. Valid for 5 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: recipient 
      });
      console.log(`\x1b[32m[SMS] Verification code successfully sent via Twilio to ${recipient}\x1b[0m`);
      twilioSuccess = true;
    } catch (smsErr) {
      console.error(`\x1b[31m[SMS Error] Failed to send SMS via Twilio to ${recipient}: ${smsErr.message}\x1b[0m`);
    }
  } else if (isEmail && process.env.SENDGRID_API_KEY) {
    try {
      const msg = {
        to: recipient,
        from: process.env.SENDGRID_SENDER_EMAIL || 'no-reply@lifelinefinder.org', // verified sender email
        subject: 'LifeLine Email Verification Code',
        text: `Your LifeLine verification code is: ${otp}. Valid for 5 minutes.`,
        html: `<div style="font-family: Arial, sans-serif; padding: 24px; border: 1px solid #e11d48; border-radius: 12px; background-color: #0f1626; color: #f8fafc;">
                 <h2 style="color: #e11d48; margin-bottom: 16px;">LifeLine Verification</h2>
                 <p style="font-size: 1.05rem;">Your systematic email verification code is:</p>
                 <div style="font-size: 2.2rem; font-weight: 800; color: #f43f5e; margin: 20px 0; letter-spacing: 4px; font-family: monospace;">${otp}</div>
                 <p style="color: #94a3b8; font-size: 0.85rem;">This code is valid for 5 minutes. Please enter it in the registration form to proceed.</p>
               </div>`
      };
      await sgMail.send(msg);
      console.log(`\x1b[32m[Email] Verification code successfully sent via SendGrid to ${recipient}\x1b[0m`);
      sendgridSuccess = true;
    } catch (emailErr) {
      console.error(`\x1b[31m[Email Error] Failed to send email via SendGrid: ${emailErr.message}\x1b[0m`);
    }
  }

  let message = `Verification code sent to ${recipient}`;
  if (twilioSuccess) message = `Verification code sent via SMS to ${recipient}`;
  else if (sendgridSuccess) message = `Verification code sent via Email to ${recipient}`;

  res.status(200).json({
    success: true,
    message
  });
});

// @route   POST /api/auth/verify-otp
// @desc    Verify the generated OTP systematically on the server
// @access  Public
router.post('/verify-otp', (req, res) => {
  const { recipient, otp } = req.body;

  if (!recipient || !otp) {
    return res.status(400).json({ success: false, message: 'Please provide recipient and OTP code' });
  }

  const record = otpStore[recipient];

  if (!record) {
    return res.status(400).json({ success: false, message: 'No OTP requested for this address/number' });
  }

  if (Date.now() > record.expires) {
    delete otpStore[recipient];
    return res.status(400).json({ success: false, message: 'Verification code has expired' });
  }

  if (record.otp !== otp.toString().trim()) {
    return res.status(400).json({ success: false, message: 'Invalid verification code' });
  }

  // Verification successful, delete code to prevent re-use
  delete otpStore[recipient];

  res.status(200).json({
    success: true,
    message: 'Contact detail verified successfully'
  });
});

module.exports = router;
