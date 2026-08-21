let selectedCategory = '';
let selectedFiles = [];
let savedFormData = {};

// Full Category Schema Configurations
const CATEGORY_CONFIG = {
  'Financial Fraud': {
    title: 'Financial Fraud',
    evidenceHelper: 'Upload bank statements (PDF), transaction screenshot / UPI slips, SMS / chat transcript proof, or phishing email link screenshots. Max 10MB per file.',
    evidenceOptions: [
      { label: 'Bank Statement (PDF)', value: 'BANK_STATEMENT' },
      { label: 'Transaction Screenshot / UPI Slip', value: 'SCREENSHOT' },
      { label: 'SMS / Chat Transcript Proof', value: 'CHAT_LOG' },
      { label: 'Phishing Email Headers / Link Screenshot', value: 'PHISHING_PROOF' },
      { label: 'Other Proof', value: 'OTHER' }
    ],
    fields: [
      { id: 'lossAmount', label: 'Financial Loss Amount (₹ INR) *', type: 'number', required: true, min: 0, placeholder: 'e.g., 50000' },
      { id: 'transactionRef', label: 'Transaction Ref / UPI UTR Number *', type: 'text', required: true, placeholder: 'e.g., 12-digit UPI Ref / IMPS UTR' },
      { id: 'suspectName', label: 'Suspect Name / Fake Identity', type: 'text', required: false, placeholder: 'e.g., Rakesh Kumar (Fake Bank Executive)' },
      { id: 'suspectPhone', label: 'Suspect Phone / WhatsApp Number', type: 'tel', required: false, placeholder: '+91 91234 56789' },
      { id: 'bankDetails', label: 'Suspect Bank Account / UPI ID', type: 'text', required: false, placeholder: 'e.g., payee@upi or 16-digit A/C + IFSC' },
      { id: 'urlOrHandle', label: 'Fraudulent URL / Phishing Link', type: 'url', required: false, placeholder: 'https://fake-bank-kyc.site' }
    ]
  },

  'Non-Financial Cybercrime': {
    title: 'Non-Financial Cybercrime (Hacking, Malware, Ransomware, Unauthorized Access)',
    evidenceHelper: 'Upload system / server audit log files (TXT/LOG), ransomware README files, malware payload samples, or PCAP network captures.',
    evidenceOptions: [
      { label: 'System / Server Audit Log File', value: 'AUDIT_LOG' },
      { label: 'Ransom Note Screenshot / File', value: 'RANSOM_NOTE' },
      { label: 'Malware Payload Sample / File Hash', value: 'MALWARE_SAMPLE' },
      { label: 'Network Packet Capture (PCAP)', value: 'NETWORK_PCAP' },
      { label: 'Other Proof', value: 'OTHER' }
    ],
    fields: [
      { id: 'affectedSystem', label: 'Affected System / Device / Infrastructure *', type: 'text', required: true, placeholder: 'e.g., Windows Laptop, Office Server, Web CMS' },
      { id: 'ransomDemand', label: 'Ransomware / Extortion Demand (If any)', type: 'text', required: false, placeholder: 'e.g., 0.5 BTC demanded in README.txt' },
      { id: 'attackerAlias', label: 'Attacker Alias / Hacker Email', type: 'text', required: false, placeholder: 'e.g., attacker_shadow@proton.me' },
      { id: 'maliciousIp', label: 'Malicious IP Address / Domain / Payload URL', type: 'text', required: false, placeholder: 'e.g., 185.220.101.5 or malicious-site.cc' }
    ]
  },

  'Mobile Theft/Loss': {
    title: 'Mobile Theft/Loss',
    evidenceHelper: 'Upload original mobile purchase bill invoice, box IMEI barcode photo, police lost article report copy, or telecom SIM block request slip.',
    evidenceOptions: [
      { label: 'Original Mobile Purchase Invoice (PDF/Image)', value: 'PURCHASE_INVOICE' },
      { label: 'Box / IMEI Barcode Photo', value: 'IMEI_BARCODE' },
      { label: 'Police Lost Article Report Copy', value: 'POLICE_REPORT' },
      { label: 'Telecom SIM Block Request Slip', value: 'SIM_BLOCK_SLIP' },
      { label: 'Other Proof', value: 'OTHER' }
    ],
    fields: [
      { id: 'deviceModel', label: 'Device Brand & Model Name *', type: 'text', required: true, placeholder: 'e.g., Apple iPhone 15 / Samsung Galaxy S24' },
      { id: 'imei1', label: 'IMEI Number 1 (15 digits) *', type: 'text', required: true, maxlength: 15, placeholder: 'e.g., 864291048573920' },
      { id: 'imei2', label: 'IMEI Number 2 (Optional)', type: 'text', required: false, maxlength: 15, placeholder: 'e.g., 864291048573921' },
      { id: 'lostMobile', label: 'Lost Mobile Number & Telecom Operator *', type: 'text', required: true, placeholder: '+91 98765 43210 (Jio/Airtel/Vi)' },
      { id: 'lastLocation', label: 'Last Known Location / Loss Area *', type: 'text', required: true, placeholder: 'e.g., Visakhapatnam Railway Station Platform 2' }
    ]
  },

  'Online Harassment': {
    title: 'Online Harassment (Cyberbullying, Stalking, Defamation, Deepfakes)',
    evidenceHelper: 'Upload chat screenshots, screen recordings (MP4), offensive image/video samples, or threatening voice notes/audio call logs.',
    evidenceOptions: [
      { label: 'Chat Screenshot / Screen Recording', value: 'CHAT_SCREENSHOT' },
      { label: 'Offensive Image / Video Sample', value: 'OFFENSIVE_MEDIA' },
      { label: 'Threatening Audio Note / Call Log', value: 'THREAT_AUDIO' },
      { label: 'Profile Screenshot with Timestamps', value: 'PROFILE_PROOF' },
      { label: 'Other Proof', value: 'OTHER' }
    ],
    fields: [
      { 
        id: 'harassmentPlatform', 
        label: 'Harassment Platform / Application *', 
        type: 'select', 
        required: true, 
        options: ['WhatsApp', 'Instagram', 'Telegram', 'Facebook', 'X (Twitter)', 'Email', 'Other'] 
      },
      { 
        id: 'harassmentSubType', 
        label: 'Harassment Sub-Type *', 
        type: 'select', 
        required: true, 
        options: ['Cyberstalking', 'Morphing / Deepfake Content', 'Lewd / Threatening Messages', 'Defamation / Blackmail'] 
      },
      { id: 'suspectHandle', label: 'Suspect Social Username / Profile Handle', type: 'text', required: false, placeholder: 'e.g., @insta_stalker_99' },
      { id: 'suspectContact', label: 'Suspect Contact / Origin Number', type: 'text', required: false, placeholder: '+91 98765 00000 or suspect email' },
      { id: 'profileUrl', label: 'Profile Link / Post URL', type: 'url', required: false, placeholder: 'https://instagram.com/stalker_profile' }
    ]
  },

  'Social Media Crime': {
    title: 'Social Media Crime (Account Hacked, Impersonation Profile)',
    evidenceHelper: 'Upload fake profile screenshots, impersonation chat interaction logs, or platform account recovery denial emails.',
    evidenceOptions: [
      { label: 'Fake Profile Screenshot', value: 'FAKE_PROFILE_SHOT' },
      { label: 'Account Recovery Denial Email', value: 'RECOVERY_DENIAL' },
      { label: 'Chat / Impersonation Interaction Screenshot', value: 'IMPERSONATION_CHAT' },
      { label: 'Other Proof', value: 'OTHER' }
    ],
    fields: [
      { 
        id: 'targetPlatform', 
        label: 'Target Social Platform *', 
        type: 'select', 
        required: true, 
        options: ['Instagram', 'Facebook', 'Twitter/X', 'LinkedIn', 'Snapchat', 'Telegram'] 
      },
      { id: 'victimAccount', label: "Victim's Original Account Handle/Link *", type: 'text', required: true, placeholder: 'e.g., @my_real_account' },
      { 
        id: 'socialIncidentType', 
        label: 'Incident Type *', 
        type: 'select', 
        required: true, 
        options: ['Account Hacked / Access Lost', 'Impersonation / Fake Profile Created', 'Fake Page Scam'] 
      },
      { id: 'fakeProfileUrl', label: 'Fraudulent / Impersonating Profile URL *', type: 'url', required: true, placeholder: 'https://facebook.com/fake.profile.123' }
    ]
  },

  'Other Cybercrime': {
    title: 'Other Cybercrime',
    evidenceHelper: 'Upload relevant screenshots, PDFs, documents, chat exports, or video evidence supporting your complaint.',
    evidenceOptions: [
      { label: 'Screenshot / Image Proof', value: 'SCREENSHOT' },
      { label: 'Document / PDF Proof', value: 'DOCUMENT' },
      { label: 'Chat Log / Email Export', value: 'CHAT_LOG' },
      { label: 'Other Proof', value: 'OTHER' }
    ],
    fields: [
      { id: 'specificCategory', label: 'Specific Cybercrime Category *', type: 'text', required: true, placeholder: 'e.g., Identity Theft, Fake Job Offer, SIM Swap' },
      { id: 'suspectFingerprint', label: 'Suspect Identifier / Digital Fingerprint', type: 'text', required: false, placeholder: 'e.g., Telegram handle, URL, or Phone number' }
    ]
  }
};

