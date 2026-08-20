/**
 * CyberCrime Case Reporting Portal - Mobile Navigation System
 * Automatically attaches toggle handler for responsive mobile drawer menu.
 */
document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;

  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;

  // Create toggle button if not present
  let toggleBtn = document.getElementById('navToggleBtn');
  if (!toggleBtn) {
    toggleBtn = document.createElement('button');
    toggleBtn.id = 'navToggleBtn';
    toggleBtn.className = 'nav-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'Toggle Navigation Menu');
    toggleBtn.innerHTML = '<span class="nav-toggle-icon">☰</span> Menu';

    // Insert before nav-links
    navbar.insertBefore(toggleBtn, navLinks);
  }

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    navLinks.classList.toggle('nav-links-open');
    const isOpen = navLinks.classList.contains('nav-links-open');
    toggleBtn.classList.toggle('active', isOpen);
    toggleBtn.innerHTML = isOpen 
      ? '<span class="nav-toggle-icon">✕</span> Close' 
      : '<span class="nav-toggle-icon">☰</span> Menu';
  });

  // Close mobile menu when clicking outside
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('nav-links-open') && !navbar.contains(e.target)) {
      navLinks.classList.remove('nav-links-open');
      toggleBtn.classList.remove('active');
      toggleBtn.innerHTML = '<span class="nav-toggle-icon">☰</span> Menu';
    }
  });

  // Close mobile menu on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navLinks.classList.contains('nav-links-open')) {
      navLinks.classList.remove('nav-links-open');
      toggleBtn.classList.remove('active');
      toggleBtn.innerHTML = '<span class="nav-toggle-icon">☰</span> Menu';
    }
  });
});
