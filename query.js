const { connectDB, isMongo, jsonDb } = require('./config/db');
const Donor = require('./models/Donor');
const BloodRequest = require('./models/BloodRequest');
require('dotenv').config();

const run = async () => {
  // Connect to the DB (MongoDB or JSON fallback)
  await connectDB();
  
  console.log('\n=============================================');
  console.log('       LIFELINE DATABASE QUERY TOOL          ');
  console.log('=============================================\n');

  const args = process.argv.slice(2);
  const command = args[0] || 'summary';

  if (command === 'summary') {
    if (isMongo()) {
      const totalDonors = await Donor.countDocuments();
      const approvedDonors = await Donor.countDocuments({ status: 'Approved' });
      const pendingDonors = await Donor.countDocuments({ status: 'Pending' });
      const activeRequests = await BloodRequest.countDocuments({ status: 'Pending' });
      
      console.log(`[Mode] MongoDB Active`);
      console.log(`- Total Donors: ${totalDonors}`);
      console.log(`  * Approved: ${approvedDonors}`);
      console.log(`  * Pending: ${pendingDonors}`);
      console.log(`- Active Blood Requests: ${activeRequests}`);
    } else {
      const donors = jsonDb.read('donors.json');
      const requests = jsonDb.read('requests.json');
      const approvedDonors = donors.filter(d => d.status === 'Approved').length;
      const pendingDonors = donors.filter(d => d.status === 'Pending').length;
      
      console.log(`[Mode] Local JSON Files Active`);
      console.log(`- Total Donors: ${donors.length}`);
      console.log(`  * Approved: ${approvedDonors}`);
      console.log(`  * Pending: ${pendingDonors}`);
      console.log(`- Active Blood Requests: ${requests.filter(r => r.status === 'Pending').length}`);
    }
    console.log('\nUsage info:');
    console.log('  node query.js donors      (Lists approved, available donors)');
    console.log('  node query.js requests    (Lists pending blood requests)');
  } 
  
  else if (command === 'donors') {
    if (isMongo()) {
      const list = await Donor.find({ status: 'Approved', isAvailable: true }).limit(5);
      console.log(`--- Approved, Available Donors (First 5 shown) ---`);
      list.forEach(d => {
        console.log(`* [${d.bloodGroup}] Name: ${d.fullName} | City/Area: ${d.city} | Phone: ${d.phone}`);
      });
    } else {
      const list = jsonDb.read('donors.json')
        .filter(d => d.status === 'Approved' && d.isAvailable === true)
        .slice(0, 5);
      console.log(`--- Approved, Available Donors (First 5 shown) ---`);
      list.forEach(d => {
        console.log(`* [${d.bloodGroup}] Name: ${d.fullName} | City/Area: ${d.city} | Phone: ${d.phone}`);
      });
    }
  } 
  
  else if (command === 'requests') {
    if (isMongo()) {
      const list = await BloodRequest.find({ status: 'Pending' }).limit(5);
      console.log(`--- Active Blood Requests (First 5 shown) ---`);
      list.forEach(r => {
        console.log(`* [${r.bloodGroup}] Patient: ${r.patientName} | Urgency: ${r.urgency} | Hospital: ${r.hospitalName}`);
      });
    } else {
      const list = jsonDb.read('requests.json')
        .filter(r => r.status === 'Pending')
        .slice(0, 5);
      console.log(`--- Active Blood Requests (First 5 shown) ---`);
      list.forEach(r => {
        console.log(`* [${r.bloodGroup}] Patient: ${r.patientName} | Urgency: ${r.urgency} | Hospital: ${r.hospitalName}`);
      });
    }
  } 
  
  else {
    console.log('Unknown query. Use "summary", "donors", or "requests".');
  }
  
  console.log('\n=============================================');
  process.exit(0);
};

run();
