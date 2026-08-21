document.addEventListener('DOMContentLoaded', () => {
  const officerLoginForm = document.getElementById('officerLoginForm');

  // If officer is already logged in, redirect straight to dashboard
  const token = API.getToken();
  const role = API.getUserRole();
  if (token && role === 'officer') {
    window.location.href = 'officer-dashboard.html';
    return;
  }

  // Password visibility toggle
  const togglePasswordBtn = document.getElementById('togglePasswordBtn');
  const passwordInput = document.getElementById('password');

  if (togglePasswordBtn && passwordInput) {
    togglePasswordBtn.addEventListener('click', () => {
      const isPassword = passwordInput.getAttribute('type') === 'password';
      passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
      
      const eyeOpen = togglePasswordBtn.querySelector('.eye-open');
      const eyeClosed = togglePasswordBtn.querySelector('.eye-closed');

      if (eyeOpen && eyeClosed) {
        eyeOpen.style.display = isPassword ? 'none' : 'block';
        eyeClosed.style.display = isPassword ? 'block' : 'none';
      }

      togglePasswordBtn.setAttribute('title', isPassword ? 'Hide Password' : 'Show Password');
    });
  }

  if (officerLoginForm) {
    officerLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const identifier = document.getElementById('identifier').value.trim();
      const password = document.getElementById('password').value;

      if (!identifier || !password) {
        showToast('Please enter your Badge Number / Email and Password.', 'error');
        return;
      }

      const submitBtn = officerLoginForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Authenticating Officer...';
      submitBtn.disabled = true;

      try {
        const response = await API.request('/api/auth/officer/login', {
          method: 'POST',
          body: JSON.stringify({ identifier, password })
        });

        if (response.success && response.token) {
          API.setToken(response.token);
          API.setUserRole('officer');
          showToast('Officer Login Successful! Redirecting to Dashboard...', 'success');

          setTimeout(() => {
            window.location.href = 'officer-dashboard.html';
          }, 1000);
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
