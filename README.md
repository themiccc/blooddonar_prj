# LifeLine - Blood Donor Finder System

LifeLine is a premium, full-stack, and highly secure web application designed to connect blood donors with patients in real-time. Built with a visually stunning **Red-Glassmorphism CSS Design System**, the application is fully responsive and integrates advanced verification controls.

---

## 🌟 Key Features

1. **Dual-Mode Database Fallback**: Auto-connects to MongoDB via Mongoose. If MongoDB is unavailable, it seamlessly falls back to a **local JSON database** (`data/` folder) with full CRUD support, ensuring 100% immediate functionality.
2. **Contact Detail Verification**: Integrated OTP verification flow for both email (SendGrid) and mobile phone numbers (Twilio) with a **90-second countdown timer** and a dynamic `"Resend OTP"` toggle.
3. **Secure Client Experience**:
   - Verification codes are stripped from frontend responses/alerts (printed to the server console and sent via Twilio/SendGrid).
   - Sensitive donor contact info (phone/email) is masked from guest users until a request matches or user logs in.
4. **Curated Bengaluru Hospital Select**: Curated list of **58 major hospitals in Bengaluru** including their exact locations/neighborhoods. Fallback option `"Other"` displays a custom text input field for manual entry.
5. **Precise Geolocation**: Integrated OSM Nominatim reverse lookup. Prioritizes specific neighborhoods (e.g. `Whitefield, Bengaluru`) for donor registrations.
6. **Inquiry Mail Redirects**: The Contact Us form automatically triggers the device's native mail app (Outlook, Gmail, Apple Mail) with pre-filled sender info and subject lines.
7. **Razorpay Donation Gateway**: Pre-configured Razorpay checkout integration for voluntary donations.
8. **Admin Panel**: Auto-seeded credentials (`admin` / `admin123`) to approve, reject, or delete donor profiles, view live stats, and print system reports.

---

## 📂 Project Structure

```text
blood-donor-finder/
├── config/
│   └── db.js                 # Database dual-mode manager (MongoDB + JSON fallback)
├── data/                     # Local JSON database folder (auto-created)
├── middleware/
│   └── auth.js               # JWT security role validation
├── models/
│   ├── Donor.js              # Dual-mode Donor model
│   ├── Admin.js              # Dual-mode Admin model
│   └── BloodRequest.js       # Dual-mode BloodRequest model
├── routes/
│   ├── auth.js               # User & Admin Login/Signup & OTP verification APIs
│   ├── donor.js              # Profile management & availability status APIs
│   ├── request.js            # Creating requests & regex location search APIs
│   ├── admin.js              # Report compiler & account approval controls
│   └── payment.js            # Razorpay sandbox order manager
├── public/                   # Pure CSS and Javascript frontend assets
└── server.js                 # Express server entry point
```

---

## 🚀 Quick Start & Installation

To run this project on a new machine, follow these instructions:

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your device.
- *(Optional)* [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally on port `27017`. (If not present, the system will fall back to JSON files).

### Setup Steps
1. Clone the repository and navigate into the folder:
   ```bash
   cd blood-donor-finder
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables by creating a `.env` file in the root directory (refer to the **Configuration** section below).
4. Seed the database with high-fidelity test records (creates 1,000+ mock Indian donors and requests):
   ```bash
   node seed.js
   ```
5. Start the web server:
   ```bash
   npm start
   ```
6. Open your web browser and navigate to:
   ```text
   http://localhost:5000
   ```

---

## ⚙️ Configuration (.env)

Create a `.env` file in the root folder with the following properties:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/blood_donor_finder
JWT_SECRET=supersecretkey_blood_donor_finder_2026

# Twilio Credentials (Mobile Verification)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# SendGrid Credentials (Email Verification)
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_SENDER_EMAIL=your_verified_sender_email

# Razorpay Keys (Donation Gateway Sandbox)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## 🛡️ Default Administrative Logins

Once seeded or launched, you can immediately access the Administrative Console:
- **URL**: `http://localhost:5000/admin-login.html`
- **Username**: `admin`
- **Password**: `admin123`
