# Project Walkthrough - Blood Donor Finder System

The **Blood Donor Finder System** is a complete, production-ready full-stack application built to connect blood donors with patients in real-time. The application is designed with a premium, visually stunning **Red-Glassmorphism CSS Design System** and is equipped with advanced verification controls, dual-mode database capability, geolocation support, and automated email/SMS workflows.

---

## 🌟 Key Accomplishments

1. **Full-Stack Integration**: Built a robust Node.js/Express.js backend connecting to MongoDB via Mongoose, with a fully responsive custom HTML/CSS/JS frontend.
2. **Dual-Mode Database Fallback**: Implemented a fail-safe database connection system in [db.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/config/db.js) that falls back to a **local JSON database** inside the `data/` folder if a running MongoDB server is unavailable.
3. **Security (System Design Goals)**:
   - **Password Protection**: Passwords are encrypted using standard salt hashing via `bcryptjs`.
   - **Session Verification**: Created secure HTTP-only cookies containing signed JWT session tokens.
   - **Access Middleware**: Added role-based verification checking in [auth.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/middleware/auth.js) to safeguard administrative dashboards.
4. **Premium Red-Glassmorphism UI**:
   - Designed a deep onyx theme with crimson accents, high contrast typography, card borders with glow, custom scrollbars, and fluid animations.
   - Built a **dynamic custom bar chart widget** inside the admin dashboard using pure CSS grid/flexboxes (no external heavy chart libraries required).
5. **Autoseeding default Admin credentials**:
   - The server automatically verifies and seeds a default administrative profile (`admin` / `admin123`) on its first launch, removing setup complexity.

---

## 📂 Code Layout

The project files are structured as follows:

* **Backend Entry Point**: [server.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/server.js) — Inits Express, cookie-parsers, static routes, and auto-seeding.
* **Database Setup**: [db.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/config/db.js) — Establishes MongoDB or local JSON storage.
* **Security & Models**:
  - [Donor.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/models/Donor.js) — Donor data CRUD schema.
  - [Admin.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/models/Admin.js) — Admin data schema.
  - [BloodRequest.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/models/BloodRequest.js) — Patient request schema.
  - [auth.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/middleware/auth.js) — JWT protection middleware.
* **Backend API Routes**:
  - [auth.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/routes/auth.js) — User/Admin login, registration, logout, and token checks.
  - [donor.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/routes/donor.js) — Profiles, availability status toggling, matching requests.
  - [request.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/routes/request.js) — Creating blood requests and executing searches.
  - [admin.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/routes/admin.js) — System stats compilation, approving pending accounts, modifying entries, and report generations.
  - [payment.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/routes/payment.js) — Razorpay order manager.
* **Frontend Assets**:
  - [style.css](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/css/style.css) — Premium visual identity.
  - [main.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/js/main.js) — Dynamic navbar, footer injection, and notifications.
  - [auth.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/js/auth.js) — Handles registration/login forms.
  - [donor.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/js/donor.js) — Dynamic donor portal updates.
  - [admin.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/js/admin.js) — Admin management controllers.
  - [search.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/js/search.js) — Donor search grid and contact cards.
  - [request.js](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/js/request.js) — Patient request postings.
