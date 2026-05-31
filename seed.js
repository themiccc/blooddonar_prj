const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config();

const { connectDB, isMongo, jsonDb } = require('./config/db');
const mongoose = require('mongoose');

// REQUIRE model files to register Mongoose schemas!
const Donor = require('./models/Donor');
const Admin = require('./models/Admin');
const BloodRequest = require('./models/BloodRequest');

// Names arrays for dynamic generation
const firstNames = ['Aarav', 'Vihaan', 'Aditya', 'Arjun', 'Krishna', 'Ishaan', 'Shaurya', 'Pranav', 'Aryan', 'Kabir', 'Rohan', 'Ananya', 'Diya', 'Ishika', 'Aanya', 'Kavya', 'Priya', 'Riya', 'Saanvi', 'Neha', 'Sneha', 'Rahul', 'Amit', 'Sanjay', 'Vikram', 'Divya', 'Deepak', 'Aakash', 'Karan', 'Pooja', 'Anjali', 'Meera', 'Ravi', 'Vijay', 'Rajesh', 'Suresh', 'Manish', 'Alok', 'Preeti', 'Swati', 'Raj', 'Simran', 'Gaurav', 'Aditi', 'Shruti', 'Varun', 'Nisha', 'Rakesh', 'Rohit', 'Yash', 'Kunal', 'Dev', 'Sameer', 'Nikita', 'Ritu', 'Tanvi', 'Abhishek', 'Vivek', 'Siddharth', 'Manohar', 'Sunita', 'Geeta', 'Sita', 'Hari', 'Manoj', 'Prasad', 'Raman', 'Arvind'];
const lastNames = ['Sharma', 'Verma', 'Kumar', 'Singh', 'Patel', 'Reddy', 'Nair', 'Rao', 'Joshi', 'Gupta', 'Iyer', 'Choudhury', 'Mehta', 'Kulkarni', 'Deshmukh', 'Mishra', 'Pandey', 'Sen', 'Roy', 'Das', 'Bose', 'Chatterjee', 'Banerjee', 'Pillai', 'Shetty', 'Hegde', 'Gowda', 'Naidu', 'Raju', 'Acharya', 'Menon', 'Bhat', 'Babu', 'Prasad', 'Dubey', 'Trivedi', 'Jha', 'Sinha', 'Chawla', 'Kapoor', 'Wadhwa', 'Khanna', 'Malhotra', 'Mehra', 'Soni', 'Gill', 'Joshi', 'Bhasin', 'Bahl', 'Johar', 'Dutta', 'Mukherjee', 'Nandi', 'Chakraborty'];

// Locations arrays
const blrAreas = [
  'Whitefield, Bengaluru',
  'Koramangala, Bengaluru',
  'Indiranagar, Bengaluru',
  'HSR Layout, Bengaluru',
  'Jayanagar, Bengaluru',
  'Malleshwaram, Bengaluru',
  'JP Nagar, Bengaluru',
  'Marathahalli, Bengaluru',
  'Hebbal, Bengaluru',
  'Electronic City, Bengaluru',
  'Basavanagudi, Bengaluru',
  'Yelahanka, Bengaluru',
  'BTM Layout, Bengaluru',
  'Banashankari, Bengaluru',
  'Rajajinagar, Bengaluru',
  'Bellandur, Bengaluru',
  'Sarjapur Road, Bengaluru',
  'Richmond Town, Bengaluru',
  'Sadashivanagar, Bengaluru',
  'Cunningham Road, Bengaluru'
];

const otherLocations = [
  'Andheri, Mumbai',
  'Bandra, Mumbai',
  'Colaba, Mumbai',
  'Dadar, Mumbai',
  'Borivali, Mumbai',
  'Dwarka, Delhi',
  'Saket, Delhi',
  'Connaught Place, Delhi',
  'Karol Bagh, Delhi',
  'Vasant Kunj, Delhi',
  'Anna Nagar, Chennai',
  'Adyar, Chennai',
  'Velachery, Chennai',
  'T. Nagar, Chennai',
  'Salt Lake, Kolkata',
  'Gariahat, Kolkata',
  'New Town, Kolkata',
  'Gachibowli, Hyderabad',
  'Jubilee Hills, Hyderabad',
  'Madhapur, Hyderabad',
  'Kothrud, Pune',
  'Viman Nagar, Pune',
  'Hinjawadi, Pune',
  'Satellite, Ahmedabad',
  'C.G. Road, Ahmedabad',
  'Malviya Nagar, Jaipur',
  'C-Scheme, Jaipur',
  'Hazratganj, Lucknow',
  'Gomti Nagar, Lucknow',
  'Kadavanthra, Kochi',
  'Edappally, Kochi'
];

