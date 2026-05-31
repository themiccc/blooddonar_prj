// Search page operations

document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('search-donors-form');
  if (searchForm) {
    searchForm.addEventListener('submit', handleSearchSubmit);
  }

  // Check URL query parameters (for quick searches from home page)
  parseUrlParams();

  // Modal close trigger
  const closeModalBtn = document.querySelector('.modal-close');
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeContactModal);
  }

  // Close modal when clicking outside content
  const modalOverlay = document.getElementById('contact-modal');
  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeContactModal();
    });
  }
});

// Check if search parameters were passed from the home page
function parseUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const bloodGroup = urlParams.get('bloodGroup');
  const city = urlParams.get('city');

  if (bloodGroup || city) {
    if (bloodGroup) document.getElementById('search-blood').value = bloodGroup;
    if (city) document.getElementById('search-city').value = city;
    
    // Execute search automatically
    executeSearch(bloodGroup || 'All', city || '');
  } else {
    // Run an empty search on load to show all approved donors
    executeSearch('All', '');
  }
}

// Search Form Submit Handler
function handleSearchSubmit(e) {
  e.preventDefault();
  
  const bloodGroup = document.getElementById('search-blood').value;
  const city = document.getElementById('search-city').value;

  executeSearch(bloodGroup, city);
}

// Run search API call and update DOM
async function executeSearch(bloodGroup, city) {
  const resultsGrid = document.getElementById('search-results-grid');
  if (!resultsGrid) return;

  resultsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Searching database for donors...</div>`;

  try {
    const res = await fetch(`/api/request/search?bloodGroup=${encodeURIComponent(bloodGroup)}&city=${encodeURIComponent(city)}`);
    const data = await res.json();

    if (data.success) {
      if (data.data.length === 0) {
        resultsGrid.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px;" class="glass-card">
            <h3>No Active Donors Found</h3>
            <p style="color: var(--text-muted); margin: 12px 0 24px 0;">We couldn't find any approved available donors matching your requirements.</p>
            <a href="request.html" class="btn btn-primary">Submit a Blood Request Form</a>
          </div>
        `;
        return;
      }

      resultsGrid.innerHTML = '';
      data.data.forEach(donor => {
        const card = document.createElement('div');
        card.className = 'glass-card donor-card';

        const availBadge = donor.isAvailable 
          ? `<span class="badge badge-available">Available</span>`
          : `<span class="badge badge-unavailable">Unavailable</span>`;

        card.innerHTML = `
          <div>
            <div class="donor-header">
              <div>
                <h3 style="font-size: 1.25rem;">${donor.name}</h3>
                <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">${donor.gender} &bull; Age: ${donor.age}</p>
              </div>
              <div class="donor-blood-badge">${donor.bloodGroup}</div>
            </div>
            
            <div class="donor-info">
              <div class="donor-meta-row">
                <span style="opacity: 0.6;">📍</span>
                <span>City: <strong>${donor.city}</strong></span>
              </div>
              <div class="donor-meta-row" style="margin-top: 4px;">
                <span style="opacity: 0.6;">🏠</span>
                <span style="font-size: 0.85rem;">Address: ${donor.address}</span>
              </div>
            </div>
          </div>

          <div style="margin-top: 20px; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-light); padding-top: 16px;">
            ${availBadge}
            <button onclick='openContactModal(${JSON.stringify(donor)})' class="btn btn-glass btn-sm">Contact Donor</button>
          </div>
        `;
        resultsGrid.appendChild(card);
      });
    } else {
      resultsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--danger); padding: 40px;">Search query failed</div>`;
    }
  } catch (err) {
    console.error('Search request error:', err);
    resultsGrid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--danger); padding: 40px;">Error communicating with server</div>`;
  }
}

// Contact Modal handlers
window.openContactModal = function(donor) {
  const modal = document.getElementById('contact-modal');
  if (!modal) return;

  // Insert details
  document.getElementById('modal-donor-name').textContent = donor.name;
  document.getElementById('modal-donor-blood').textContent = donor.bloodGroup;
  document.getElementById('modal-donor-city').textContent = donor.city;
  
  // Set contact buttons
  const callBtn = document.getElementById('modal-call-btn');
  const emailBtn = document.getElementById('modal-email-btn');
  
  callBtn.href = `tel:${donor.mobile}`;
  callBtn.innerHTML = `📞 Call Donor (${donor.mobile})`;
  
  emailBtn.href = `mailto:${donor.email}?subject=Urgent Blood Request`;
  emailBtn.innerHTML = `✉ Email Donor (${donor.email})`;

  // Toggle availability disclaimer
  const availabilityAlert = document.getElementById('modal-availability-alert');
  if (!donor.isAvailable) {
    availabilityAlert.style.display = 'block';
  } else {
    availabilityAlert.style.display = 'none';
  }

  modal.style.display = 'flex';
};

function closeContactModal() {
  const modal = document.getElementById('contact-modal');
  if (modal) modal.style.display = 'none';
}
