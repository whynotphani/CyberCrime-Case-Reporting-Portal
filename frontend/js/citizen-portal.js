let selectedCategory = '';
let selectedFiles = [];

document.addEventListener('DOMContentLoaded', async () => {
  const token = API.getToken();
  const role = API.getUserRole();

  if (!token || role !== 'citizen') {
    showToast('Session expired or unauthorized. Please log in.', 'error');
    setTimeout(() => { window.location.href = 'citizen-login.html'; }, 1000);
    return;
  }

  await loadCitizenCaseData();
  setupCategorySelector();
  setupDropzone();

  const complaintForm = document.getElementById('complaintForm');
  if (complaintForm) {
    complaintForm.addEventListener('submit', handleComplaintSubmit);
  }

  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      API.logout('citizen-login.html');
    });
  }
});

async function loadCitizenCaseData() {
  try {
    const res = await API.request('/api/citizen/case');
    if (res.success) {
      const caseData = res.data.case;
      const citizenData = caseData.citizen;
      const evidenceList = res.data.evidence;

      document.getElementById('headerCaseNumber').innerText = caseData.caseNumber;
      document.getElementById('victimName').innerText = citizenData.fullName || 'Victim';
      document.getElementById('victimPhone').innerText = citizenData.phone;

      const statusBadge = document.getElementById('caseStatusBadge');
      statusBadge.innerText = caseData.status.replace(/_/g, ' ');
      statusBadge.className = `badge badge-status-${caseData.status}`;

      if (caseData.assignedOfficer && (caseData.assignedOfficer.name || caseData.assignedOfficer.badgeNumber)) {
        const banner = document.getElementById('officerNoticeBanner');
        const oName = document.getElementById('portalOfficerName');
        const oBadge = document.getElementById('portalOfficerBadge');
        if (banner) banner.style.display = 'block';
        if (oName) oName.innerText = `${caseData.assignedOfficer.name} (${caseData.assignedOfficer.department || 'Cyber Crime Division'})`;
        if (oBadge) oBadge.innerText = caseData.assignedOfficer.badgeNumber || 'Assigned';
      }

      if (caseData.category) {
        selectCategoryByName(caseData.category);
      }
      if (caseData.title) {
        const titleEl = document.getElementById('complaintTitle');
        if (titleEl) titleEl.value = caseData.title;
      }
      if (caseData.incidentDate) {
        document.getElementById('incidentDate').value = new Date(caseData.incidentDate).toISOString().slice(0, 16);
      }
      if (caseData.description) {
        document.getElementById('description').value = caseData.description;
      }
      if (caseData.lossAmount) {
        document.getElementById('lossAmount').value = caseData.lossAmount;
      }
      if (caseData.suspectDetails) {
        document.getElementById('suspectName').value = caseData.suspectDetails.name || '';
        document.getElementById('suspectPhone').value = caseData.suspectDetails.phone || '';
        document.getElementById('bankDetails').value = caseData.suspectDetails.bankDetails || '';
        document.getElementById('urlOrHandle').value = caseData.suspectDetails.urlOrHandle || '';
        document.getElementById('otherInfo').value = caseData.suspectDetails.otherInfo || '';
      }

      renderUploadedEvidence(evidenceList);
      await loadCaseHistory();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function setupCategorySelector() {
  const cards = document.querySelectorAll('.category-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedCategory = card.dataset.category;
    });
  });
}

function selectCategoryByName(name) {
  const cards = document.querySelectorAll('.category-card');
  cards.forEach(card => {
    if (card.dataset.category === name) {
      card.classList.add('selected');
      selectedCategory = name;
    }
  });
}

function setupDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('fileInput');

  if (!dropzone || !fileInput) return;

  dropzone.addEventListener('click', () => fileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleFilesSelected(e.dataTransfer.files);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      handleFilesSelected(e.target.files);
    }
  });
}

function handleFilesSelected(files) {
  const fileListContainer = document.getElementById('stagedFilesList');
  fileListContainer.innerHTML = '';
  selectedFiles = Array.from(files);

  if (selectedFiles.length === 0) return;

  selectedFiles.forEach((file, idx) => {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    fileItem.innerHTML = `
      <div class="file-info">
        <span>📎</span>
        <div>
          <strong>${file.name}</strong>
          <div style="font-size:0.78rem; color:var(--text-dim);">${sizeMb} MB</div>
        </div>
      </div>
      <button type="button" class="btn btn-sm btn-danger" onclick="removeStagedFile(${idx})">Remove</button>
    `;
    fileListContainer.appendChild(fileItem);
  });

  document.getElementById('uploadEvidenceBtn').disabled = false;
}

