// Unified Admin Dashboard console operations

let currentEditingDonorId = null;

document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // Verify access privileges
  if (!token || role !== 'admin') {
    showAlert('Admin authorisation required.', 'error');
    setTimeout(() => {
      window.location.href = 'admin-login.html';
    }, 1000);
    return;
  }

  // Load all parts of the console on start
  loadAllConsoleData();

  // Scroll Spy for sidebar link highlighting
  setupScrollSpy();
  
  // Handle filters in Donor Directory
  const filterStatus = document.getElementById('filter-donor-status');
  const filterBlood = document.getElementById('filter-donor-blood');
  if (filterStatus) filterStatus.addEventListener('change', () => loadDonors());
  if (filterBlood) filterBlood.addEventListener('change', () => loadDonors());

  // Edit Donor form submission
  const editDonorForm = document.getElementById('edit-donor-form');
  if (editDonorForm) {
    editDonorForm.addEventListener('submit', handleDonorEditSubmit);
  }
});

// Load all database fields on console refresh
function loadAllConsoleData() {
  fetchStats();
  loadPendingApprovals();
  loadRequests();
  loadDonors();
  generateReportView();
}

// Scroll spy logic
function setupScrollSpy() {
  const links = document.querySelectorAll('.sidebar-link');
  const sections = ['overview', 'approvals', 'requests', 'directory', 'reports'].map(s => ({
    link: document.getElementById(`link-${s}`),
    sec: document.getElementById(`sec-${s}`)
  }));

  window.addEventListener('scroll', () => {
    let currentActive = null;
    const scrollPos = window.scrollY + 150; // offset for nav

    sections.forEach(item => {
      if (item.sec && scrollPos >= item.sec.offsetTop) {
        currentActive = item.link;
      }
    });

    if (currentActive) {
      links.forEach(l => l.classList.remove('active'));
      currentActive.classList.add('active');
    }
  });
}

