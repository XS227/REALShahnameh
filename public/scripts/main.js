const navToggle = document.querySelector('.nav-toggle');
const navigation = document.querySelector('.site-nav');
const navLinks = Array.from(document.querySelectorAll('.site-nav .nav-link'));
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if (navToggle && navigation) {
  const toggleMenu = () => {
    const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!isExpanded));
    navigation.classList.toggle('is-open', !isExpanded);
  };

  navToggle.addEventListener('click', toggleMenu);
  navigation.addEventListener('click', (event) => {
    if (event.target.matches('.nav-link')) {
      toggleMenu();
    }
  });
}

if (sections.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const target = entry.target;
        if (entry.isIntersecting) {
          target.classList.add('is-visible');
        }
      });
    },
    { threshold: 0.25 }
  );

  sections.forEach((section) => observer.observe(section));

  const navObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const id = entry.target.getAttribute('id');
        const link = navLinks.find((anchor) => anchor.getAttribute('href') === `#${id}`);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((item) => item.classList.remove('is-active'));
          link.classList.add('is-active');
        }
      });
    },
    { threshold: 0.5 }
  );

  sections.forEach((section) => navObserver.observe(section));
}

const timelineEvents = document.querySelectorAll('.timeline-event');
if (timelineEvents.length) {
  timelineEvents.forEach((event) => {
    event.addEventListener('mouseenter', () => {
      timelineEvents.forEach((item) => item.classList.remove('is-active'));
      event.classList.add('is-active');
    });
  });
}

document.addEventListener('submit', (event) => {
  if (event.target.matches('.cta-form')) {
    event.preventDefault();
    const form = event.target;
    const emailField = form.querySelector('input[type="email"]');
    if (!emailField?.value) return;

    emailField.disabled = true;
    const submitButton = form.querySelector('button');
    if (submitButton) {
      submitButton.disabled = true;
    }
    form.classList.add('is-success');

    const confirmation = document.createElement('p');
    confirmation.className = 'cta-confirmation';
    confirmation.textContent = 'Thank you! We will reach out soon with your invite.';
    form.insertAdjacentElement('afterend', confirmation);
  }
});

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener('click', () => {
    const href = anchor.getAttribute('href');
    const target = href ? document.querySelector(href) : null;
    if (!target) return;
    target.classList.add('is-visible');
  });
});

const yearEl = document.getElementById('copyright-year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}
