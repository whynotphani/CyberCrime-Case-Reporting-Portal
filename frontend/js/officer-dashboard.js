let allCases = [];
let currentCaseNumber = null;
let officerList = [];
let currentUserEmail = '';
let allCredentialsList = [];

document.addEventListener('DOMContentLoaded', async () => {
  const token = API.getToken();
  const role = API.getUserRole();

  if (!token || role !== 'officer') {
    showToast('Officer authentication required.', 'error');
    setTimeout(() => { window.location.href = 'officer-login.html'; }, 1000);
    return;
  }

  await loadOfficerProfile();
  await fetchCases();
  await fetchOfficersList();

  document.getElementById('categoryFilter').addEventListener('change', fetchCases);
  document.getElementById('priorityFilter').addEventListener('change', fetchCases);
  document.getElementById('statusFilter').addEventListener('change', fetchCases);
  document.getElementById('searchInput').addEventListener('input', debounce(fetchCases, 300));

  const sortFilter = document.getElementById('sortFilter');
  if (sortFilter) {
    sortFilter.addEventListener('change', applySortAndRender);
  }

  const logoutOfficerBtn = document.getElementById('logoutOfficerBtn');
  if (logoutOfficerBtn) {
    logoutOfficerBtn.addEventListener('click', (e) => {
      e.preventDefault();
      API.logout('officer-login.html');
    });
  }

  const caseDetailModal = document.getElementById('caseDetailModal');
  if (caseDetailModal) {
    caseDetailModal.addEventListener('click', (e) => {
      if (e.target === caseDetailModal) {
        caseDetailModal.classList.remove('active');
      }
    });
  }

  document.getElementById('closeDetailModalBtn').addEventListener('click', () => {
    if (caseDetailModal) caseDetailModal.classList.remove('active');
  });

  // Delete Case Reason Modal Setup
  const deleteCaseBtn = document.getElementById('deleteCaseBtn');
  const deleteReasonModal = document.getElementById('deleteReasonModal');
  const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
  const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
  const deleteCaseForm = document.getElementById('deleteCaseForm');

  if (deleteCaseBtn && deleteReasonModal) {
    deleteCaseBtn.addEventListener('click', () => {
      if (!currentCaseNumber) return;
      document.getElementById('deleteModalCaseNumber').innerText = currentCaseNumber;
      document.getElementById('deleteReasonSelect').value = '';
      document.getElementById('deleteRemarksInput').value = '';
      deleteReasonModal.classList.add('active');
    });
  }

  if (closeDeleteModalBtn && deleteReasonModal) {
    closeDeleteModalBtn.addEventListener('click', () => deleteReasonModal.classList.remove('active'));
  }

  if (cancelDeleteBtn && deleteReasonModal) {
    cancelDeleteBtn.addEventListener('click', () => deleteReasonModal.classList.remove('active'));
  }

  if (deleteReasonModal) {
    deleteReasonModal.addEventListener('click', (e) => {
      if (e.target === deleteReasonModal) deleteReasonModal.classList.remove('active');
    });
  }

  if (deleteCaseForm) {
    deleteCaseForm.addEventListener('submit', handleConfirmDeleteCase);
  }

  // Manage Credentials Modal Setup (Super Admin marpuphani00@gmail.com Only)
  const manageCredentialsNavBtn = document.getElementById('manageCredentialsNavBtn');
  const manageCredentialsModal = document.getElementById('manageCredentialsModal');
  const closeCredentialsModalBtn = document.getElementById('closeCredentialsModalBtn');
  const addNewOfficerBtn = document.getElementById('addNewOfficerBtn');
  const cancelOfficerFormBtn = document.getElementById('cancelOfficerFormBtn');
  const officerCredentialForm = document.getElementById('officerCredentialForm');
  const credentialSearchInput = document.getElementById('credentialSearchInput');

  if (manageCredentialsNavBtn && manageCredentialsModal) {
    manageCredentialsNavBtn.addEventListener('click', () => {
      const badgeText = document.getElementById('officerNameBadge') ? document.getElementById('officerNameBadge').innerText : '';
      const isSuperAdminUser = currentUserEmail === 'marpuphani00@gmail.com' ||
                               badgeText.includes('CYBER-2005') ||
                               badgeText.includes('Phanindra');
      if (!isSuperAdminUser) {
        showToast('Access restricted to Super Admin marpuphani00@gmail.com', 'error');
        return;
      }
      manageCredentialsModal.classList.add('active');
      if (document.getElementById('officerPortalNavBtn')) document.getElementById('officerPortalNavBtn').classList.remove('active');
      if (manageCredentialsNavBtn) manageCredentialsNavBtn.classList.add('active');
      fetchOfficerCredentials();
    });
  }

  function closeManageOfficersModal() {
    if (manageCredentialsModal) manageCredentialsModal.classList.remove('active');
    if (document.getElementById('officerPortalNavBtn')) document.getElementById('officerPortalNavBtn').classList.add('active');
    if (manageCredentialsNavBtn) manageCredentialsNavBtn.classList.remove('active');
  }

  if (closeCredentialsModalBtn && manageCredentialsModal) {
    closeCredentialsModalBtn.addEventListener('click', closeManageOfficersModal);
  }

  if (manageCredentialsModal) {
    manageCredentialsModal.addEventListener('click', (e) => {
      if (e.target === manageCredentialsModal) closeManageOfficersModal();
    });
  }

  if (addNewOfficerBtn) {
    addNewOfficerBtn.addEventListener('click', () => {
      resetOfficerForm();
      document.getElementById('officerFormTitle').innerText = 'Add New Officer Credential';
      document.getElementById('passReqLabel').innerText = '*';
      document.getElementById('offPasswordInput').required = true;
      if (document.getElementById('deleteOfficerFromFormBtn')) {
        document.getElementById('deleteOfficerFromFormBtn').style.display = 'none';
      }
      document.getElementById('officerFormContainer').style.display = 'block';
    });
  }

  if (cancelOfficerFormBtn) {
    cancelOfficerFormBtn.addEventListener('click', () => {
      document.getElementById('officerFormContainer').style.display = 'none';
      resetOfficerForm();
    });
  }

  const deleteOfficerFromFormBtn = document.getElementById('deleteOfficerFromFormBtn');
  if (deleteOfficerFromFormBtn) {
    deleteOfficerFromFormBtn.addEventListener('click', () => {
      const editId = document.getElementById('editOfficerId').value;
      const editName = document.getElementById('offNameInput').value;
      if (editId) {
        promptDeleteOfficer(editId, editName);
      }
    });
  }

  if (officerCredentialForm) {
    officerCredentialForm.addEventListener('submit', handleSaveOfficerCredential);
  }

  if (credentialSearchInput) {
    credentialSearchInput.addEventListener('input', () => {
      renderCredentialsTable(allCredentialsList);
    });
  }

  document.getElementById('updateStatusForm').addEventListener('submit', handleStatusUpdate);
  document.getElementById('assignOfficerForm').addEventListener('submit', handleAssignOfficer);
});

