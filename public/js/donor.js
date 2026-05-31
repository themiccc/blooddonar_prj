// Donor Dashboard client side operations

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Verify access privileges
  if (!token || role !== 'donor') {
    showAlert('Access denied. Please login first.', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1000);
    return;
  }

  // Load Dashboard Data
  fetchDonorData();

  // Setup tabs
  setupTabs();

  // Handle Form Submission
  const profileForm = document.getElementById('update-profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', handleProfileUpdate);
  }

  // Handle Availability Toggle
  const availToggle = document.getElementById('availability-toggle');
  if (availToggle) {
    availToggle.addEventListener('change', handleAvailabilityToggle);
  }

  // Close request modal when clicking outside content
  const requestModalOverlay = document.getElementById('request-contact-modal');
  if (requestModalOverlay) {
    requestModalOverlay.addEventListener('click', (e) => {
      if (e.target === requestModalOverlay) window.closeRequestContactModal();
    });
  }
});

// Setup sidebar tabs functionality
function setupTabs() {
  const links = document.querySelectorAll('.sidebar-link');
  const sections = document.querySelectorAll('.dashboard-sec');

  links.forEach(link => {
    link.addEventListener('click', () => {
      const target = link.getAttribute('data-target');

      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      sections.forEach(sec => {
        sec.style.display = 'none';
        if (sec.id === target) {
          sec.style.display = 'flex';
          if (target === 'sec-requests') {
            loadMatchingRequests();
          }
        }
      });
    });
  });
}

// Fetch donor session details
async function fetchDonorData() {
  try {
    const res = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const data = await res.json();

    if (data.success) {
      const donor = data.user;
      
      // Update header
      document.getElementById('donor-welcome-name').textContent = donor.name;
      document.getElementById('donor-meta-blood').textContent = donor.bloodGroup;
      document.getElementById('donor-meta-city').textContent = donor.city;
      
      // Set status badge
      const statusBadge = document.getElementById('donor-status-badge');
      statusBadge.textContent = donor.status;
      statusBadge.className = `badge badge-${donor.status.toLowerCase()}`;

      // Set verification status text
      const verificationStatus = document.getElementById('donor-verification-status');
      if (verificationStatus) {
        if (donor.status === 'Approved') {
          verificationStatus.textContent = 'Approved by Administrator';
          verificationStatus.style.color = 'var(--success)';
        } else if (donor.status === 'Rejected') {
          verificationStatus.textContent = 'Rejected by Administrator';
          verificationStatus.style.color = 'var(--danger)';
        } else {
          verificationStatus.textContent = 'Pending Administrative Approval';
          verificationStatus.style.color = 'var(--warning)';
        }
      }

      // Update Form Fields
      document.getElementById('profile-name').value = donor.name;
      document.getElementById('profile-age').value = donor.age;
      document.getElementById('profile-gender').value = donor.gender;
      document.getElementById('profile-blood').value = donor.bloodGroup;
      document.getElementById('profile-mobile').value = donor.mobile;
      document.getElementById('profile-address').value = donor.address;
      document.getElementById('profile-city').value = donor.city;

      // Update Availability Checkbox
      const availToggle = document.getElementById('availability-toggle');
      availToggle.checked = donor.isAvailable;
      
      // Set status display text
      document.getElementById('availability-status-text').textContent = 
        donor.isAvailable ? 'AVAILABLE FOR DONATION' : 'TEMPORARILY UNAVAILABLE';
      
      const avBadge = document.getElementById('avail-badge-header');
      avBadge.textContent = donor.isAvailable ? 'Active' : 'Inactive';
      avBadge.className = `badge ${donor.isAvailable ? 'badge-available' : 'badge-unavailable'}`;

      // Load matching requests in background
      loadMatchingRequests();
    } else {
      localStorage.clear();
      window.location.href = 'login.html';
    }
  } catch (err) {
    console.error('Error fetching donor profile:', err);
    showAlert('Failed to connect to the server', 'error');
  }
}

