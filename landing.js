/* Shahnameh — Ultra-Cinematic Landing
 * Particles · Scroll reveal · Nav · Chapter drag · Mobile menu
 */
(function () {
  'use strict';

  // ── Nav: scroll class + mobile toggle ──────────────────────────
  var nav    = document.getElementById('nav');
  var toggle = document.getElementById('navToggle');
  var mobile = document.getElementById('navMobile');

  function onScroll() {
    if (!nav) return;
    if (window.scrollY > 18) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (mobile) mobile.setAttribute('aria-hidden', open ? 'false' : 'true');
    });
    document.addEventListener('click', function (e) {
      if (!nav.contains(e.target) && nav.classList.contains('open')) {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        if (mobile) mobile.setAttribute('aria-hidden', 'true');
      }
    });
    if (mobile) {
      mobile.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', function () {
          nav.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
          mobile.setAttribute('aria-hidden', 'true');
        });
      });
    }
  }

  // ── Hero: parallax on scroll ───────────────────────────────────
  var heroImg = document.querySelector('.hero-img');
  if (heroImg && window.matchMedia('(prefers-reduced-motion: no-preference)').matches) {
    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      heroImg.style.transform = 'scale(1.06) translateY(' + (y * 0.22) + 'px)';
    }, { passive: true });
  }

  // ── Canvas particles ───────────────────────────────────────────
  var canvas = document.getElementById('heroCanvas');
  if (canvas) {
    var ctx   = canvas.getContext('2d');
    var W, H, particles = [];
    var GOLD  = 'rgba(240,192,96,';
    var COUNT = 80;

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }

    function Particle() {
      this.reset(true);
    }
    Particle.prototype.reset = function (init) {
      this.x  = Math.random() * W;
      this.y  = init ? Math.random() * H : H + 10;
      this.r  = 0.5 + Math.random() * 1.8;
      this.vx = (Math.random() - 0.5) * 0.3;
      this.vy = -(0.3 + Math.random() * 0.7);
      this.a  = 0.2 + Math.random() * 0.5;
      this.da = 0.001 + Math.random() * 0.003;
    };
    Particle.prototype.step = function () {
      this.x += this.vx;
      this.y += this.vy;
      this.a -= this.da;
      if (this.y < -10 || this.a <= 0) this.reset(false);
    };

    function init() {
      particles = [];
      for (var i = 0; i < COUNT; i++) particles.push(new Particle());
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.step();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = GOLD + p.a + ')';
        ctx.fill();
      }
      requestAnimationFrame(draw);
    }

    resize();
    init();
    draw();
    var ro = new ResizeObserver(function () { resize(); init(); });
    ro.observe(canvas.parentElement);
  }

  // ── IntersectionObserver reveal ────────────────────────────────
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el    = entry.target;
        var delay = parseInt(el.dataset.delay || '0', 10);
        if (delay) {
          setTimeout(function () { el.classList.add('in'); }, delay);
        } else {
          el.classList.add('in');
        }
        io.unobserve(el);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -36px 0px' });

    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  // ── Chapter track: drag scroll ─────────────────────────────────
  var scroll = document.querySelector('.chapters-scroll');
  var track  = document.querySelector('.chapters-track');
  if (scroll && track) {
    var down = false, startX, scrollLeft;
    scroll.addEventListener('mousedown', function (e) {
      down = true;
      startX = e.pageX - scroll.offsetLeft;
      scrollLeft = scroll.scrollLeft;
      scroll.style.cursor = 'grabbing';
    });
    window.addEventListener('mouseup', function () {
      down = false;
      if (scroll) scroll.style.cursor = 'grab';
    });
    scroll.addEventListener('mousemove', function (e) {
      if (!down) return;
      e.preventDefault();
      var x    = e.pageX - scroll.offsetLeft;
      var walk = (x - startX) * 1.2;
      scroll.scrollLeft = scrollLeft - walk;
    });
    // Touch
    var touchStart;
    scroll.addEventListener('touchstart', function (e) {
      touchStart = e.touches[0].clientX;
      scrollLeft = scroll.scrollLeft;
    }, { passive: true });
    scroll.addEventListener('touchmove', function (e) {
      if (touchStart == null) return;
      var dx = touchStart - e.touches[0].clientX;
      scroll.scrollLeft = scrollLeft + dx;
    }, { passive: true });
  }

  // ── Footer year ────────────────────────────────────────────────
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  // ── Telegram WebApp expand ─────────────────────────────────────
  try {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  } catch (_) {}

})();