async function loadOfficerProfile() {
  try {
    const res = await API.request('/api/auth/me');
    if (res.success && res.user.officer) {
      const off = res.user.officer;
      currentUserEmail = (off.email || '').toLowerCase().trim();
      document.getElementById('officerNameBadge').innerText = `${off.name} (${off.badgeNumber})`;

      const isSuperAdminUser = currentUserEmail === 'marpuphani00@gmail.com' ||
                               off.badgeNumber === 'CYBER-2005' ||
                               off.role === 'ADMIN';

      const manageNavBtn = document.getElementById('manageCredentialsNavBtn');
      if (manageNavBtn) {
        if (isSuperAdminUser) {
          manageNavBtn.style.display = 'inline-block';
        } else {
          manageNavBtn.style.display = 'none';
        }
      }
    }
  } catch (err) {
    showToast('Failed to load officer profile.', 'error');
  }
}

async function fetchCases() {
  const category = document.getElementById('categoryFilter').value;
  const priority = document.getElementById('priorityFilter').value;
  const status = document.getElementById('statusFilter').value;
  const search = document.getElementById('searchInput').value;

  const queryParams = new URLSearchParams();
  if (category) queryParams.append('category', category);
  if (priority) queryParams.append('priority', priority);
  if (status) queryParams.append('status', status);
  if (search) queryParams.append('search', search);

  try {
    // 1. Fetch all cases globally without filters to calculate exact dashboard metric cards
    const rawAllRes = await API.request('/api/officer/cases');
    if (rawAllRes.success && rawAllRes.data) {
      updateMetrics(rawAllRes.data);
    }

    // 2. Fetch filtered cases to populate data table & mobile list
    const res = await API.request(`/api/officer/cases?${queryParams.toString()}`);
    if (res.success) {
      allCases = res.data;
      applySortAndRender();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function applySortAndRender() {
  const sortSelect = document.getElementById('sortFilter');
  const sortVal = sortSelect ? sortSelect.value : 'number_asc';
  const sorted = sortCasesData(allCases, sortVal);
  renderCaseTable(sorted);
}

function sortCasesData(cases, sortVal) {
  const list = [...cases];

  switch (sortVal) {
    case 'number_asc':
      list.sort((a, b) => a.caseNumber.localeCompare(b.caseNumber, undefined, { numeric: true, sensitivity: 'base' }));
      break;
    case 'number_desc':
      list.sort((a, b) => b.caseNumber.localeCompare(a.caseNumber, undefined, { numeric: true, sensitivity: 'base' }));
      break;
    case 'loss_desc':
      list.sort((a, b) => (Number(b.lossAmount) || 0) - (Number(a.lossAmount) || 0));
      break;
    case 'loss_asc':
      list.sort((a, b) => (Number(a.lossAmount) || 0) - (Number(b.lossAmount) || 0));
      break;
    default:
      list.sort((a, b) => a.caseNumber.localeCompare(b.caseNumber, undefined, { numeric: true }));
  }
  return list;
}

function toggleSort(type) {
  const sortSelect = document.getElementById('sortFilter');
  if (!sortSelect) return;
  if (type === 'number') {
    sortSelect.value = sortSelect.value === 'number_asc' ? 'number_desc' : 'number_asc';
  } else if (type === 'loss') {
    sortSelect.value = sortSelect.value === 'loss_desc' ? 'loss_asc' : 'loss_desc';
  }
  applySortAndRender();
}

async function fetchOfficersList() {
  try {
    const res = await API.request('/api/officer/list');
    if (res.success) {
      officerList = res.data;
      const assignSelect = document.getElementById('targetOfficerSelect');
      assignSelect.innerHTML = '<option value="">Select Cybercrime Expert...</option>';
      officerList.forEach(off => {
        assignSelect.innerHTML += `<option value="${off._id}">${off.name} (${off.badgeNumber} - ${off.department})</option>`;
      });
    }
  } catch (err) {
    console.error('Officer list error:', err);
  }
}

function updateMetrics(cases) {
  const total = cases.length;
  const newCases = cases.filter(c => c.status === 'SUBMITTED' || c.status === 'VERIFICATION_PENDING').length;
  const highPriority = cases.filter(c => c.priority === 'HIGH').length;
  const activeCases = cases.filter(c => ['UNDER_INVESTIGATION', 'UNDER_REVIEW', 'SUBMITTED', 'ASSIGNED', 'VERIFICATION_PENDING', 'ADDITIONAL_INFO_REQUIRED'].includes(c.status)).length;
  const resolvedClosed = cases.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length;

  if (document.getElementById('metricTotal')) document.getElementById('metricTotal').innerText = total;
  if (document.getElementById('metricNew')) document.getElementById('metricNew').innerText = newCases;
  if (document.getElementById('metricHighPriority')) document.getElementById('metricHighPriority').innerText = highPriority;
  if (document.getElementById('metricUnderReview')) document.getElementById('metricUnderReview').innerText = activeCases;
  if (document.getElementById('metricResolvedClosed')) document.getElementById('metricResolvedClosed').innerText = resolvedClosed;
}

function renderCaseTable(cases) {
  const tbody = document.getElementById('caseTableBody');
  const mobileContainer = document.getElementById('mobileCaseCardsList');

  if (cases.length === 0) {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="8" style="text-align:center; padding: 2.5rem; color:var(--text-muted);">
            No cybercrime cases match the active filter criteria.
          </td>
        </tr>
      `;
    }
    if (mobileContainer) {
      mobileContainer.innerHTML = `
        <div style="text-align:center; padding: 2rem; color:var(--text-muted); font-size:0.9rem;">
          No cybercrime cases match the active filter criteria.
        </div>
      `;
    }
    return;
  }

  // Render Desktop Data Table (Only Review Case option)
  if (tbody) {
    tbody.innerHTML = cases.map(c => {
      const dateStr = c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : new Date(c.createdAt).toLocaleDateString();
      const assigned = c.assignedOfficer ? c.assignedOfficer.name : 'Unassigned';
      const lossStr = `₹${c.lossAmount ? Number(c.lossAmount).toLocaleString('en-IN') : '0'}`;

      return `
        <tr>
          <td class="case-id-cell">${c.caseNumber}</td>
          <td>${c.category}</td>
          <td><span class="badge badge-priority-${c.priority}">${c.priority}</span></td>
          <td style="font-size:0.85rem; color:var(--text-muted);">${dateStr}</td>
          <td><span class="badge badge-status-${c.status}">${c.status.replace(/_/g, ' ')}</span></td>
          <td style="font-size:0.88rem; font-weight:600; color:var(--accent-gold);">${lossStr}</td>
          <td style="font-size:0.85rem; color:var(--text-muted);">${assigned}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="openCaseModal('${c.caseNumber}')">
              Review Case
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Render Mobile Case Cards View
  if (mobileContainer) {
    mobileContainer.innerHTML = cases.map(c => {
      const dateStr = c.submittedAt ? new Date(c.submittedAt).toLocaleDateString() : new Date(c.createdAt).toLocaleDateString();
      const assigned = c.assignedOfficer ? c.assignedOfficer.name : 'Unassigned';
      const lossStr = `₹${c.lossAmount ? Number(c.lossAmount).toLocaleString('en-IN') : '0'}`;

      return `
        <div class="officer-mobile-card">
          <div class="card-top">
            <span class="case-number">${c.caseNumber}</span>
            <span class="badge badge-status-${c.status}">${c.status.replace(/_/g, ' ')}</span>
          </div>

          <div style="font-weight:600; font-size:1.02rem; margin-bottom:0.4rem; color:#fff;">
            ${c.category}
          </div>

          <div class="card-meta">
            <div>
              <span class="label">Priority / Severity</span>
              <span class="badge badge-priority-${c.priority}">${c.priority}</span>
            </div>
            <div>
              <span class="label">Financial Loss</span>
              <strong style="color:var(--accent-gold); font-size:0.9rem;">${lossStr}</strong>
            </div>
          </div>

          <div class="card-footer">
            <div style="font-size:0.78rem; color:var(--text-muted);">
              <div>Date: ${dateStr}</div>
              <div>Expert: ${assigned}</div>
            </div>
            <button class="btn btn-sm btn-primary" onclick="openCaseModal('${c.caseNumber}')">
              Review Case →
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}

async function openCaseModal(caseNumber) {
  currentCaseNumber = caseNumber;

  try {
    const res = await API.request(`/api/officer/cases/${caseNumber}`);
    if (res.success) {
      const { case: c, evidence, history } = res.data;

      document.getElementById('modalCaseNumber').innerText = c.caseNumber;
      document.getElementById('detailVictimName').innerText = c.citizen?.fullName || 'N/A';
      document.getElementById('detailVictimPhone').innerText = c.citizen?.phone || 'N/A';
      document.getElementById('detailVictimEmail').innerText = c.citizen?.email || 'N/A';
      document.getElementById('detailIdProof').innerText = `${c.citizen?.idProofType || ''} ${c.citizen?.idProofNumber || ''}`;

      document.getElementById('detailCategory').innerText = c.category;
      document.getElementById('detailPriority').className = `badge badge-priority-${c.priority}`;
      document.getElementById('detailPriority').innerText = c.priority;
      document.getElementById('detailStatus').className = `badge badge-status-${c.status}`;
      document.getElementById('detailStatus').innerText = c.status.replace(/_/g, ' ');
      document.getElementById('detailLossAmount').innerText = `₹${c.lossAmount ? c.lossAmount.toLocaleString() : '0'}`;
      document.getElementById('detailIncidentDate').innerText = c.incidentDate ? new Date(c.incidentDate).toLocaleString() : 'N/A';
      document.getElementById('detailDescription').innerText = c.description || 'No detailed description provided yet.';

      const suspect = c.suspectDetails || {};
      document.getElementById('detailSuspect').innerHTML = `
        <strong>Name/Alias:</strong> ${suspect.name || 'N/A'}<br>
        <strong>Phone:</strong> ${suspect.phone || 'N/A'}<br>
        <strong>Bank Account / UPI:</strong> ${suspect.bankDetails || 'N/A'}<br>
        <strong>URL / Social Handle:</strong> ${suspect.urlOrHandle || 'N/A'}
      `;

      const evidenceContainer = document.getElementById('modalEvidenceList');
      if (evidence.length === 0) {
        evidenceContainer.innerHTML = '<p style="color:var(--text-muted); font-size:0.88rem;">No evidence files uploaded for this case.</p>';
      } else {
        evidenceContainer.innerHTML = evidence.map(f => `
          <div class="file-item" style="margin-bottom:0.5rem;">
            <div class="file-info">
              <span>📄</span>
              <div>
                <strong>${f.originalName}</strong> (${f.fileCategory})
                <div style="font-size:0.75rem; color:var(--text-dim);">${(f.fileSize/1024/1024).toFixed(2)} MB</div>
              </div>
            </div>
            <a href="/api/officer/evidence/${f._id}/download?token=${encodeURIComponent(API.getToken() || '')}" target="_blank" class="btn btn-sm btn-accent">
              Inspect File
            </a>
          </div>
        `).join('');
      }

      const historyContainer = document.getElementById('modalHistoryList');
      historyContainer.innerHTML = history.map(h => `
        <div style="margin-bottom:0.75rem; font-size:0.85rem; border-left:2px solid var(--primary); padding-left:0.75rem;">
          <div style="display:flex; justify-content:space-between; color:var(--text-muted); font-size:0.78rem;">
            <span>By: ${h.updatedByOfficer ? h.updatedByOfficer.name : h.updatedByRole}</span>
            <span>${new Date(h.timestamp).toLocaleString()}</span>
          </div>
          <div style="font-weight:600; color:var(--accent-cyan); margin:0.15rem 0;">Status: ${h.status.replace(/_/g, ' ')}</div>
          <p style="margin:0; color:var(--text-main);">${h.remarks || ''}</p>
        </div>
      `).join('');

      document.getElementById('caseDetailModal').classList.add('active');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleConfirmDeleteCase(e) {
  e.preventDefault();
  if (!currentCaseNumber) return;

  const reason = document.getElementById('deleteReasonSelect').value;
  const remarks = document.getElementById('deleteRemarksInput').value.trim();

  if (!reason) {
    showToast('Please select a reason for deleting this case.', 'error');
    return;
  }

  try {
    const res = await API.request(`/api/officer/cases/${currentCaseNumber}`, {
      method: 'DELETE',
      body: JSON.stringify({ reason, remarks })
    });

    if (res && res.success) {
      showToast(res.message || `Case ${currentCaseNumber} deleted successfully!`, 'success');
      
      const deleteReasonModal = document.getElementById('deleteReasonModal');
      if (deleteReasonModal) deleteReasonModal.classList.remove('active');

      const caseDetailModal = document.getElementById('caseDetailModal');
      if (caseDetailModal) caseDetailModal.classList.remove('active');

      currentCaseNumber = null;
      await fetchCases();
    } else {
      showToast(res ? res.message : 'Failed to delete case.', 'error');
    }
  } catch (err) {
    showToast(err.message || 'Failed to delete case.', 'error');
  }
}

async function handleStatusUpdate(e) {
  e.preventDefault();
  if (!currentCaseNumber) return;

  const status = document.getElementById('updateStatusSelect').value;
  const remarks = document.getElementById('updateRemarksInput').value.trim();

  if (!status) {
    showToast('Please select a target status.', 'error');
    return;
  }

  try {
    const res = await API.request(`/api/officer/cases/${currentCaseNumber}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, remarks })
    });

    if (res.success) {
      showToast('Case status updated successfully!', 'success');
      document.getElementById('updateRemarksInput').value = '';
      await openCaseModal(currentCaseNumber);
      await fetchCases();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function handleAssignOfficer(e) {
  e.preventDefault();
  if (!currentCaseNumber) return;

  const targetOfficerId = document.getElementById('targetOfficerSelect').value;
  const remarks = document.getElementById('assignRemarksInput').value.trim();

  if (!targetOfficerId) {
    showToast('Please select an investigating officer.', 'error');
    return;
  }

  try {
    const res = await API.request(`/api/officer/cases/${currentCaseNumber}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ targetOfficerId, remarks })
    });

    if (res.success) {
      showToast('Case assignment forwarded successfully!', 'success');
      document.getElementById('assignRemarksInput').value = '';
      await openCaseModal(currentCaseNumber);
      await fetchCases();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

// ----------------------------------------------------
// Super Admin Credential Management Functions
// (Restricted to marpuphani00@gmail.com)
// ----------------------------------------------------
async function fetchOfficerCredentials() {
  try {
    const res = await API.request('/api/officer/credentials');
    if (res.success) {
      allCredentialsList = res.data;
      renderCredentialsTable(allCredentialsList);
    }
  } catch (err) {
    showToast(err.message || 'Failed to load officer credentials list.', 'error');
  }
}

function renderCredentialsTable(list) {
  const tbody = document.getElementById('credentialsTableBody');
  if (!tbody) return;

  const search = document.getElementById('credentialSearchInput') ? document.getElementById('credentialSearchInput').value.trim().toLowerCase() : '';
  let filtered = [...list];
  if (search) {
    filtered = filtered.filter(o =>
      (o.name && o.name.toLowerCase().includes(search)) ||
      (o.badgeNumber && o.badgeNumber.toLowerCase().includes(search)) ||
      (o.email && o.email.toLowerCase().includes(search)) ||
      (o.department && o.department.toLowerCase().includes(search))
    );
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center; padding: 2.5rem; color: var(--text-muted);">
          No officer credentials found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(o => {
    return `
      <tr>
        <td style="padding: 1.15rem 1.25rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 38px; height: 38px; background: rgba(6,182,212,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.15rem; flex-shrink: 0; border: 1px solid rgba(6,182,212,0.3);">👮‍♂️</div>
            <div style="font-weight: 700; color: #fff; font-size: 1rem; font-family: var(--font-heading);">${o.name}</div>
          </div>
        </td>
        <td style="padding: 1.15rem 1.25rem;">
          <div style="font-size: 0.92rem; font-weight: 600; color: #e2e8f0;">${o.department || 'Financial Fraud Cell'}</div>
        </td>
        <td style="padding: 1.15rem 1.25rem; text-align: right;">
          <button class="btn btn-sm btn-accent" style="padding: 0.45rem 0.95rem; font-size: 0.84rem; font-weight: 600;" onclick="openEditOfficerForm('${o._id || o.officerId}')">
            ✏️ Edit
          </button>
        </td>
      </tr>
    `;
  }).join('');

  // Render Mobile Cards View for Officers
  const mobileContainer = document.getElementById('mobileCredentialsList');
  if (mobileContainer) {
    if (filtered.length === 0) {
      mobileContainer.innerHTML = `
        <div style="text-align:center; padding: 2rem; color: var(--text-muted); font-size: 0.9rem;">
          No officer credentials found.
        </div>
      `;
    } else {
      mobileContainer.innerHTML = filtered.map(o => {
        return `
          <div style="background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: var(--radius-md); padding: 1rem; margin-bottom: 0.85rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.65rem;">
              <div style="display: flex; align-items: center; gap: 0.6rem;">
                <div style="width: 36px; height: 36px; background: rgba(6,182,212,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0; border: 1px solid rgba(6,182,212,0.3);">👮‍♂️</div>
                <div>
                  <div style="font-weight: 700; color: #fff; font-size: 0.96rem; font-family: var(--font-heading);">${o.name}</div>
                  <div style="font-size: 0.78rem; color: var(--accent-cyan); font-family: monospace;">${o.badgeNumber}</div>
                </div>
              </div>
              <button class="btn btn-sm btn-accent" style="padding: 0.35rem 0.75rem; font-size: 0.8rem; font-weight: 600;" onclick="openEditOfficerForm('${o._id || o.officerId}')">
                ✏️ Edit
              </button>
            </div>

            <div style="font-size: 0.85rem; color: #e2e8f0; background: rgba(0,0,0,0.2); padding: 0.5rem 0.75rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04);">
              <div style="color: var(--text-muted); font-size: 0.75rem; font-weight: 500; text-transform: uppercase; margin-bottom: 0.1rem;">Department</div>
              <div style="font-weight: 600; color: #fff;">${o.department || 'Financial Fraud Cell'}</div>
            </div>
          </div>
        `;
      }).join('');
    }
  }
}

function toggleShowPassword(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
  } else {
    input.type = 'password';
  }
}

function resetOfficerForm() {
  document.getElementById('editOfficerId').value = '';
  document.getElementById('offNameInput').value = '';
  document.getElementById('offBadgeInput').value = '';
  document.getElementById('offEmailInput').value = '';
  document.getElementById('offPasswordInput').value = '';
  if (document.getElementById('offDeptSelect')) {
    document.getElementById('offDeptSelect').value = 'Financial Fraud Cell';
  }
  document.getElementById('offRoleSelect').value = 'INVESTIGATING_OFFICER';
  if (document.getElementById('deleteOfficerFromFormBtn')) {
    document.getElementById('deleteOfficerFromFormBtn').style.display = 'none';
  }
}

function openEditOfficerForm(id) {
  const off = allCredentialsList.find(o => o._id === id || o.officerId === id);
  if (!off) return;

  const isSelf = off.email && off.email.toLowerCase() === 'marpuphani00@gmail.com';

  document.getElementById('editOfficerId').value = off._id || off.officerId;
  document.getElementById('offNameInput').value = off.name || '';
  document.getElementById('offBadgeInput').value = off.badgeNumber || '';
  document.getElementById('offEmailInput').value = off.email || '';
  document.getElementById('offPasswordInput').value = off.plainPassword || (isSelf ? 'phani@2005' : 'password123');

  if (document.getElementById('offDeptSelect')) {
    document.getElementById('offDeptSelect').value = off.department || 'Financial Fraud Cell';
  }

  document.getElementById('offRoleSelect').value = off.role || 'INVESTIGATING_OFFICER';

  document.getElementById('officerFormTitle').innerText = `Edit Credential for ${off.name}`;
  document.getElementById('passReqLabel').innerText = '(Optional - Edit or keep current password)';
  document.getElementById('offPasswordInput').required = false;

  const deleteBtn = document.getElementById('deleteOfficerFromFormBtn');
  if (deleteBtn) {
    if (isSelf) {
      deleteBtn.style.display = 'none';
    } else {
      deleteBtn.style.display = 'inline-block';
    }
  }

  document.getElementById('officerFormContainer').style.display = 'block';
}

async function handleSaveOfficerCredential(e) {
  e.preventDefault();
  const id = document.getElementById('editOfficerId').value;
  const name = document.getElementById('offNameInput').value.trim();
  const badgeNumber = document.getElementById('offBadgeInput').value.trim();
  const email = document.getElementById('offEmailInput').value.trim();
  const password = document.getElementById('offPasswordInput').value.trim();
  const department = document.getElementById('offDeptSelect') ? document.getElementById('offDeptSelect').value : 'Financial Fraud Cell';
  const role = document.getElementById('offRoleSelect').value;

  const bodyData = { name, badgeNumber, email, department, role };
  if (password) bodyData.password = password;

  try {
    let res;
    if (id) {
      res = await API.request(`/api/officer/credentials/${id}`, {
        method: 'PUT',
        body: JSON.stringify(bodyData)
      });
    } else {
      if (!password) {
        showToast('Password is required for new officer credentials.', 'error');
        return;
      }
      res = await API.request('/api/officer/credentials', {
        method: 'POST',
        body: JSON.stringify({ ...bodyData, password })
      });
    }

    if (res.success) {
      showToast(res.message || 'Officer credential saved successfully!', 'success');
      document.getElementById('officerFormContainer').style.display = 'none';
      resetOfficerForm();
      await fetchOfficerCredentials();
      await fetchOfficersList();
    }
  } catch (err) {
    showToast(err.message || 'Failed to save officer credential.', 'error');
  }
}

async function promptDeleteOfficer(id, name) {
  const confirmed = confirm(`⚠️ Are you sure you want to delete credentials for ${name}?`);
  if (!confirmed) return;

  try {
    const res = await API.request(`/api/officer/credentials/${id}`, {
      method: 'DELETE'
    });

    if (res.success) {
      showToast(res.message || `Officer ${name} deleted successfully.`, 'success');
      document.getElementById('officerFormContainer').style.display = 'none';
      resetOfficerForm();
      await fetchOfficerCredentials();
      await fetchOfficersList();
    }
  } catch (err) {
    showToast(err.message || 'Failed to delete officer credential.', 'error');
  }
}

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}