document.addEventListener('DOMContentLoaded', async () => {
  const token = API.getToken();
  const role = API.getUserRole();

  if (!token || role !== 'citizen') {
    showToast('Session expired or unauthorized. Please log in.', 'error');
    setTimeout(() => { window.location.href = 'citizen-login.html'; }, 1000);
    return;
  }

  setupCategorySelector();
  setupDropzone();
  await loadCitizenCaseData();

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
      const citizenData = caseData.citizen || {};
      const evidenceList = res.data.evidence;

      document.getElementById('headerCaseNumber').innerText = caseData.caseNumber;
      document.getElementById('victimName').innerText = citizenData.fullName || 'Citizen';
      document.getElementById('victimPhone').innerText = citizenData.phone || 'N/A';

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

      // Populate Common Fields
      if (caseData.title) {
        document.getElementById('complaintTitle').value = caseData.title;
      }
      if (caseData.incidentDate && !isNaN(new Date(caseData.incidentDate).getTime())) {
        document.getElementById('incidentDate').value = new Date(caseData.incidentDate).toISOString().slice(0, 16);
      }
      if (caseData.description) {
        document.getElementById('description').value = caseData.description;
      }
      if (caseData.suspectDetails && caseData.suspectDetails.otherInfo) {
        document.getElementById('otherInfo').value = caseData.suspectDetails.otherInfo;
      }

      // Select Category & Render Dynamic Fields
      const initialCat = caseData.category || 'Financial Fraud';
      selectCategoryByName(initialCat);

      // Populate pre-existing suspect details if Financial Fraud
      if (caseData.category === 'Financial Fraud') {
        if (caseData.lossAmount && document.getElementById('lossAmount')) {
          document.getElementById('lossAmount').value = caseData.lossAmount;
        }
        if (caseData.suspectDetails) {
          if (document.getElementById('suspectName')) document.getElementById('suspectName').value = caseData.suspectDetails.name || '';
          if (document.getElementById('suspectPhone')) document.getElementById('suspectPhone').value = caseData.suspectDetails.phone || '';
          if (document.getElementById('bankDetails')) document.getElementById('bankDetails').value = caseData.suspectDetails.bankDetails || '';
          if (document.getElementById('urlOrHandle')) document.getElementById('urlOrHandle').value = caseData.suspectDetails.urlOrHandle || '';
        }
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
      const category = card.dataset.category;
      if (category) {
        selectCategoryByName(category);
      }
    });
  });
}

