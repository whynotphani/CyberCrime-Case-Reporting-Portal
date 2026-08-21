document.addEventListener('DOMContentLoaded', async () => {
  const isAuth = API.requireRole('citizen');
  if (isAuth === false) return;

  const logoutBtn = document.getElementById('logoutStatusBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      API.logout('citizen-login.html');
    });
  }

  await loadCitizenStatusData();
});

async function loadCitizenStatusData() {
  try {
    const response = await API.request('/api/citizen/case');
    if (response.success && response.data.case) {
      const c = response.data.case;
      const citizen = c.citizen || {};
      const officer = c.assignedOfficer || {};
      const suspect = c.suspectDetails || {};

      document.getElementById('statusCaseNumber').innerText = c.caseNumber || '-';
      if (document.getElementById('headerCaseNumber')) document.getElementById('headerCaseNumber').innerText = c.caseNumber || '-';
      document.getElementById('statusCitizenName').innerText = citizen.fullName || 'Citizen';
      document.getElementById('statusCitizenPhone').innerText = citizen.phone || '-';
      document.getElementById('statusCategory').innerText = c.category || 'Other Cybercrime';

      const statusBadge = document.getElementById('statusBadge');
      statusBadge.innerText = (c.status || 'SUBMITTED').replace(/_/g, ' ');
      statusBadge.className = `badge badge-status-${c.status || 'SUBMITTED'}`;

      const priorityBadge = document.getElementById('statusPriority');
      priorityBadge.innerText = c.priority || 'MEDIUM';
      priorityBadge.className = `badge badge-priority-${c.priority || 'MEDIUM'}`;

      const subDate = c.submittedAt || c.createdAt;
      document.getElementById('statusSubmissionDate').innerText = subDate ? new Date(subDate).toLocaleString() : 'Pending Submission';
      document.getElementById('statusLastUpdated').innerText = c.updatedAt ? new Date(c.updatedAt).toLocaleString() : '-';

      // Populate Investigating Officer Details
      const officerNameEl = document.getElementById('statusOfficerName');
      const officerBadgeEl = document.getElementById('statusOfficerBadge');
      const officerDeptEl = document.getElementById('statusOfficerDept');

      if (officer && (officer.name || officer.badgeNumber)) {
        if (officerNameEl) officerNameEl.innerText = officer.name || 'Assigned Officer';
        if (officerBadgeEl) officerBadgeEl.innerText = officer.badgeNumber || 'Assigned';
        if (officerDeptEl) officerDeptEl.innerText = officer.department || 'Cyber Crime Division';
      } else {
        if (officerNameEl) officerNameEl.innerText = 'Pending Officer Assignment';
        if (officerBadgeEl) officerBadgeEl.innerText = 'N/A';
        if (officerDeptEl) officerDeptEl.innerText = 'Cybercrime Desk';
      }

      // Populate Complaint Details
      const titleEl = document.getElementById('statusComplaintTitle');
      if (titleEl) titleEl.innerText = c.title || `${c.category || 'Cybercrime'} Complaint`;

      const lossEl = document.getElementById('statusLossAmount');
      if (lossEl) lossEl.innerText = c.lossAmount ? `₹ ${Number(c.lossAmount).toLocaleString('en-IN')}` : 'N/A';

      const descEl = document.getElementById('statusDescription');
      if (descEl) descEl.innerText = c.description || 'No detailed description provided yet.';

      // Populate Suspect Details
      const suspectNamePhoneEl = document.getElementById('statusSuspectNamePhone');
      if (suspectNamePhoneEl) {
        const sName = suspect.name || '';
        const sPhone = suspect.phone || '';
        suspectNamePhoneEl.innerText = (sName || sPhone) ? `${sName} ${sPhone ? '(' + sPhone + ')' : ''}`.trim() : 'Not Provided';
      }

      const suspectBankUrlEl = document.getElementById('statusSuspectBankUrl');
      if (suspectBankUrlEl) {
        const sBank = suspect.bankDetails || '';
        const sUrl = suspect.urlOrHandle || '';
        if (sBank || sUrl) {
          let htmlParts = [];
          if (sBank) htmlParts.push(`<span>${sBank}</span>`);
          if (sUrl) {
            if (sUrl.startsWith('http://') || sUrl.startsWith('https://')) {
              htmlParts.push(`<a href="${sUrl}" target="_blank" style="color:var(--accent-cyan); text-decoration:underline; word-break:break-all; overflow-wrap:anywhere;">${sUrl}</a>`);
            } else {
              htmlParts.push(`<span style="word-break:break-all; overflow-wrap:anywhere;">${sUrl}</span>`);
            }
          }
          suspectBankUrlEl.innerHTML = htmlParts.join(' <span style="color:var(--text-dim);">|</span> ');
        } else {
          suspectBankUrlEl.innerText = 'Not Provided';
        }
      }

      await loadCitizenMilestoneHistory();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function loadCitizenMilestoneHistory() {
  const container = document.getElementById('statusTimeline');
  const remarksBanner = document.getElementById('statusOfficerRemarks');

  try {
    const response = await API.request('/api/citizen/case/history');
    if (response.success && response.data) {
      const history = response.data;
      if (!history || history.length === 0) {
        if (container) container.innerHTML = `<div style="color:var(--text-muted); font-size:0.9rem;">No status history recorded yet.</div>`;
        return;
      }

      // Display latest officer instruction in the banner if available
      const latestOfficerItem = history.find(h => h.updatedByRole === 'OFFICER' || (h.remarks && h.remarks.length > 5));
      if (remarksBanner && latestOfficerItem) {
        remarksBanner.innerText = latestOfficerItem.remarks;
      }

      if (container) {
        container.innerHTML = history.map(item => {
          const timeStr = new Date(item.timestamp).toLocaleString();
          const displayStatus = (item.status || '').replace(/_/g, ' ');

          return `
            <div class="timeline-item">
              <div class="timeline-marker"></div>
              <div class="timeline-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.25rem;">
                  <span class="badge badge-status-${item.status}">${displayStatus}</span>
                  <span style="font-size:0.75rem; color:var(--text-dim);">${timeStr}</span>
                </div>
                <p style="margin:0; font-size:0.88rem; color:var(--text-muted);">${item.remarks}</p>
              </div>
            </div>
          `;
        }).join('');
      }
    }
  } catch (err) {
    console.error('History load error:', err);
  }
}