// Fetch dashboard numbers and charts
async function fetchStats() {
  try {
    const res = await fetch('/api/admin/stats', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const result = await res.json();

    if (result.success) {
      const data = result.data;
      
      // Update overview counts
      document.getElementById('stat-total-donors').textContent = data.donors.total;
      document.getElementById('stat-pending-donors').textContent = data.donors.pending;
      document.getElementById('stat-active-requests').textContent = data.requests.pending;
      document.getElementById('stat-fulfilled-requests').textContent = data.requests.fulfilled;

      // Render Blood Group Distribution CSS Bar Chart
      renderBloodChart(data.bloodGroups);
    }
  } catch (err) {
    console.error('Error fetching stats:', err);
    showAlert('Failed to retrieve statistics', 'error');
  }
}

// Render custom CSS chart bar
function renderBloodChart(groups) {
  const chartContainer = document.getElementById('blood-chart-container');
  if (!chartContainer) return;

  chartContainer.innerHTML = '';
  const maxVal = Math.max(...Object.values(groups), 1); // Avoid division by zero

  for (let [bg, count] of Object.entries(groups)) {
    const pct = (count / maxVal) * 100;
    const row = document.createElement('div');
    row.style.margin = '16px 0';
    row.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-weight: 600;">
        <span>Blood Group: ${bg}</span>
        <span style="color: var(--primary);">${count} Donors</span>
      </div>
      <div style="width: 100%; height: 12px; background: rgba(255,255,255,0.05); border-radius: 6px; overflow: hidden; border: 1px solid var(--border-light);">
        <div style="width: ${pct}%; height: 100%; background: linear-gradient(90deg, var(--primary), #ef4444); box-shadow: 0 0 10px var(--primary-glow); border-radius: 6px; transition: width 1s ease;"></div>
      </div>
    `;
    chartContainer.appendChild(row);
  }
}

// Fetch and load pending approvals queue
async function loadPendingApprovals() {
  const pendingTable = document.getElementById('admin-pending-approvals-body');
  if (!pendingTable) return;

  pendingTable.innerHTML = `<tr><td colspan="6" style="text-align: center;">Loading pending approvals...</td></tr>`;

  try {
    const res = await fetch(`/api/admin/donors?status=Pending`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        pendingTable.innerHTML = `
          <tr>
            <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 30px;">
              🎉 No pending approvals! All voluntary donor accounts are audited.
            </td>
          </tr>
        `;
        return;
      }

      pendingTable.innerHTML = '';
      data.data.forEach(donor => {
        const tr = document.createElement('tr');
        
        tr.innerHTML = `
          <td><strong>${donor.name}</strong></td>
          <td><span class="badge badge-rejected">${donor.bloodGroup}</span></td>
          <td>${donor.gender} (Age: ${donor.age})</td>
          <td>${donor.city}</td>
          <td>
            <div style="font-size: 0.85rem;">${donor.mobile}</div>
            <div style="font-size: 0.85rem; opacity: 0.6;">${donor.email}</div>
          </td>
          <td style="white-space: nowrap;">
            <button onclick="updateDonorStatus('${donor._id}', 'Approved')" class="btn btn-primary btn-sm" style="background: var(--success); padding: 4px 12px; margin-right: 6px;">Approve</button>
            <button onclick="updateDonorStatus('${donor._id}', 'Rejected')" class="btn btn-secondary btn-sm" style="border-color: var(--danger); color: var(--danger); padding: 4px 12px;">Reject</button>
          </td>
        `;
        pendingTable.appendChild(tr);
      });
    }
  } catch (err) {
    console.error(err);
    pendingTable.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Error loading approvals queue</td></tr>`;
  }
}

// Fetch and load complete donor directory
async function loadDonors() {
  const donorTable = document.getElementById('admin-donors-body');
  if (!donorTable) return;

  const status = document.getElementById('filter-donor-status').value;
  const bloodGroup = document.getElementById('filter-donor-blood').value;

  donorTable.innerHTML = `<tr><td colspan="8" style="text-align: center;">Loading directory...</td></tr>`;

  try {
    const res = await fetch(`/api/admin/donors?status=${status}&bloodGroup=${bloodGroup}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        donorTable.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 30px;">No donors found matching filters.</td></tr>`;
        return;
      }

      donorTable.innerHTML = '';
      data.data.forEach(donor => {
        const tr = document.createElement('tr');
        
        let statusActions = '';
        if (donor.status === 'Pending') {
          statusActions += `<button onclick="updateDonorStatus('${donor._id}', 'Approved')" class="btn btn-primary btn-sm" style="background: var(--success); padding: 4px 10px; margin-right: 6px;">Approve</button>`;
        }
        
        statusActions += `<button onclick="openEditDonorModal('${donor._id}')" class="btn btn-glass btn-sm" style="padding: 4px 10px; margin-right: 6px;">Edit</button>`;
        statusActions += `<button onclick="deleteDonor('${donor._id}')" class="btn btn-secondary btn-sm" style="padding: 4px 10px; border-color: rgba(255,255,255,0.1); color: var(--text-muted);">Delete</button>`;

        tr.innerHTML = `
          <td><strong>${donor.name}</strong></td>
          <td><span class="badge badge-rejected" style="font-size: 0.9rem;">${donor.bloodGroup}</span></td>
          <td>${donor.gender} (Age: ${donor.age})</td>
          <td>${donor.city}</td>
          <td>
            <div style="font-size: 0.85rem;">${donor.mobile}</div>
            <div style="font-size: 0.85rem; opacity: 0.6;">${donor.email}</div>
          </td>
          <td><span class="badge ${donor.isAvailable ? 'badge-available' : 'badge-unavailable'}">${donor.isAvailable ? 'Available' : 'Unavailable'}</span></td>
          <td><span class="badge badge-${donor.status.toLowerCase()}">${donor.status}</span></td>
          <td style="white-space: nowrap;">${statusActions}</td>
        `;
        donorTable.appendChild(tr);
      });
    }
  } catch (err) {
    console.error(err);
    donorTable.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--danger);">Error retrieving donor lists</td></tr>`;
  }
}