function selectCategoryByName(name) {
  saveCommonFormData();
  selectedCategory = name;

  const cards = document.querySelectorAll('.category-card');
  cards.forEach(card => {
    if (card.dataset.category === name) {
      card.classList.add('selected');
    } else {
      card.classList.remove('selected');
    }
  });

  renderDynamicCategoryFields(name);
  updateEvidenceSectionForCategory(name);
  restoreCommonFormData();
}

function saveCommonFormData() {
  savedFormData = {
    complaintTitle: document.getElementById('complaintTitle') ? document.getElementById('complaintTitle').value : '',
    incidentDate: document.getElementById('incidentDate') ? document.getElementById('incidentDate').value : '',
    description: document.getElementById('description') ? document.getElementById('description').value : '',
    otherInfo: document.getElementById('otherInfo') ? document.getElementById('otherInfo').value : ''
  };
}

function restoreCommonFormData() {
  if (savedFormData.complaintTitle && document.getElementById('complaintTitle')) {
    document.getElementById('complaintTitle').value = savedFormData.complaintTitle;
  }
  if (savedFormData.incidentDate && document.getElementById('incidentDate')) {
    document.getElementById('incidentDate').value = savedFormData.incidentDate;
  }
  if (savedFormData.description && document.getElementById('description')) {
    document.getElementById('description').value = savedFormData.description;
  }
  if (savedFormData.otherInfo && document.getElementById('otherInfo')) {
    document.getElementById('otherInfo').value = savedFormData.otherInfo;
  }
}

