document.addEventListener('DOMContentLoaded', () => {
  const citizenLoginForm = document.getElementById('citizenLoginForm');

  const resendOtpBtn = document.getElementById('resendOtpBtn');
  const otpDisplayBanner = document.getElementById('otpDisplayBanner');
  const newOtpValue = document.getElementById('newOtpValue');

  if (resendOtpBtn) {
    resendOtpBtn.addEventListener('click', async () => {
      const caseNumber = document.getElementById('caseNumber').value.trim();
      if (!caseNumber) {
        showToast('Please enter your Case Registration Number first.', 'warning');
        document.getElementById('caseNumber').focus();
        return;
      }

      resendOtpBtn.innerText = 'Generating...';
      resendOtpBtn.disabled = true;

      try {
        const response = await API.request('/api/helpline/resend-otp', {
          method: 'POST',
          body: JSON.stringify({ caseNumber })
        });

        if (response.success) {
          document.getElementById('otpCode').value = response.otp;
          if (newOtpValue) newOtpValue.innerText = response.otp;
          if (otpDisplayBanner) otpDisplayBanner.style.display = 'block';
          showToast('Fresh 6-digit OTP generated successfully!', 'success');
        }
      } catch (err) {
        showToast(err.message || 'Failed to generate new OTP. Case Number not found.', 'error');
      } finally {
        resendOtpBtn.innerText = '⚡ Request New OTP';
        resendOtpBtn.disabled = false;
      }
    });
  }

  if (citizenLoginForm) {
    citizenLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const caseNumber = document.getElementById('caseNumber').value;
      const otp = document.getElementById('otpCode').value;

      const submitBtn = citizenLoginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Verifying Code...';
      submitBtn.disabled = true;

      try {
        const response = await API.request('/api/auth/citizen/verify-otp', {
          method: 'POST',
          body: JSON.stringify({ caseNumber, otp })
        });

        if (response.success) {
          API.setToken(response.token);
          API.setUserRole('citizen');
          showToast('Authentication Successful! Redirecting to Portal...', 'success');

          setTimeout(() => {
            window.location.href = 'citizen-portal.html';
          }, 1200);
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }
});