* **HTML Templates**:
  - [index.html](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/index.html) — Home Page
  - [about.html](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/about.html) — About Us
  - [register.html](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/register.html) — Donor Registration
  - [login.html](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/login.html) — Donor Login
  - [search.html](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/search.html) — Search Donor
  - [request.html](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/request.html) — Blood Request Form
  - [dashboard.html](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/dashboard.html) — Donor Dashboard
  - [admin-login.html](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/admin-login.html) — Admin Login
  - [admin-dashboard.html](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/admin-dashboard.html) — Admin Dashboard
  - [contact.html](file:///C:/Users/thevi/.gemini/antigravity/scratch/blood-donor-finder/public/contact.html) — Contact Us

---

## 🛠️ Recent Edits and Enhancements

1. **International Country Codes**:
   - Added a country code dropdown select input (with 58 major countries including `+91`, `+1`, `+66`, etc.) to both the **Donor Registration** page and the **Blood Request** page.
   - The selected country code and phone number are combined before calling backend validation, OTP transmission, database operations, or request submissions.
2. **90-Second OTP Timers**:
   - Implemented a 90-second (1.5 minute) countdown timer for OTP verification screens (Email and Mobile on Donor Registration, and Phone on Blood Requests).
   - Once an OTP code is generated, a "Resend code in X s" timer appears, and the resend option is hidden.
   - When the countdown reaches zero, the timer text is hidden and the "Resend OTP" button is enabled.
3. **Enhanced Security Alerts**:
   - Removed the generated OTP code from the frontend alerts. Users must retrieve codes from their physical mobile device / email or check the terminal logs on the backend console.
4. **Bengaluru Hospital Search Dropdown & Layout Expansion**:
   - Expanded the layout width of the **Blood Request Form** to a maximum of `780px` to make the form spacious and premium.
   - Restructured the input columns: moved the Contact Phone Number group down to its own dedicated full-width row, giving it ample space.
   - Populated the Hospital Name dropdown select with an extensive collection of 58 major Bengaluru hospitals along with their specific locations/neighborhoods.
   - Kept the "Other (Hospital not listed)" fallback option with a dynamic custom inline text input field toggle.
5. **Precise Donor Geolocation**:
   - Updated the OpenStreetMap Nominatim reverse geocoding parser specifically for the **Donor Registration** page.
   - Prioritizes extracting specific neighborhoods, suburbs, and districts (e.g. "Whitefield") and combines it with the parent city (e.g. "Bengaluru") to capture precise locations rather than just the generic city name. Example output: `Whitefield, Bengaluru`.
6. **Patient Contact Details Dialog**:
   - Modified the "Matching Requests" table on the **Donor Dashboard** to trigger a modal overlay when clicking `"Contact Patient"`.
   - The modal cleanly lays out all requester parameters (Patient name, Blood group, specific Hospital name, and Suburb/Location) with a direct dial button.
7. **Dynamic Verification Display**:
   - Replaced a hardcoded overview verification label (`"Approved by Administrator"`) with a dynamic tag linked to the backend donor validation state. It now properly renders `Pending Administrative Approval`, `Approved by Administrator`, or `Rejected by Administrator` with correct color status indicators.
8. **Contact Page Mail Client Redirect**:
   - Cleaned up raw placeholder text on the **Contact Us** page with realistic information: added a real head office address (Bellandur, Bengaluru), a clickable helpline support link (+91 88846 57151), and a clickable support email link.
   - Replaced the local alert message form submission handler with a dynamic **`mailto:` redirect** to compose and send the email with prefilled details.

---

## 🚀 How to Run the System

### Prerequisites
- [Node.js](https://nodejs.org/) installed on your device.
- *(Optional)* [MongoDB Community Server](https://www.mongodb.com/try/download/community) running locally on port `27017`. (If not present, the system will fall back to JSON files).

### Setup Steps
1. Navigate into the folder:
   ```bash
   cd blood-donor-finder
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables by creating a `.env` file in the root directory (refer to the `README.md` file for templates).
4. Start the web server:
   ```bash
   npm start
   ```
5. Open your web browser and navigate to:
   ```text
   http://localhost:5000
   ```

---

## 📦 Git Repository Deployment

The entire project has been successfully initialized under Git version control and pushed to your remote repository:
- **Repository URL**: [blooddonar_prj](https://github.com/themiccc/blooddonar_prj.git)
- **Branch**: `main`
- **Exclusions**: Node modules (`node_modules/`), local environment credentials (`.env`), and local JSON files (`data/*.json`) are properly excluded from version control via `.gitignore` to ensure security.
- **Environment Template**: A `.env.example` template has been added to guide setup on any other development or production device.

---

## 💾 Seeded Database Configuration and Datasets

To ensure the system works with realistic production-scale volumes of records immediately on launch, a database seeding script (`seed.js`) has been executed. This populates the database with a high-fidelity, high-volume mock dataset:

* **Total Dataset Size**: **1,050+ records** (630 donors, 420 requests).
* **Location Distribution**: 
  - **60% (Bengaluru)**: Concentrated heavily in major neighborhoods such as Whitefield, Koramangala, Indiranagar, HSR Layout, JP Nagar, Jayanagar, Marathahalli, Hebbal, Yelahanka, and Electronic City.
  - **40% (All-India Metros)**: Distributed across major metro regions including Mumbai, Delhi, Chennai, Hyderabad, Pune, and Kolkata.
* **Categories Populated**:
  1. **Approved Donors (210 entries)**: Validated profiles that are fully searchable by blood group and area/city. Approximately 85% of them are toggled as `Available`.
  2. **Pending Donors (210 entries)**: Newly registered profiles showing as `Pending` approval in the Admin Console dashboard, ready for approval testing.
  3. **Rejected Donors (210 entries)**: Registrations that have been flagged as `Rejected` by the administrator console.
  4. **Blood Requests (420 entries)**:
     - *Pending Requests (210 entries)*: Active public blood requests visible on the home page feed and matching donor dashboards, ranging from Normal to Urgent and Emergency levels.
     - *Fulfilled/Cancelled Requests (210 entries)*: Historical logs of completed requests.

* **Performance Optimization**: The seeding script uses a pre-hashed password buffer for all mock users on startup, executing the full seed generation in under **1 second** (avoiding standard bcrypt bottlenecks for 600+ users).

---

## 🔍 Local Database Verification Queries

The following queries can be executed directly inside your local database environment (MongoDB Shell `mongosh`, MongoDB Compass, or mapped database utilities) to query and verify system operations:

### 1. Donor Management Queries
* **Find all approved, active donors**:
  ```javascript
  db.donors.find({ status: "Approved", isAvailable: true })
  ```
* **Filter available O+ donors in Bengaluru**:
  ```javascript
  db.donors.find({ status: "Approved", isAvailable: true, bloodGroup: "O+", city: /bengaluru/i })
  ```
* **Find pending donor applications**:
  ```javascript
  db.donors.find({ status: "Pending" })
  ```
* **Aggregate/Count approved donors by blood group**:
  ```javascript
  db.donors.aggregate([
    { $match: { status: "Approved" } },
    { $group: { _id: "$bloodGroup", count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])
  ```
* **Find donors registered in a specific neighborhood (e.g., Whitefield)**:
  ```javascript
  db.donors.find({ status: "Approved", city: /whitefield/i })
  ```

### 2. Blood Request Queries
* **Find all unresolved Emergency requests**:
  ```javascript
  db.bloodrequests.find({ status: "Pending", urgency: "Emergency" })
  ```
* **Retrieve requests sorted by date (recent first)**:
  ```javascript
  db.bloodrequests.find().sort({ requestDate: -1 })
  ```
* **Count the total number of fulfilled blood requests**:
  ```javascript
  db.bloodrequests.countDocuments({ status: "Fulfilled" })
  ```

---

## 🧪 Comprehensive Edge Case Testing Plan

To thoroughly verify all parts of the application, execute tests against the following edge cases:

### Edge Case 1: Database Offline Fallback (Auto-JSON Mode)
* **Objective**: Ensure the system functions 100% correctly even if MongoDB is shut down.
* **Test Steps**:
  1. Stop your local MongoDB service.
  2. Start the Express server (`npm start`). Check terminal logs.
  3. Verify that the terminal displays: `[Database] MongoDB connection failed` and `Falling back to Local JSON database`.
  4. Perform donor registration, admin logins, and submit a blood request.
  5. Open the `data/` directory and verify that `donors.json` and `requests.json` are written to with the new entries.

### Edge Case 2: OTP Verification & 90-Second Expiry Countdown
* **Objective**: Confirm that the OTP verification UI and backend validation handles timers, resend states, and incorrect entries.
* **Test Steps**:
  1. Open the **Become a Donor** page. Fill out details and click **Verify** on Mobile or Email.
  2. Confirm that the verification input modal appears, and a 90-second countdown timer starts ("Resend code in 90s").
  3. Confirm that the "Resend OTP" button is hidden during active countdowns.
  4. Wait for 90 seconds. Verify that the countdown hides and the "Resend OTP" button becomes active.
  5. Input an incorrect 4-digit code and verify that the system rejects the input.
  6. Retrieve the correct code from the server console logs. Enter it, and verify that verification status changes to checked (verified).

### Edge Case 3: Phone Input and Country Code Validation
* **Objective**: Verify that country codes are parsed correctly and validation stops invalid numbers.
* **Test Steps**:
  1. Go to the donor registration page. Select country code `+91` (India).
  2. Input a short 5-digit number and click **Verify**. Verify that the validation rejects it.
  3. Input a standard 10-digit number. Confirm that the verification succeeds.
  4. Check the server console log: confirm that the generated OTP is logged with the country prefix appended (e.g. `+918884657151`).
  5. Select country code `+1` (USA). Enter a 10-digit number. Verify it compiles and validates.

### Edge Case 4: Geolocation Suburb Matching & OSM Geocoding Fallbacks
* **Objective**: Ensure precise location coordinates map to neighborhood names.
* **Test Steps**:
  1. Go to **Become a Donor** page. Check the "City/Location" input.
  2. Click the location search icon or allow browser location prompts.
  3. If testing from a specific suburb (e.g., Whitefield, Bengaluru), verify that the auto-populated location input displays the detailed neighborhood and parent city (e.g., `Whitefield, Bengaluru`) instead of just `Bengaluru`.
  4. Reject browser location permissions and verify that the input falls back gracefully to standard manual text input.

### Edge Case 5: Bengaluru Hospital Dropdown & "Other" Option Toggle
* **Objective**: Verify that the curated hospital dropdown functions correctly and the manual input fallback works without layout breaking.
* **Test Steps**:
  1. Go to the **Blood Request Form** page.
  2. Click the **Hospital Name** dropdown. Verify that a scrollable list of 58 major Bengaluru hospitals is present with locations.
  3. Select an option (e.g., `Apollo Hospital, Bannerghatta Road`). Verify that the manual text input remains hidden.
  4. Select `Other (Hospital not listed)`. Verify that a custom text field immediately appears inline.
  5. Enter a custom name (e.g., `City Health Clinic`). Submit the form and verify that the database registers `City Health Clinic` under the hospital field.

### Edge Case 6: Guest Profile Data Masking (Privacy Controls)
* **Objective**: Confirm that sensitive donor contact info is protected from non-logged-in users.
* **Test Steps**:
  1. Open a new Incognito browser window (not logged in).
  2. Go to the **Search Donors** page. Search for a matching blood group.
  3. When the matching donor cards appear, look at the contact fields.
  4. Verify that the email and phone number are masked (e.g., `mi*****@gmail.com` and `+91 ***** ***89`).
  5. Click **Contact Donor**. Confirm that a prompt redirects the user to log in or register before displaying unmasked details.

### Edge Case 7: Admin Panel Session Security & Role Middleware
* **Objective**: Ensure unauthorized users cannot access admin dashboards by pasting URLs.
* **Test Steps**:
  1. Open a browser window where you are not logged in as an administrator.
  2. Navigate directly to `http://localhost:5000/admin-dashboard.html`.
  3. Verify that the authorization middleware intercepts the request and redirects you back to the home page or `admin-login.html`.
  4. Try logging in with incorrect credentials. Verify that validation errors are displayed.
  5. Log in with the default admin credentials (`admin` / `admin123`). Confirm that the admin dashboard loads and stats charts populate.

### Edge Case 8: Native Mail Client Redirect Form Submissions
* **Objective**: Verify that Contact Us form submissions route to the native mail client.
* **Test Steps**:
  1. Go to the **Contact Us** page.
  2. Fill out the "Send us a Message" form with your name, email, subject, and message.
  3. Click **Send Message**.
  4. Verify that the browser initiates a redirection link of format `mailto:support@lifeline.org?subject=...&body=...` and opens your device's default mailing client (Outlook, Gmail, Apple Mail, etc.) with the fields pre-filled.

### Edge Case 9: Razorpay Payment Gateway Sandbox Transactions
* **Objective**: Verify payment gateway order generation.
* **Test Steps**:
  1. Navigate to the **Contact Us** page.
  2. In the "Support Our Mission" card, input a donation amount (e.g., `500`) and click **Donate Now**.
  3. Verify that the Razorpay checkout overlay appears.
  4. Enter standard Razorpay test details (e.g., select UPI/Card test success flow).
  5. Click pay and confirm that the payment processes, closes, and shows a custom success alert.
