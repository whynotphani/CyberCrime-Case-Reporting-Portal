document.addEventListener('DOMContentLoaded', () => {
  const helplineForm = document.getElementById('helplineForm');
  const resultModal = document.getElementById('resultModal');
  const closeModalBtn = document.getElementById('closeModalBtn');

  if (helplineForm) {
    helplineForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullName = document.getElementById('fullName').value.trim();
      const phone = document.getElementById('phone').value.trim();
      const description = document.getElementById('description').value.trim();
      const initialCategory = document.getElementById('initialCategory').value;
      const severity = document.getElementById('severity').value;
      const idProofType = document.getElementById('idProofType').value;
      const idProofNumber = document.getElementById('idProofNumber').value;

      // Validation
      if (!fullName || fullName.length < 2) {
        showToast('Please enter a valid victim full name (min 2 characters).', 'error');
        return;
      }

      if (!phone || !/^[0-9]{10}$/.test(phone)) {
        showToast('Please enter a valid 10-digit mobile number.', 'error');
        return;
      }

      if (!description || description.length < 5) {
        showToast('Please enter an initial complaint description (min 5 characters).', 'error');
        return;
      }

      const submitBtn = helplineForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Creating Case & Generating OTP...';
      submitBtn.disabled = true;

      const payload = {
        fullName,
        phone,
        description,
        initialCategory,
        severity,
        idProofType,
        idProofNumber
      };

      try {
        const response = await API.request('/api/helpline/create-case', {
          method: 'POST',
          body: JSON.stringify(payload)
        });

        if (response.success) {
          showToast('Initial complaint registered & OTP generated successfully!', 'success');

          // Populate modal fields
          document.getElementById('resCaseNumber').innerText = response.data.caseNumber;
          document.getElementById('resOtp').innerText = response.data.otp;
          document.getElementById('resCitizenName').innerText = response.data.citizenName;
          document.getElementById('resPhone').innerText = response.data.phone;
          document.getElementById('resCategory').innerText = response.data.category;
          
          const severityBadge = document.getElementById('resSeverity');
          severityBadge.innerText = response.data.severity;
          severityBadge.className = `badge badge-priority-${response.data.severity}`;

          if (response.data.confirmationMessage) {
            document.getElementById('resConfirmationMsg').innerText = response.data.confirmationMessage;
          }

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
