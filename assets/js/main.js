const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('[data-nav]');
const navLinks = document.querySelectorAll('.main-nav a');
const yearEl = document.getElementById('year');

if (yearEl) yearEl.textContent = new Date().getFullYear();

if (menuToggle && nav) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    menuToggle.classList.toggle('is-open');
    nav.classList.toggle('is-open');
  });

  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.classList.remove('is-open');
      nav.classList.remove('is-open');
    });
  });
}

const sections = [...document.querySelectorAll('section[id]')];
const setActiveLink = () => {
  const scrollPosition = window.scrollY + 120;
  sections.forEach((section) => {
    const id = section.getAttribute('id');
    const link = document.querySelector(`.main-nav a[href="#${id}"]`);
    if (!link) return;
    const start = section.offsetTop;
    const end = start + section.offsetHeight;
    if (scrollPosition >= start && scrollPosition < end) {
      navLinks.forEach((item) => item.classList.remove('active'));
      link.classList.add('active');
    }
  });
};
window.addEventListener('scroll', setActiveLink, { passive: true });
setActiveLink();

const revealItems = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window && revealItems.length) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}
