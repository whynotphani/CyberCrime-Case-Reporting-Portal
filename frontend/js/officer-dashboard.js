let allCases = [];
let currentCaseNumber = null;
let officerList = [];

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

  document.getElementById('updateStatusForm').addEventListener('submit', handleStatusUpdate);
  document.getElementById('assignOfficerForm').addEventListener('submit', handleAssignOfficer);
});

async function loadOfficerProfile() {
  try {
    const res = await API.request('/api/auth/me');
    if (res.success && res.user.officer) {
      const off = res.user.officer;
      document.getElementById('officerNameBadge').innerText = `${off.name} (${off.badgeNumber})`;
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
    const res = await API.request(`/api/officer/cases?${queryParams.toString()}`);
    if (res.success) {
      allCases = res.data;
      updateMetrics(allCases);
      renderCaseTable(allCases);
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
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
  const underReview = cases.filter(c => c.status === 'UNDER_INVESTIGATION' || c.status === 'ASSIGNED').length;
  const resolvedClosed = cases.filter(c => c.status === 'RESOLVED' || c.status === 'CLOSED').length;

  document.getElementById('metricTotal').innerText = total;
  document.getElementById('metricNew').innerText = newCases;
  document.getElementById('metricHighPriority').innerText = highPriority;
  document.getElementById('metricUnderReview').innerText = underReview;
  document.getElementById('metricResolvedClosed').innerText = resolvedClosed;
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
      // Stay on same page (keep modal open) and refresh live modal data
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
      // Stay on same page (keep modal open) and refresh live modal data
      await openCaseModal(currentCaseNumber);
      await fetchCases();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function debounce(func, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
}
