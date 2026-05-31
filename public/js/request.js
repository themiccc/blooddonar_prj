// Blood request form handler (with Geolocation and dynamic backend OTP Verification)

document.addEventListener('DOMContentLoaded', () => {
  const requestForm = document.getElementById('blood-request-form');
  if (requestForm) {
    setupRequestFormLogic(requestForm);
  }
});

function setupRequestFormLogic(form) {
  let phoneVerified = false;

  const phoneInput = document.getElementById('req-contact-number');
  const verifyPhoneBtn = document.getElementById('verify-req-phone-btn');
  const otpPhoneGroup = document.getElementById('otp-req-phone-group');
  const confirmOtpPhoneBtn = document.getElementById('confirm-otp-req-phone-btn');
  const phoneVerifiedBadge = document.getElementById('req-phone-verified-badge');
  const submitBtn = document.getElementById('request-submit-btn');
  
  const detectLocationBtn = document.getElementById('detect-req-location-btn');
  const locationInput = document.getElementById('req-location');

  const hospitalSelect = document.getElementById('req-hospital-select');
  const hospitalCustomGroup = document.getElementById('req-hospital-custom-group');
  const hospitalCustomInput = document.getElementById('req-hospital-custom');

  // Toggle custom hospital input based on selection
  if (hospitalSelect) {
    hospitalSelect.addEventListener('change', () => {
      if (hospitalSelect.value === 'Other') {
        hospitalCustomGroup.style.display = 'block';
        hospitalCustomInput.required = true;
        hospitalCustomInput.focus();
      } else {
        hospitalCustomGroup.style.display = 'none';
        hospitalCustomInput.required = false;
        hospitalCustomInput.value = '';
      }
    });
  }

  // Helper to sync submit button state
  function checkValidity() {
    if (phoneVerified) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Post Emergency Request';
    } else {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Post Emergency Request (Verify Phone First)';
    }
  }

  // 1. Geolocation Location Auto-detect
  if (detectLocationBtn) {
    detectLocationBtn.addEventListener('click', () => {
      if (!navigator.geolocation) {
        return showAlert('Geolocation is not supported by your browser.', 'error');
      }

      detectLocationBtn.textContent = 'Locating...';
      detectLocationBtn.disabled = true;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
            const data = await response.json();

            if (data && data.address) {
              const city = data.address.city || data.address.town || data.address.village || data.address.suburb || '';
              if (city) {
                locationInput.value = city;
                showAlert(`Location detected: ${city}`, 'success');
              } else {
                const county = data.address.county || data.address.state || '';
                locationInput.value = county;
                showAlert(`Location detected: ${county}`, 'success');
              }
            } else {
              showAlert('Location not recognized. Please enter manually.', 'error');
            }
          } catch (err) {
            console.error(err);
            showAlert('Network error resolving location. Enter manually.', 'error');
          } finally {
            detectLocationBtn.textContent = 'Detect 📍';
            detectLocationBtn.disabled = false;
          }
        },
        (error) => {
          console.warn(error);
          showAlert('Failed to access location coordinates. Enter manually.', 'error');
          detectLocationBtn.textContent = 'Detect 📍';
          detectLocationBtn.disabled = false;
        },
        { timeout: 6000 }
      );
    });
  }

  // 2. Phone OTP Verification calling backend APIs
  let phoneTimerInterval;

  function startPhoneTimer(duration = 90) {
    const container = document.getElementById('req-phone-timer-container');
    const secSpan = document.getElementById('req-phone-timer-sec');
    const resendBtn = document.getElementById('resend-req-phone-otp-btn');

    if (!container || !secSpan || !resendBtn) return;

    if (phoneTimerInterval) clearInterval(phoneTimerInterval);

    let remaining = duration;
    secSpan.textContent = remaining;
    container.style.display = 'block';
    resendBtn.style.display = 'none';

    phoneTimerInterval = setInterval(() => {
      remaining--;
      secSpan.textContent = remaining;
      if (remaining <= 0) {
        clearInterval(phoneTimerInterval);
        container.style.display = 'none';
        resendBtn.style.display = 'inline-block';
      }
    }, 1000);
  }

  async function sendPhoneOtp() {
    const countryCodeSelect = document.getElementById('req-mobile-country');
    const phoneLocal = phoneInput.value.trim();
    if (!phoneLocal || phoneLocal.length < 10) {
      return showAlert('Please enter a valid mobile number first', 'error');
    }

    const phoneVal = countryCodeSelect.value + phoneLocal;
    verifyPhoneBtn.textContent = 'Sending...';
    verifyPhoneBtn.disabled = true;

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: phoneVal })
      });
      const data = await res.json();

      if (data.success) {
        showAlert('Verification code sent to your mobile phone!', 'success');
        otpPhoneGroup.style.display = 'block';
        verifyPhoneBtn.textContent = 'Sent ✓';
        startPhoneTimer(90);
      } else {
        showAlert(data.message || 'Failed to send verification code', 'error');
        verifyPhoneBtn.textContent = 'Verify';
        verifyPhoneBtn.disabled = false;
      }
    } catch (err) {
      showAlert('Network error sending verification code', 'error');
      verifyPhoneBtn.textContent = 'Verify';
      verifyPhoneBtn.disabled = false;
    }
  }

  if (verifyPhoneBtn) {
    verifyPhoneBtn.addEventListener('click', sendPhoneOtp);
  }
  const resendPhoneBtn = document.getElementById('resend-req-phone-otp-btn');
  if (resendPhoneBtn) {
    resendPhoneBtn.addEventListener('click', sendPhoneOtp);
  }

  if (confirmOtpPhoneBtn) {
    confirmOtpPhoneBtn.addEventListener('click', async () => {
      const countryCodeSelect = document.getElementById('req-mobile-country');
      const phoneLocal = phoneInput.value.trim();
      const phoneVal = countryCodeSelect.value + phoneLocal;
      const code = document.getElementById('otp-req-phone').value.trim();

      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ recipient: phoneVal, otp: code })
        });
        const data = await res.json();

        if (data.success) {
          phoneVerified = true;
          phoneInput.readOnly = true;
          countryCodeSelect.disabled = true;
          otpPhoneGroup.style.display = 'none';
          verifyPhoneBtn.style.display = 'none';
          phoneVerifiedBadge.style.display = 'inline-flex';
          showAlert('Phone number verified successfully!', 'success');
          if (phoneTimerInterval) clearInterval(phoneTimerInterval);
          checkValidity();
        } else {
          showAlert(data.message || 'Invalid code entered. Please check terminal console.', 'error');
        }
      } catch (err) {
        showAlert('Network error validating verification code', 'error');
      }
    });
  }

  // 3. Submit Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!phoneVerified) {
      return showAlert('Please verify the phone number first.', 'error');
    }

    const patientName = document.getElementById('req-patient-name').value;
    const bloodGroup = document.getElementById('req-blood-group').value;
    
    // Choose custom name if "Other" is selected
    let hospitalName = hospitalSelect.value;
    if (hospitalName === 'Other') {
      hospitalName = hospitalCustomInput.value.trim();
      if (!hospitalName) {
        return showAlert('Please enter the name of the hospital', 'error');
      }
    }

    const countryCodeSelect = document.getElementById('req-mobile-country');
    const contactNumber = countryCodeSelect.value + phoneInput.value.trim();
    const location = locationInput.value;
    const urgency = document.getElementById('req-urgency').value;

    try {
      const res = await fetch('/api/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientName,
          bloodGroup,
          hospitalName,
          contactNumber,
          location,
          urgency
        })
      });

      const data = await res.json();

      if (data.success) {
        showAlert('Blood request submitted successfully! Matching donors are being alerted.', 'success');
        form.reset();
        
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 2000);
      } else {
        showAlert(data.message || 'Failed to submit blood request', 'error');
      }
    } catch (err) {
      console.error('Request creation error:', err);
      showAlert('Server communication error, request not recorded', 'error');
    }
  });
}
