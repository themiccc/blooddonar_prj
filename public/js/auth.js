// Front-end Authentication logic (Login, Signup, Admin Login with real OTP endpoints and Geolocation)

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const adminLoginForm = document.getElementById('admin-login-form');

  // 1. Donor Login Form Submission
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.user.role);
          localStorage.setItem('userName', data.user.name);

          showAlert('Login successful! Redirecting to Dashboard...', 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 1500);
        } else {
          showAlert(data.message || 'Invalid email or password', 'error');
        }
      } catch (err) {
        console.error('Login error:', err);
        showAlert('Network error, please try again.', 'error');
      }
    });
  }

  // 2. Admin Login Form Submission
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      try {
        const res = await fetch('/api/auth/admin-login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.user.role);
          localStorage.setItem('userName', data.user.name);

          showAlert('Admin authentication verified! Loading console...', 'success');
          setTimeout(() => {
            window.location.href = 'admin-dashboard.html';
          }, 1500);
        } else {
          showAlert(data.message || 'Invalid administrator credentials', 'error');
        }
      } catch (err) {
        console.error('Admin login error:', err);
        showAlert('Network error, please try again.', 'error');
      }
    });
  }

  // 3. Donor Registration Form + Verification + Geolocation
  if (registerForm) {
    let emailVerified = false;
    let mobileVerified = false;

    const emailInput = document.getElementById('email');
    const mobileInput = document.getElementById('mobile');
    const verifyEmailBtn = document.getElementById('verify-email-btn');
    const verifyMobileBtn = document.getElementById('verify-mobile-btn');
    const otpEmailGroup = document.getElementById('otp-email-group');
    const otpMobileGroup = document.getElementById('otp-mobile-group');
    const confirmOtpEmailBtn = document.getElementById('confirm-otp-email-btn');
    const confirmOtpMobileBtn = document.getElementById('confirm-otp-mobile-btn');
    const emailVerifiedBadge = document.getElementById('email-verified-badge');
    const mobileVerifiedBadge = document.getElementById('mobile-verified-badge');
    const registerSubmitBtn = document.getElementById('register-submit-btn');
    const detectCityBtn = document.getElementById('detect-city-btn');
    const cityInput = document.getElementById('city');

    // Helper to lock/unlock register button based on OTP verifications
    function checkFormValidity() {
      if (emailVerified && mobileVerified) {
        registerSubmitBtn.disabled = false;
        registerSubmitBtn.textContent = 'Register as Donor';
      } else {
        registerSubmitBtn.disabled = true;
        registerSubmitBtn.textContent = 'Register as Donor (Verify Contact Details First)';
      }
    }

    // A. Geolocation Live Fetching using Nominatim OpenStreetMap
    if (detectCityBtn) {
      detectCityBtn.addEventListener('click', () => {
        if (!navigator.geolocation) {
          return showAlert('Geolocation is not supported by your browser.', 'error');
        }

        detectCityBtn.textContent = 'Locating...';
        detectCityBtn.disabled = true;

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            try {
              const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
              const data = await response.json();

              if (data && data.address) {
                const suburb = data.address.suburb || data.address.neighbourhood || data.address.quarter || data.address.residential || data.address.subdistrict || '';
                const city = data.address.city || data.address.town || data.address.village || '';
                
                let displayLocation = '';
                if (suburb && city) {
                  displayLocation = `${suburb}, ${city}`;
                } else {
                  displayLocation = suburb || city || data.address.county || data.address.state || '';
                }

                if (displayLocation) {
                  cityInput.value = displayLocation;
                  showAlert(`Location auto-detected: ${displayLocation}`, 'success');
                } else {
                  showAlert('Could not resolve location. Please enter manually.', 'error');
                }
              } else {
                showAlert('Could not resolve location. Please enter manually.', 'error');
              }
            } catch (err) {
              console.error('Reverse geocode error:', err);
              showAlert('Network error resolving location. Please enter manually.', 'error');
            } finally {
              detectCityBtn.textContent = 'Detect 📍';
              detectCityBtn.disabled = false;
            }
          },
          (error) => {
            console.warn(error);
            showAlert('Permission denied or location lookup timeout. Enter manually.', 'error');
            detectCityBtn.textContent = 'Detect 📍';
            detectCityBtn.disabled = false;
          },
          { timeout: 6000 }
        );
      });
    }

    let emailTimerInterval;
    let mobileTimerInterval;

    function startTimer(type, duration = 90) {
      const container = document.getElementById(`${type}-timer-container`);
      const secSpan = document.getElementById(`${type}-timer-sec`);
      const resendBtn = document.getElementById(`resend-${type}-otp-btn`);

      if (!container || !secSpan || !resendBtn) return;

      if (type === 'email' && emailTimerInterval) clearInterval(emailTimerInterval);
      if (type === 'mobile' && mobileTimerInterval) clearInterval(mobileTimerInterval);

      let remaining = duration;
      secSpan.textContent = remaining;
      container.style.display = 'block';
      resendBtn.style.display = 'none';

      const interval = setInterval(() => {
        remaining--;
        secSpan.textContent = remaining;
        if (remaining <= 0) {
          clearInterval(interval);
          container.style.display = 'none';
          resendBtn.style.display = 'inline-block';
        }
      }, 1000);

      if (type === 'email') emailTimerInterval = interval;
      if (type === 'mobile') mobileTimerInterval = interval;
    }

    async function sendEmailOtp() {
      const emailVal = emailInput.value.trim();
      if (!emailVal || !emailInput.checkValidity()) {
        return showAlert('Please enter a valid email address first', 'error');
      }

      verifyEmailBtn.textContent = 'Sending...';
      verifyEmailBtn.disabled = true;

      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipient: emailVal })
        });
        const data = await res.json();

        if (data.success) {
          showAlert('Verification code sent to your email!', 'success');
          otpEmailGroup.style.display = 'block';
          verifyEmailBtn.textContent = 'Sent ✓';
          startTimer('email', 90);
        } else {
          showAlert(data.message || 'Failed to send OTP code', 'error');
          verifyEmailBtn.textContent = 'Verify';
          verifyEmailBtn.disabled = false;
        }
      } catch (err) {
        showAlert('Network error sending OTP code', 'error');
        verifyEmailBtn.textContent = 'Verify';
        verifyEmailBtn.disabled = false;
      }
    }

    async function sendMobileOtp() {
      const countryCodeSelect = document.getElementById('mobile-country');
      const mobileLocal = mobileInput.value.trim();
      if (!mobileLocal || mobileLocal.length < 10) {
        return showAlert('Please enter a valid mobile number first', 'error');
      }

      const mobileVal = countryCodeSelect.value + mobileLocal;
      verifyMobileBtn.textContent = 'Sending...';
      verifyMobileBtn.disabled = true;

      try {
        const res = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipient: mobileVal })
        });
        const data = await res.json();

        if (data.success) {
          showAlert('Verification code sent to your mobile phone!', 'success');
          otpMobileGroup.style.display = 'block';
          verifyMobileBtn.textContent = 'Sent ✓';
          startTimer('mobile', 90);
        } else {
          showAlert(data.message || 'Failed to send OTP code', 'error');
          verifyMobileBtn.textContent = 'Verify';
          verifyMobileBtn.disabled = false;
        }
      } catch (err) {
        showAlert('Network error sending OTP code', 'error');
        verifyMobileBtn.textContent = 'Verify';
        verifyMobileBtn.disabled = false;
      }
    }

    // B. Email OTP Verification via backend API
    if (verifyEmailBtn) {
      verifyEmailBtn.addEventListener('click', sendEmailOtp);
    }
    const resendEmailBtn = document.getElementById('resend-email-otp-btn');
    if (resendEmailBtn) {
      resendEmailBtn.addEventListener('click', sendEmailOtp);
    }

    if (confirmOtpEmailBtn) {
      confirmOtpEmailBtn.addEventListener('click', async () => {
        const emailVal = emailInput.value.trim();
        const code = document.getElementById('otp-email').value.trim();

        try {
          const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient: emailVal, otp: code })
          });
          const data = await res.json();

          if (data.success) {
            emailVerified = true;
            emailInput.readOnly = true;
            otpEmailGroup.style.display = 'none';
            verifyEmailBtn.style.display = 'none';
            emailVerifiedBadge.style.display = 'inline-flex';
            showAlert('Email address verified successfully!', 'success');
            if (emailTimerInterval) clearInterval(emailTimerInterval);
            checkFormValidity();
          } else {
            showAlert(data.message || 'Invalid code entered. Please check terminal console.', 'error');
          }
        } catch (err) {
          showAlert('Network error validating verification code', 'error');
        }
      });
    }

    // C. Mobile OTP Verification via backend API
    if (verifyMobileBtn) {
      verifyMobileBtn.addEventListener('click', sendMobileOtp);
    }
    const resendMobileBtn = document.getElementById('resend-mobile-otp-btn');
    if (resendMobileBtn) {
      resendMobileBtn.addEventListener('click', sendMobileOtp);
    }

    if (confirmOtpMobileBtn) {
      confirmOtpMobileBtn.addEventListener('click', async () => {
        const countryCodeSelect = document.getElementById('mobile-country');
        const mobileLocal = mobileInput.value.trim();
        const mobileVal = countryCodeSelect.value + mobileLocal;
        const code = document.getElementById('otp-mobile').value.trim();

        try {
          const res = await fetch('/api/auth/verify-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipient: mobileVal, otp: code })
          });
          const data = await res.json();

          if (data.success) {
            mobileVerified = true;
            mobileInput.readOnly = true;
            countryCodeSelect.disabled = true;
            otpMobileGroup.style.display = 'none';
            verifyMobileBtn.style.display = 'none';
            mobileVerifiedBadge.style.display = 'inline-flex';
            showAlert('Mobile number verified successfully!', 'success');
            if (mobileTimerInterval) clearInterval(mobileTimerInterval);
            checkFormValidity();
          } else {
            showAlert(data.message || 'Invalid code entered. Please check terminal console.', 'error');
          }
        } catch (err) {
          showAlert('Network error validating verification code', 'error');
        }
      });
    }

    // Register submit handling
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!emailVerified || !mobileVerified) {
        return showAlert('Please verify both email and mobile numbers before proceeding.', 'error');
      }

      const name = document.getElementById('name').value;
      const age = document.getElementById('age').value;
      const gender = document.getElementById('gender').value;
      const bloodGroup = document.getElementById('bloodGroup').value;
      const countryCodeSelect = document.getElementById('mobile-country');
      const mobile = countryCodeSelect.value + mobileInput.value.trim();
      const email = emailInput.value;
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const address = document.getElementById('address').value;
      const city = cityInput.value;

      if (password !== confirmPassword) {
        return showAlert('Passwords do not match', 'error');
      }

      if (age < 18 || age > 65) {
        return showAlert('Donor age must be between 18 and 65 years', 'error');
      }

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            age,
            gender,
            bloodGroup,
            mobile,
            email,
            password,
            address,
            city
          })
        });

        const data = await res.json();

        if (data.success) {
          localStorage.setItem('token', data.token);
          localStorage.setItem('role', data.user.role);
          localStorage.setItem('userName', data.user.name);

          showAlert('Registration successful! Application pending administrator approval.', 'success');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 2000);
        } else {
          showAlert(data.message || 'Registration failed', 'error');
        }
      } catch (err) {
        console.error('Registration error:', err);
        showAlert('Network error, please try again.', 'error');
      }
    });
  }
});
