const express = require('express');
const router = express.Router();
const Razorpay = require('razorpay');

// Initialize Razorpay client. Fallback to the user's provided test credentials!
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_St6QNdpzAqE1Hx',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'bLHO78oz2XFq447l07rinbIL'
});

// @route   POST /api/payment/order
// @desc    Create a new Razorpay checkout order
// @access  Public
router.post('/order', async (req, res) => {
  try {
    const { amount } = req.body; // In INR Rupees

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Please provide a valid donation amount' });
    }

    const options = {
      amount: Math.round(amount * 100), // convert rupees to paise
      currency: 'INR',
      receipt: `donation_rcpt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);
    
    console.log(`\x1b[32m[Razorpay] Created donation order: ${order.id} for ₹${amount}\x1b[0m`);

    res.status(200).json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate donation gateway order' });
  }
});

module.exports = router;
