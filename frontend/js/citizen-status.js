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
      const assignedOfficer = response.assignedOfficer;

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

          const off = item.updatedByOfficer || assignedOfficer || {};
          const officerName = off.name || 'Inspector Rajesh Kumar';
          const badgeNumber = off.badgeNumber || 'CYBER-8841';
          const department = off.department || 'Financial Fraud Cell';

          return `
            <div class="timeline-item" style="margin-bottom: 1rem;">
              <div class="timeline-marker"></div>
              <div class="timeline-content" style="background: rgba(15, 23, 42, 0.7); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: var(--radius-md); padding: 1.1rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.6rem; border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 0.45rem;">
                  <span class="badge badge-status-${item.status}" style="font-weight: 700;">Status: ${displayStatus}</span>
                  <span style="font-size: 0.78rem; color: var(--text-dim); font-family: monospace;">${timeStr}</span>
                </div>
                
                <div style="display:flex; align-items:center; gap: 0.55rem; margin-bottom: 0.6rem; background: rgba(6,182,212,0.08); border-left: 3px solid var(--accent-cyan); padding: 0.4rem 0.75rem; border-radius: 4px;">
                  <span style="font-size: 1.05rem;">🕵️‍♂️</span>
                  <div style="font-size: 0.88rem; font-weight: 700; color: #fff;">
                    Officer: ${officerName} <span style="font-size: 0.78rem; color: var(--accent-cyan); font-weight: 500;">(${badgeNumber} • ${department})</span>
                  </div>
                </div>

                <div style="font-size: 0.88rem; color: #e2e8f0; line-height: 1.5; background: rgba(0,0,0,0.2); padding: 0.65rem 0.85rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.04);">
                  <strong style="color: var(--text-muted); font-size: 0.76rem; display: block; margin-bottom: 0.2rem; text-transform: uppercase; letter-spacing: 0.04em;">Detailed Investigation Update:</strong>
                  ${item.remarks || 'Case under active investigation by assigned cybercrime cell.'}
                </div>
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
