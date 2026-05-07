(() => {
  const orb = document.querySelector('[data-energy-orb]');
  const container = document.querySelector('.orb-wrap');

  const spawnParticles = () => {
    if (!container) return;
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      p.style.width = `${Math.random() * 5 + 2}px`;
      p.style.height = p.style.width;
      p.style.left = `${Math.random() * 100}%`;
      p.style.bottom = `${Math.random() * 80}px`;
      p.style.animationDuration = `${Math.random() * 3 + 2}s`;
      p.style.opacity = `${Math.random() * 0.7 + 0.2}`;
      container.appendChild(p);
      setTimeout(() => p.remove(), 6000);
    }
  };

  if (orb && container) {
    setInterval(spawnParticles, 2100);
    spawnParticles();

    orb.addEventListener('click', (event) => {
      const tag = document.createElement('span');
      tag.className = 'floating';
      tag.textContent = '+12';
      const rect = container.getBoundingClientRect();
      tag.style.left = `${event.clientX - rect.left - 10}px`;
      tag.style.top = `${event.clientY - rect.top - 14}px`;
      container.appendChild(tag);
      setTimeout(() => tag.remove(), 900);
      orb.animate([
        { transform: 'scale(1)' },
        { transform: 'scale(0.97)' },
        { transform: 'scale(1.03)' },
        { transform: 'scale(1)' }
      ], { duration: 250, easing: 'ease-out' });
    });
  }

  document.querySelectorAll('[data-copy-link]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const value = btn.getAttribute('data-copy-link');
      try {
        await navigator.clipboard.writeText(value);
        btn.textContent = 'Copied';
        setTimeout(() => (btn.textContent = 'Copy Link'), 1500);
      } catch {
        btn.textContent = 'Copy manually';
      }
    });
  });
})();