function renderDynamicCategoryFields(categoryName) {
  const container = document.getElementById('dynamicCategoryFields');
  if (!container) return;

  const config = CATEGORY_CONFIG[categoryName];
  if (!config) {
    container.innerHTML = '';
    return;
  }

  let html = `<h4 style="font-size: 1rem; color: var(--accent-cyan); margin: 1.25rem 0 0.85rem; padding-bottom: 0.35rem; border-bottom: 1px solid rgba(6, 182, 212, 0.2);">
    📌 Category-Specific Incident & Suspect Fields (${categoryName})
  </h4>`;

  html += `<div class="form-row-grid">`;

  config.fields.forEach(field => {
    const requiredAttr = field.required ? 'required' : '';
    const minAttr = field.min !== undefined ? `min="${field.min}"` : '';
    const maxLenAttr = field.maxlength ? `maxlength="${field.maxlength}"` : '';

    html += `<div class="form-group">`;
    html += `<label for="${field.id}">${field.label}</label>`;

    if (field.type === 'select') {
      html += `<select id="${field.id}" class="form-control" ${requiredAttr}>`;
      html += `<option value="" disabled selected>-- Select ${field.label.replace(' *', '')} --</option>`;
      field.options.forEach(opt => {
        html += `<option value="${opt}">${opt}</option>`;
      });
      html += `</select>`;
    } else {
      html += `<input type="${field.type}" id="${field.id}" class="form-control" placeholder="${field.placeholder || ''}" ${minAttr} ${maxLenAttr} ${requiredAttr}>`;
    }

    html += `</div>`;
  });

  html += `</div>`;
  container.innerHTML = html;
}

function updateEvidenceSectionForCategory(categoryName) {
  const helperEl = document.getElementById('evidenceHelperText');
  const categorySelect = document.getElementById('evidenceCategory');
  const config = CATEGORY_CONFIG[categoryName];

  if (!config) return;

  if (helperEl) {
    helperEl.innerText = config.evidenceHelper;
  }

  if (categorySelect && config.evidenceOptions) {
    categorySelect.innerHTML = config.evidenceOptions.map(opt => 
      `<option value="${opt.value}">${opt.label}</option>`
    ).join('');
  }
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
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
  }
}

