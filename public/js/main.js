// Shared utilities and layout injection for Blood Donor Finder System

document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderFooter();
  checkAuthStatus();
});

// Render navbar dynamically
function renderNavbar() {
  const navContainer = document.getElementById('navbar-placeholder');
  if (!navContainer) return;

  const currentPath = window.location.pathname;
  const isHomePage = currentPath === '/' || currentPath.endsWith('index.html') || currentPath === '';
  const isAboutPage = currentPath.endsWith('about.html');
  const isSearchPage = currentPath.endsWith('search.html');
  const isRequestPage = currentPath.endsWith('request.html');
  const isContactPage = currentPath.endsWith('contact.html');

  // We read the token from cookies or localStorage to check auth
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  let navRightHTML = `
    <li><a href="login.html" class="btn btn-secondary btn-sm">Donor Login</a></li>
    <li><a href="admin-login.html" class="btn btn-primary btn-sm">Admin Login</a></li>
  `;

  if (token) {
    if (userRole === 'admin') {
      navRightHTML = `
        <li><a href="admin-dashboard.html" class="btn btn-primary btn-sm">Admin Panel</a></li>
        <li><button onclick="handleLogout()" class="btn btn-glass btn-sm">Logout</button></li>
      `;
    } else {
      navRightHTML = `
        <li><a href="dashboard.html" class="btn btn-primary btn-sm">My Dashboard</a></li>
        <li><button onclick="handleLogout()" class="btn btn-glass btn-sm">Logout</button></li>
      `;
    }
  }

  navContainer.innerHTML = `
    <nav class="navbar">
      <div class="container nav-flex">
        <a href="index.html" class="logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24">
              <path d="M12,2C12,2 6,8 6,14C6,17.31 8.69,20 12,20C15.31,20 18,17.31 18,14C18,8 12,2 12,2M12,18C9.79,18 8,16.21 8,14C8,12 10,9 12,6.5C14,9 16,12 16,14C16,16.21 14.21,18 12,18Z"/>
            </svg>
          </div>
          LifeLine
        </a>
        <ul class="nav-links">
          <li><a href="index.html" class="${isHomePage ? 'active' : ''}">Home</a></li>
          <li><a href="about.html" class="${isAboutPage ? 'active' : ''}">About Us</a></li>
          <li><a href="search.html" class="${isSearchPage ? 'active' : ''}">Find Donors</a></li>
          <li><a href="request.html" class="${isRequestPage ? 'active' : ''}">Blood Request</a></li>
          <li><a href="contact.html" class="${isContactPage ? 'active' : ''}">Contact Us</a></li>
        </ul>
        <ul class="nav-links" style="display: flex; gap: 14px;">
          ${navRightHTML}
        </ul>
      </div>
    </nav>
  `;
}

// Render footer dynamically
function renderFooter() {
  const footerContainer = document.getElementById('footer-placeholder');
  if (!footerContainer) return;

  const currentYear = new Date().getFullYear();
  footerContainer.innerHTML = `
    <footer>
      <div class="container">
        <p>&copy; ${currentYear} LifeLine Blood Donor Finder System. Designed with Red-Glassmorphism CSS.</p>
        <p style="margin-top: 10px; font-size: 0.8rem; opacity: 0.6;">
          <a href="admin-login.html" style="text-decoration: underline;">Admin Portal</a> &bull; 
          <a href="about.html">Learn More</a> &bull; 
          <a href="contact.html">Support</a>
        </p>
      </div>
    </footer>
  `;
}

// Custom Notification Handler
function showAlert(message, type = 'success') {
  let alertContainer = document.querySelector('.alert-container');
  if (!alertContainer) {
    alertContainer = document.createElement('div');
    alertContainer.className = 'alert-container';
    document.body.appendChild(alertContainer);
  }

  const alert = document.createElement('div');
  alert.className = `alert alert-${type}`;
  
  const icon = type === 'success' ? '✓' : '✗';
  alert.innerHTML = `
    <span style="font-weight: 800; font-size: 1.2rem;">${icon}</span>
    <div>${message}</div>
  `;

  alertContainer.appendChild(alert);

  setTimeout(() => {
    alert.style.opacity = '0';
    alert.style.transform = 'translateX(100px)';
    alert.style.transition = 'all 0.5s ease';
    setTimeout(() => alert.remove(), 500);
  }, 4000);
}

// Handle user Logout
async function handleLogout() {
  try {
    const res = await fetch('/api/auth/logout');
    const data = await res.json();
    
    if (data.success) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userName');
      
      showAlert('Logged out successfully!', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1000);
    }
  } catch (err) {
    showAlert('Error logging out', 'error');
  }
}

// Global authentication status check
function checkAuthStatus() {
  // Can be called to adjust individual pages
}

// Helper to format date strings
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
