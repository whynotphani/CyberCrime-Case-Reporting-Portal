/**
 * Global API Client & Helper Utilities
 */

const API_BASE_URL = ''; // Relative path to current domain/port

// Token Management
const API = {
  getToken: () => localStorage.getItem('cybercrime_token'),
  setToken: (token) => localStorage.setItem('cybercrime_token', token),
  removeToken: () => localStorage.removeItem('cybercrime_token'),
  getUserRole: () => localStorage.getItem('cybercrime_user_role'),
  setUserRole: (role) => localStorage.setItem('cybercrime_user_role', role),

  logout: (redirectUrl = 'citizen-login.html') => {
    API.removeToken();
    localStorage.removeItem('cybercrime_user_role');
    window.location.href = redirectUrl;
  },

  requireRole: (expectedRole) => {
    const token = API.getToken();
    const role = API.getUserRole();
    if (!token || (expectedRole && role !== expectedRole)) {
      showToast('Session expired or unauthorized. Please log in.', 'error');
      const target = expectedRole === 'officer' ? 'officer-login.html' : 'citizen-login.html';
      setTimeout(() => { window.location.href = target; }, 1000);
      return false;
    }
    return true;
  },

  // Generic Request Wrapper
  request: async (endpoint, options = {}) => {
    const token = API.getToken();

    const headers = options.headers || {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      ...options,
      headers
    };

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'An unexpected error occurred.');
      }

      return data;
    } catch (error) {
      console.error('[API Error]', error);
      throw error;
    }
  }
};

// UI Toast Notification Helper
function showToast(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
  toast.innerHTML = `
    <span style="font-weight: bold; font-size: 1.1rem;">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}
