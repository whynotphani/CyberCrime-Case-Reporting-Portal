/**
 * Stage 1: Helpline 1930 Desk Controller Script
 */

document.addEventListener('DOMContentLoaded', () => {
  const helplineForm = document.getElementById('helplineForm');
  const resultModal = document.getElementById('resultModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  if (helplineForm) {
    helplineForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const submitBtn = helplineForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Generating Case Registration...';
      submitBtn.disabled = true;

      const payload = {
        fullName: document.getElementById('fullName').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        idProofType: document.getElementById('idProofType').value,
        idProofNumber: document.getElementById('idProofNumber').value,
        initialCategory: document.getElementById('initialCategory').value
      };

      try {
        const response = await API.request('/api/helpline/create-case', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (response.success) {
          showToast('Case initiated & OTP generated successfully!', 'success');

          // Populate modal with details
          document.getElementById('resCaseNumber').innerText = response.data.caseNumber;
          document.getElementById('resOtp').innerText = response.data.otp;
          document.getElementById('resCitizenName').innerText = response.data.citizenName;
          document.getElementById('resPhone').innerText = response.data.phone;

          resultModal.classList.add('active');
          helplineForm.reset();
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    });
  }

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      resultModal.classList.remove('active');
    });
  }
});