// Hospitals
const blrHospitals = [
  'Apollo Hospitals - Bannerghatta Road, Bilekahalli',
  'Apollo Hospitals - Jayanagar',
  'Manipal Hospital - HAL Old Airport Road',
  'Manipal Hospital - Whitefield',
  'Manipal Hospital - Malleshwaram',
  'Fortis Hospital - Bannerghatta Road, Bilekahalli',
  'Fortis Hospital - Cunningham Road',
  'Fortis Hospital - Rajajinagar',
  'NIMHANS - Hosur Road, Lakkasandra',
  'Narayana Health City - Bommasandra, Hosur Road',
  'Sakra World Hospital - Marathahalli Outer Ring Road',
  'Aster CMI Hospital - Hebbal',
  'Aster RV Hospital - JP Nagar',
  'St. John\'s Medical College Hospital - Sarjapur Road, Koramangala',
  'MS Ramaiah Memorial Hospital - New BEL Road, MSR Nagar',
  'Sagar Hospitals - Jayanagar',
  'Victoria Hospital - KR Market',
  'Vydehi Institute of Medical Sciences - Whitefield',
  'KC General Hospital - Malleshwaram',
  'Sparsh Hospital - Yeshwanthpur',
  'Cloudnine Hospital - Jayanagar',
  'Motherhood Hospital - Indiranagar',
  'Command Hospital (Air Force) - Cambridge Road'
];

const otherHospitals = [
  'Lilavati Hospital & Research Centre, Mumbai',
  'Kokilaben Dhirubhai Ambani Hospital, Mumbai',
  'Tata Memorial Hospital, Mumbai',
  'Fortis Hospital, Mumbai',
  'AIIMS, New Delhi',
  'Sir Ganga Ram Hospital, New Delhi',
  'Apollo Hospital, New Delhi',
  'Max Super Speciality Hospital, New Delhi',
  'Apollo Hospitals, Chennai',
  'Fortis Malar Hospital, Chennai',
  'Fortis Medical Centre, Kolkata',
  'AMRI Hospitals, Kolkata',
  'Apollo Health City, Hyderabad',
  'Yashoda Hospitals, Hyderabad',
  'Ruby Hall Clinic, Pune',
  'Jehangir Hospital, Pune',
  'KIMS Hospital, Kochi',
  'Aster Medcity, Kochi'
];

// Random Helpers
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const genders = ['Male', 'Female', 'Other'];
const streetNames = ['Mahatma Gandhi Road', 'Double Road', 'Ring Road', 'Link Road', 'Main Road', 'Cross Road', 'Club Road', 'Park Lane', 'Garden View Road', 'Orchard Street'];
const apartmentNames = ['Green Glen Layout', 'Shanti Niketan Apartments', 'Prestige Shantiniketan', 'Sobha Jasmine', 'Brigade Metropolis', 'L&T South City', 'DLF Westend Heights', 'Purva Riviera'];
const urgencies = ['Normal', 'Urgent', 'Emergency'];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const generateLocationAndHospital = () => {
  const isBlr = Math.random() < 0.6; // 60% Bengaluru
  if (isBlr) {
    return {
      city: getRandomElement(blrAreas),
      hospital: getRandomElement(blrHospitals)
    };
  } else {
    return {
      city: getRandomElement(otherLocations),
      hospital: getRandomElement(otherHospitals)
    };
  }
};

const generateUniquePhone = () => {
  return `+91${Math.floor(6000000000 + Math.random() * 3999999999)}`;
};

const generateAddress = () => {
  const flatNumber = Math.floor(100 + Math.random() * 900);
  const wing = getRandomElement(['A', 'B', 'C', 'D']);
  const apartment = getRandomElement(apartmentNames);
  const street = getRandomElement(streetNames);
  return `Flat ${flatNumber}, Wing ${wing}, ${apartment}, ${street}`;
};