// Approve/Reject Donor
async function updateDonorStatus(id, status) {
  try {
    const res = await fetch(`/api/admin/donor/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();

    if (data.success) {
      showAlert(data.message, 'success');
      loadAllConsoleData(); // Sync reload all parts of the console!
    } else {
      showAlert('Failed to update status', 'error');
    }
  } catch (err) {
    showAlert('Connection error, status not updated', 'error');
  }
}

// Delete Donor Record
async function deleteDonor(id) {
  if (!confirm('Are you sure you want to permanently delete this donor from the system?')) return;

  try {
    const res = await fetch(`/api/admin/donor/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await res.json();

    if (data.success) {
      showAlert(data.message, 'success');
      loadAllConsoleData();
    } else {
      showAlert('Failed to delete donor record', 'error');
    }
  } catch (err) {
    showAlert('Server communication error', 'error');
  }
}

// Fetch and load blood requests list
async function loadRequests() {
  const reqTable = document.getElementById('admin-requests-body');
  if (!reqTable) return;

  reqTable.innerHTML = `<tr><td colspan="7" style="text-align: center;">Loading requests...</td></tr>`;

  try {
    const res = await fetch('/api/admin/requests', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        reqTable.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 30px;">No blood requests recorded.</td></tr>`;
        return;
      }

      reqTable.innerHTML = '';
      data.data.forEach(req => {
        const tr = document.createElement('tr');
        
        let statusOptions = ['Pending', 'Fulfilled', 'Cancelled'].map(s => {
          return `<option value="${s}" ${req.status === s ? 'selected' : ''}>${s}</option>`;
        }).join('');

        tr.innerHTML = `
          <td><strong>${req.patientName}</strong></td>
          <td><span class="badge badge-rejected">${req.bloodGroup}</span></td>
          <td>${req.hospitalName} (${req.location})</td>
          <td>${req.contactNumber}</td>
          <td><span class="badge badge-${req.urgency.toLowerCase()}">${req.urgency}</span></td>
          <td>${formatDate(req.requestDate)}</td>
          <td>
            <div style="display: flex; gap: 8px; align-items: center;">
              <select onchange="updateRequestStatus('${req._id}', this.value)" style="padding: 4px 8px; font-size: 0.8rem; border-radius: 6px;">
                ${statusOptions}
              </select>
              <button onclick="deleteRequest('${req._id}')" class="btn btn-secondary btn-sm" style="padding: 4px 8px; font-size: 0.75rem; border-color: rgba(239, 68, 68, 0.2); color: var(--danger);">✕</button>
            </div>
          </td>
        `;
        reqTable.appendChild(tr);
      });
    }
  } catch (err) {
    reqTable.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--danger);">Error retrieving requests</td></tr>`;
  }
}