function removeStagedFile(idx) {
  selectedFiles.splice(idx, 1);
  handleFilesSelected(selectedFiles);
  if (selectedFiles.length === 0) {
    document.getElementById('uploadEvidenceBtn').disabled = true;
  }
}

async function handleComplaintSubmit(e) {
  e.preventDefault();

  if (!selectedCategory) {
    showToast('Please select a Crime Category.', 'error');
    return;
  }

  const payload = {
    title: document.getElementById('complaintTitle') ? document.getElementById('complaintTitle').value.trim() : '',
    category: selectedCategory,
    incidentDate: document.getElementById('incidentDate').value,
    description: document.getElementById('description').value,
    lossAmount: document.getElementById('lossAmount').value,
    suspectName: document.getElementById('suspectName').value,
    suspectPhone: document.getElementById('suspectPhone').value,
    bankDetails: document.getElementById('bankDetails').value,
    urlOrHandle: document.getElementById('urlOrHandle').value,
    otherInfo: document.getElementById('otherInfo').value
  };

  try {
    const res = await API.request('/api/citizen/case/submit', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });

    if (res.success) {
      showToast('Complaint details submitted successfully!', 'success');
      await loadCitizenCaseData();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function uploadStagedEvidence() {
  if (selectedFiles.length === 0) return;

  const uploadBtn = document.getElementById('uploadEvidenceBtn');
  uploadBtn.disabled = true;
  uploadBtn.innerText = 'Uploading Files...';

  const formData = new FormData();
  selectedFiles.forEach(file => formData.append('evidenceFiles', file));
  formData.append('fileCategory', document.getElementById('evidenceCategory').value || 'OTHER');

  try {
    const res = await API.request('/api/citizen/case/evidence', {
      method: 'POST',
      body: formData
    });

    if (res.success) {
      showToast('Evidence uploaded successfully!', 'success');
      selectedFiles = [];
      document.getElementById('stagedFilesList').innerHTML = '';
      uploadBtn.innerText = 'Upload Selected Evidence';
      await loadCitizenCaseData();
    }
  } catch (err) {
    showToast(err.message, 'error');
    uploadBtn.disabled = false;
    uploadBtn.innerText = 'Upload Selected Evidence';
  }
}

function renderUploadedEvidence(files) {
  const container = document.getElementById('uploadedEvidenceContainer');
  if (!container) return;

  if (!files || files.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted); font-size:0.9rem;">No evidence files attached yet.</p>';
    return;
  }

  container.innerHTML = files.map(f => {
    const sizeMb = (f.fileSize / (1024 * 1024)).toFixed(2);
    const dateStr = new Date(f.uploadedAt).toLocaleString();
    return `
      <div class="file-item">
        <div class="file-info">
          <span style="font-size:1.2rem;">📁</span>
          <div>
            <strong>${f.originalName}</strong>
            <div style="font-size:0.78rem; color:var(--text-dim);">${f.fileCategory} • ${sizeMb} MB • Uploaded ${dateStr}</div>
          </div>
        </div>
        <a href="/api/citizen/case/evidence/${f._id}/download" target="_blank" class="btn btn-sm btn-secondary">
          View / Download
        </a>
      </div>
    `;
  }).join('');
}

async function loadCaseHistory() {
  try {
    const res = await API.request('/api/citizen/case/history');
    if (res.success && res.data) {
      const container = document.getElementById('timelineContainer');
      const instrEl = document.getElementById('portalOfficerInstruction');

      const latestOfficerItem = res.data.find(h => h.updatedByRole === 'OFFICER' || (h.remarks && h.remarks.length > 5));
      if (instrEl && latestOfficerItem) {
        instrEl.innerText = `Latest Officer Note: "${latestOfficerItem.remarks}"`;
      }

      if (!container) return;

      container.innerHTML = res.data.map(item => {
        const timeStr = new Date(item.timestamp).toLocaleString();
        return `
          <div class="timeline-item">
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <div class="header">
                <span class="title">Status: ${item.status.replace(/_/g, ' ')}</span>
                <span class="time">${timeStr}</span>
              </div>
              <p class="remarks">${item.remarks}</p>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('History load error:', err);
  }
}