const seedData = async () => {
  console.log('Connecting to database for seeding...');
  await connectDB();

  console.log('Generating seed datasets...');
  const salt = await bcrypt.genSalt(10);
  // Pre-hash password123 to reuse for fast inserts (prevents CPU lockup on 600+ hashes)
  const passwordHash = await bcrypt.hash('admin123', salt);

  // Generate Admin
  const adminList = [
    { username: 'admin', password: passwordHash }
  ];

  // Generate Donors (~210 of each category: Approved, Pending, Rejected)
  const donorList = [];
  const totalCategoryCount = 210;

  const emailTracker = new Set();

  const createDonor = (status) => {
    let fName = getRandomElement(firstNames);
    let lName = getRandomElement(lastNames);
    let email = `${fName.toLowerCase()}.${lName.toLowerCase()}.${Math.floor(Math.random() * 10000)}@lifeline-test.org`;
    
    // Ensure email unique check
    while (emailTracker.has(email)) {
      fName = getRandomElement(firstNames);
      lName = getRandomElement(lastNames);
      email = `${fName.toLowerCase()}.${lName.toLowerCase()}.${Math.floor(Math.random() * 10000)}@lifeline-test.org`;
    }
    emailTracker.add(email);

    const { city } = generateLocationAndHospital();

    return {
      name: `${fName} ${lName}`,
      age: Math.floor(18 + Math.random() * 48), // 18-65
      gender: getRandomElement(genders),
      bloodGroup: getRandomElement(bloodGroups),
      mobile: generateUniquePhone(),
      email,
      password: passwordHash,
      address: generateAddress(),
      city,
      isAvailable: status === 'Approved' ? Math.random() < 0.85 : true, // 85% available if approved
      status
    };
  };

  // Approved Donors
  for (let i = 0; i < totalCategoryCount; i++) {
    donorList.push(createDonor('Approved'));
  }
  // Pending Donors
  for (let i = 0; i < totalCategoryCount; i++) {
    donorList.push(createDonor('Pending'));
  }
  // Rejected Donors
  for (let i = 0; i < totalCategoryCount; i++) {
    donorList.push(createDonor('Rejected'));
  }

  // Generate Blood Requests (~210 of each category: Pending, Fulfilled)
  const requestList = [];

  const createRequest = (status) => {
    const fName = getRandomElement(firstNames);
    const lName = getRandomElement(lastNames);
    const { city, hospital } = generateLocationAndHospital();
    // requests are recent (last 3 days)
    const requestDate = new Date(Date.now() - Math.floor(Math.random() * 3 * 24 * 3600 * 1000));

    return {
      patientName: `${fName} ${lName}`,
      bloodGroup: getRandomElement(bloodGroups),
      hospitalName: hospital,
      contactNumber: generateUniquePhone(),
      location: city,
      urgency: getRandomElement(urgencies),
      requestDate,
      status
    };
  };

  // Pending Requests
  for (let i = 0; i < totalCategoryCount; i++) {
    requestList.push(createRequest('Pending'));
  }
  // Fulfilled Requests
  for (let i = 0; i < totalCategoryCount; i++) {
    requestList.push(createRequest('Fulfilled'));
  }

  console.log(`Generated ${donorList.length} Donors and ${requestList.length} Blood Requests.`);

  if (isMongo()) {
    console.log('[Seeder] Seeding MongoDB with high-volume database...');
    try {
      const MongooseDonor = mongoose.model('Donor');
      const MongooseAdmin = mongoose.model('Admin');
      const MongooseBloodRequest = mongoose.model('BloodRequest');

      // Clear collections
      await MongooseAdmin.deleteMany({});
      await MongooseDonor.deleteMany({});
      await MongooseBloodRequest.deleteMany({});
      console.log('Existing collections cleared.');

      // Insert new data
      await MongooseAdmin.insertMany(adminList);
      await MongooseDonor.insertMany(donorList);
      await MongooseBloodRequest.insertMany(requestList);
      
      console.log('\x1b[32m[Seeder] MongoDB successfully seeded with 1000+ entries!\x1b[0m');
    } catch (err) {
      console.error('Seeding MongoDB error:', err);
    } finally {
      mongoose.connection.close();
      console.log('MongoDB connection closed.');
    }
  } else {
    console.log('[Seeder] Seeding local JSON database with high-volume database...');
    // Clear & seed JSON database
    jsonDb.write('admins.json', adminList.map((a, index) => ({ _id: `admin-${index}`, ...a })));
    jsonDb.write('donors.json', donorList.map((d, index) => ({ _id: `donor-${index}`, ...d })));
    jsonDb.write('requests.json', requestList.map((r, index) => ({ _id: `req-${index}`, ...r })));
    
    console.log('\x1b[32m[Seeder] Local JSON Database successfully seeded with 1000+ entries!\x1b[0m');
  }
};

seedData();