// Update Blood Request Status
async function updateRequestStatus(id, status) {
  try {
    const res = await fetch(`/api/admin/request/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ status })
    });
    const data = await res.json();

    if (data.success) {
      showAlert(data.message, 'success');
      loadRequests();
      fetchStats();
    } else {
      showAlert('Failed to update status', 'error');
    }
  } catch (err) {
    showAlert('Server connection failed', 'error');
  }
}

// Delete Blood Request Record
async function deleteRequest(id) {
  if (!confirm('Are you sure you want to delete this blood request?')) return;

  try {
    const res = await fetch(`/api/admin/request/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await res.json();

    if (data.success) {
      showAlert(data.message, 'success');
      loadRequests();
      fetchStats();
    } else {
      showAlert('Failed to delete request', 'error');
    }
  } catch (err) {
    showAlert('Connection error', 'error');
  }
}

// Open Edit Donor Modal and fill in data
async function openEditDonorModal(id) {
  currentEditingDonorId = id;
  const modal = document.getElementById('edit-donor-modal');
  if (!modal) return;

  try {
    const res = await fetch(`/api/admin/donors`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await res.json();

    if (data.success) {
      const donor = data.data.find(d => d._id === id);
      if (donor) {
        document.getElementById('edit-name').value = donor.name;
        document.getElementById('edit-age').value = donor.age;
        document.getElementById('edit-gender').value = donor.gender;
        document.getElementById('edit-blood').value = donor.bloodGroup;
        document.getElementById('edit-mobile').value = donor.mobile;
        document.getElementById('edit-email').value = donor.email;
        document.getElementById('edit-address').value = donor.address;
        document.getElementById('edit-city').value = donor.city;
        document.getElementById('edit-available').value = donor.isAvailable ? 'true' : 'false';

        modal.style.display = 'flex';
      }
    }
  } catch (err) {
    showAlert('Failed to retrieve donor data', 'error');
  }
}

// Close Modal
window.closeEditModal = function() {
  const modal = document.getElementById('edit-donor-modal');
  if (modal) modal.style.display = 'none';
};

// Edit Donor Submit Handler
async function handleDonorEditSubmit(e) {
  e.preventDefault();

  const payload = {
    name: document.getElementById('edit-name').value,
    age: document.getElementById('edit-age').value,
    gender: document.getElementById('edit-gender').value,
    bloodGroup: document.getElementById('edit-blood').value,
    mobile: document.getElementById('edit-mobile').value,
    email: document.getElementById('edit-email').value,
    address: document.getElementById('edit-address').value,
    city: document.getElementById('edit-city').value,
    isAvailable: document.getElementById('edit-available').value === 'true'
  };

  try {
    const res = await fetch(`/api/admin/donor/${currentEditingDonorId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showAlert(data.message, 'success');
      closeEditModal();
      loadAllConsoleData();
    } else {
      showAlert(data.message || 'Update failed', 'error');
    }
  } catch (err) {
    showAlert('Network error, profile changes not saved', 'error');
  }
}

// Generate reports section logic
async function generateReportView() {
  const container = document.getElementById('report-output-container');
  if (!container) return;

  container.innerHTML = `
    <div class="glass-card" style="width: 100%;">
      <h3>Select Report Type</h3>
      <p style="color: var(--text-muted); margin-bottom: 24px;">Generate data breakdowns for printing or saving.</p>
      
      <div style="display: flex; gap: 16px; margin-bottom: 32px;">
        <button onclick="runReport('donors')" class="btn btn-primary">Approved Donors Report</button>
        <button onclick="runReport('requests')" class="btn btn-secondary">Blood Requests History</button>
      </div>
      
      <div id="report-results" style="display: none;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid var(--border-light); padding-bottom: 12px; margin-bottom: 16px;">
          <h4 id="report-title">Report Title</h4>
          <button onclick="window.print()" class="btn btn-glass btn-sm">Print Report ⎙</button>
        </div>
        <div id="report-table-div"></div>
      </div>
    </div>
  `;
}

// Fetch report contents and display
window.runReport = async function(type) {
  const resultsDiv = document.getElementById('report-results');
  const title = document.getElementById('report-title');
  const tableDiv = document.getElementById('report-table-div');

  resultsDiv.style.display = 'block';

  if (type === 'donors') {
    title.textContent = 'Approved Donors System Report';
    tableDiv.innerHTML = 'Loading donor data...';

    try {
      const res = await fetch('/api/admin/donors?status=Approved', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();

      if (data.success) {
        let rows = data.data.map((d, index) => {
          return `
            <tr>
              <td>${index + 1}</td>
              <td><strong>${d.name}</strong></td>
              <td>${d.bloodGroup}</td>
              <td>${d.gender} (Age: ${d.age})</td>
              <td>${d.city}</td>
              <td>${d.mobile}</td>
              <td>${d.email}</td>
            </tr>
          `;
        }).join('');

        tableDiv.innerHTML = `
          <table style="width: 100%; text-align: left;">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Blood Group</th>
                <th>Details</th>
                <th>City</th>
                <th>Mobile</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        `;
      }
    } catch (err) {
      tableDiv.innerHTML = 'Failed to load report data.';
    }
  } else if (type === 'requests') {
    title.textContent = 'Blood Requests System History Report';
    tableDiv.innerHTML = 'Loading request data...';

    try {
      const res = await fetch('/api/admin/requests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await res.json();

      if (data.success) {
        let rows = data.data.map((r, index) => {
          return `
            <tr>
              <td>${index + 1}</td>
              <td><strong>${r.patientName}</strong></td>
              <td>${r.bloodGroup}</td>
              <td>${r.hospitalName} (${r.location})</td>
              <td>${r.urgency}</td>
              <td>${formatDate(r.requestDate)}</td>
              <td>${r.status}</td>
            </tr>
          `;
        }).join('');

        tableDiv.innerHTML = `
          <table style="width: 100%; text-align: left;">
            <thead>
              <tr>
                <th>#</th>
                <th>Patient Name</th>
                <th>Blood Group</th>
                <th>Hospital & Location</th>
                <th>Urgency</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        `;
      }
    } catch (err) {
      tableDiv.innerHTML = 'Failed to load report data.';
    }
  }
};