// Handle Profile Form Submission
async function handleProfileUpdate(e) {
  e.preventDefault();

  const name = document.getElementById('profile-name').value;
  const age = document.getElementById('profile-age').value;
  const gender = document.getElementById('profile-gender').value;
  const bloodGroup = document.getElementById('profile-blood').value;
  const mobile = document.getElementById('profile-mobile').value;
  const address = document.getElementById('profile-address').value;
  const city = document.getElementById('profile-city').value;

  try {
    const res = await fetch('/api/donor/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ name, age, gender, bloodGroup, mobile, address, city })
    });

    const data = await res.json();

    if (data.success) {
      showAlert('Profile details updated successfully!', 'success');
      // Refresh UI details
      fetchDonorData();
    } else {
      showAlert(data.message || 'Profile update failed', 'error');
    }
  } catch (err) {
    console.error(err);
    showAlert('Error saving profile changes', 'error');
  }
}

// Toggle Donor Availability Status
async function handleAvailabilityToggle(e) {
  const isAvailable = e.target.checked;

  try {
    const res = await fetch('/api/donor/availability', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ isAvailable })
    });

    const data = await res.json();

    if (data.success) {
      showAlert(data.message, 'success');
      document.getElementById('availability-status-text').textContent = 
        isAvailable ? 'AVAILABLE FOR DONATION' : 'TEMPORARILY UNAVAILABLE';
      
      const avBadge = document.getElementById('avail-badge-header');
      avBadge.textContent = isAvailable ? 'Active' : 'Inactive';
      avBadge.className = `badge ${isAvailable ? 'badge-available' : 'badge-unavailable'}`;
    } else {
      showAlert('Failed to update availability status', 'error');
      // Revert checkbox state
      e.target.checked = !isAvailable;
    }
  } catch (err) {
    console.error(err);
    showAlert('Network error updating availability', 'error');
    e.target.checked = !isAvailable;
  }
}

// Fetch and load blood requests matching the donor's blood group
async function loadMatchingRequests() {
  const reqTableBody = document.getElementById('matching-requests-body');
  if (!reqTableBody) return;

  reqTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center;">Loading requests...</td></tr>`;

  try {
    const res = await fetch('/api/donor/requests', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    const data = await res.json();

    if (data.success) {
      // Store globally for access by the contact modal
      window.matchingRequestsData = data.data;

      if (data.data.length === 0) {
        reqTableBody.innerHTML = `
          <tr>
            <td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">
              No matching blood requests at the moment.
            </td>
          </tr>
        `;
        return;
      }

      reqTableBody.innerHTML = '';
      data.data.forEach(req => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${req.patientName}</strong></td>
          <td><span class="badge badge-rejected">${req.bloodGroup}</span></td>
          <td>${req.hospitalName}</td>
          <td>${req.location}</td>
          <td><span class="badge badge-${req.urgency.toLowerCase()}">${req.urgency}</span></td>
          <td>${formatDate(req.requestDate)}</td>
          <td>
            <button onclick="openRequestContactModal('${req._id}')" class="btn btn-primary btn-sm" style="padding: 4px 10px; font-size: 0.75rem; border: none; cursor: pointer;">Contact Patient</button>
          </td>
        `;
        reqTableBody.appendChild(tr);
      });
    } else {
      reqTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Failed to load requests</td></tr>`;
    }
  } catch (err) {
    console.error(err);
    reqTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Error loading requests</td></tr>`;
  }
}

window.openRequestContactModal = function(reqId) {
  const req = window.matchingRequestsData.find(r => r._id === reqId);
  if (!req) return;

  const modal = document.getElementById('request-contact-modal');
  if (!modal) return;

  document.getElementById('modal-patient-name').textContent = req.patientName;
  document.getElementById('modal-patient-blood').textContent = req.bloodGroup;
  document.getElementById('modal-patient-hospital').textContent = req.hospitalName;
  document.getElementById('modal-patient-location').textContent = req.location;
  document.getElementById('modal-patient-phone').textContent = req.contactNumber;

  const callBtn = document.getElementById('modal-patient-call-btn');
  callBtn.href = `tel:${req.contactNumber}`;
  callBtn.textContent = `📞 Call Patient / Requester (${req.contactNumber})`;

  modal.style.display = 'flex';
};

window.closeRequestContactModal = function() {
  const modal = document.getElementById('request-contact-modal');
  if (modal) modal.style.display = 'none';
};