async function handleComplaintSubmit(e) {
  e.preventDefault();

  if (!selectedCategory) {
    showToast('Please select a Cybercrime Category in Step 1.', 'error');
    return;
  }

  const title = document.getElementById('complaintTitle') ? document.getElementById('complaintTitle').value.trim() : '';
  const incidentDate = document.getElementById('incidentDate') ? document.getElementById('incidentDate').value : '';
  const description = document.getElementById('description') ? document.getElementById('description').value.trim() : '';
  const otherInfoInput = document.getElementById('otherInfo') ? document.getElementById('otherInfo').value.trim() : '';

  // Common Validations
  if (!title || title.length < 3) {
    showToast('Please enter a valid Complaint Title / Headline (min 3 characters).', 'error');
    if (document.getElementById('complaintTitle')) document.getElementById('complaintTitle').focus();
    return;
  }

  if (!incidentDate) {
    showToast('Please select the Date & Time of Incident.', 'error');
    if (document.getElementById('incidentDate')) document.getElementById('incidentDate').focus();
    return;
  }

  if (!description || description.length < 30) {
    showToast(`Detailed Description must be at least 30 characters long (currently ${description.length} characters).`, 'error');
    if (document.getElementById('description')) document.getElementById('description').focus();
    return;
  }

  // Validate Category-Specific Fields
  const config = CATEGORY_CONFIG[selectedCategory];
  if (config && config.fields) {
    for (const field of config.fields) {
      if (field.required) {
        const el = document.getElementById(field.id);
        const val = el ? el.value.trim() : '';
        if (!val) {
          showToast(`Please fill in required field: ${field.label.replace(' *', '')}`, 'error');
          if (el) el.focus();
          return;
        }
      }
    }
  }

  // Map category fields to payload
  let lossAmount = 0;
  let suspectName = '';
  let suspectPhone = '';
  let bankDetails = '';
  let urlOrHandle = '';
  let otherInfo = otherInfoInput;

  if (selectedCategory === 'Financial Fraud') {
    lossAmount = document.getElementById('lossAmount') ? document.getElementById('lossAmount').value : 0;
    suspectName = document.getElementById('suspectName') ? document.getElementById('suspectName').value.trim() : '';
    suspectPhone = document.getElementById('suspectPhone') ? document.getElementById('suspectPhone').value.trim() : '';
    bankDetails = document.getElementById('bankDetails') ? document.getElementById('bankDetails').value.trim() : '';
    urlOrHandle = document.getElementById('urlOrHandle') ? document.getElementById('urlOrHandle').value.trim() : '';
    const txnRef = document.getElementById('transactionRef') ? document.getElementById('transactionRef').value.trim() : '';
    if (txnRef) {
      otherInfo = `Txn Ref/UTR: ${txnRef}` + (otherInfo ? ` | ${otherInfo}` : '');
    }
  } else if (selectedCategory === 'Non-Financial Cybercrime') {
    const sys = document.getElementById('affectedSystem') ? document.getElementById('affectedSystem').value.trim() : '';
    const ransom = document.getElementById('ransomDemand') ? document.getElementById('ransomDemand').value.trim() : '';
    suspectName = document.getElementById('attackerAlias') ? document.getElementById('attackerAlias').value.trim() : '';
    urlOrHandle = document.getElementById('maliciousIp') ? document.getElementById('maliciousIp').value.trim() : '';
    if (ransom) bankDetails = `Ransom Demand: ${ransom}`;
    if (sys) otherInfo = `Affected System: ${sys}` + (otherInfo ? ` | ${otherInfo}` : '');
  } else if (selectedCategory === 'Mobile Theft/Loss') {
    suspectName = document.getElementById('deviceModel') ? document.getElementById('deviceModel').value.trim() : '';
    suspectPhone = document.getElementById('lostMobile') ? document.getElementById('lostMobile').value.trim() : '';
    const imei1 = document.getElementById('imei1') ? document.getElementById('imei1').value.trim() : '';
    const imei2 = document.getElementById('imei2') ? document.getElementById('imei2').value.trim() : '';
    const loc = document.getElementById('lastLocation') ? document.getElementById('lastLocation').value.trim() : '';
    bankDetails = `IMEI 1: ${imei1}` + (imei2 ? `, IMEI 2: ${imei2}` : '');
    urlOrHandle = loc ? `Last Location: ${loc}` : '';
  } else if (selectedCategory === 'Online Harassment') {
    const platform = document.getElementById('harassmentPlatform') ? document.getElementById('harassmentPlatform').value : '';
    const subType = document.getElementById('harassmentSubType') ? document.getElementById('harassmentSubType').value : '';
    suspectName = document.getElementById('suspectHandle') ? document.getElementById('suspectHandle').value.trim() : '';
    suspectPhone = document.getElementById('suspectContact') ? document.getElementById('suspectContact').value.trim() : '';
    const profUrl = document.getElementById('profileUrl') ? document.getElementById('profileUrl').value.trim() : '';
    bankDetails = `Platform: ${platform} | Sub-Type: ${subType}`;
    urlOrHandle = profUrl;
  } else if (selectedCategory === 'Social Media Crime') {
    const platform = document.getElementById('targetPlatform') ? document.getElementById('targetPlatform').value : '';
    const victimAcc = document.getElementById('victimAccount') ? document.getElementById('victimAccount').value.trim() : '';
    const type = document.getElementById('socialIncidentType') ? document.getElementById('socialIncidentType').value : '';
    const fakeUrl = document.getElementById('fakeProfileUrl') ? document.getElementById('fakeProfileUrl').value.trim() : '';
    suspectName = `Victim Account: ${victimAcc}`;
    bankDetails = `Target Platform: ${platform} | Incident Type: ${type}`;
    urlOrHandle = fakeUrl;
  } else if (selectedCategory === 'Other Cybercrime') {
    const specCat = document.getElementById('specificCategory') ? document.getElementById('specificCategory').value.trim() : '';
    const fingerprint = document.getElementById('suspectFingerprint') ? document.getElementById('suspectFingerprint').value.trim() : '';
    suspectName = `Category: ${specCat}`;
    urlOrHandle = fingerprint;
  }

  const payload = {
    title,
    category: selectedCategory,
    incidentDate,
    description,
    lossAmount,
    suspectName,
    suspectPhone,
    bankDetails,
    urlOrHandle,
    otherInfo
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
      const fileInput = document.getElementById('fileInput');
      if (fileInput) fileInput.value = '';
      uploadBtn.innerText = 'Upload Selected Evidence Files';
      await loadCitizenCaseData();
    }
  } catch (err) {
    showToast(err.message, 'error');
    uploadBtn.disabled = false;
    uploadBtn.innerText = 'Upload Selected Evidence Files';
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
        <a href="/api/citizen/case/evidence/${f._id}/download?token=${encodeURIComponent(API.getToken() || '')}" target="_blank" class="btn btn-sm btn-secondary">
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
    console.error('Failed to load case history:', err);
  }
}
