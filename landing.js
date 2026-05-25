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

  // ── Archives: populate chapter cards ──────────────────────────
  var CHAPTERS = [
    { slug:'keyumars',          title:'Keyumars',              num:1  },
    { slug:'hushang',           title:'Hushang',               num:2,  img:'hushang.png' },
    { slug:'tahmuras',          title:'Tahmuras',              num:3,  img:'tahmuras.png' },
    { slug:'jamshid',           title:'Jamshid',               num:4,  img:'jamshid.png' },
    { slug:'zahhak',            title:'Zahhak',                num:5,  img:'zahhak.png' },
    { slug:'fereydun',          title:'Fereydun',              num:6,  img:'fereydun.png' },
    { slug:'manuchehr',         title:'Manuchehr',             num:7,  img:'manuchehr.png' },
    { slug:'nozar',             title:'Nozar',                 num:8,  img:'nozar.png' },
    { slug:'zal',               title:'Zal',                   num:9,  img:'zal.png' },
    { slug:'rudabeh',           title:'Rudabeh',               num:10, img:'rudabeh.png' },
    { slug:'birth-of-rostam',   title:'Birth of Rostam',       num:11, img:'birth-of-rostam.png' },
    { slug:'simorgh',           title:'The Simorgh',           num:12, img:'simorgh.png' },
    { slug:'sohrab',            title:'Sohrab',                num:13, img:'sohrab.png' },
    { slug:'siavash',           title:'Siavash',               num:14, img:'siavash.png' },
    { slug:'great-war-turan',   title:'Great War of Turan',    num:15, img:'great-war-turan.png' },
    { slug:'akvan',             title:'Akvan the Div',         num:16, img:'akvan.png' },
    { slug:'bijan-manijeh',     title:'Bijan & Manijeh',       num:17, img:'bijan-manijeh.png' },
    { slug:'rostam',            title:'Rostam',                num:18, img:'rostam.png' },
    { slug:'kay-kavus',         title:'Kay Kavus',             num:19, img:'kay-kavus.png' },
    { slug:'kay-khosrow',       title:'Kay Khosrow',           num:20, img:'kay-khosrow.png' },
    { slug:'lohrasp',           title:'Lohrasp',               num:21, img:'lohrasp.png' },
    { slug:'goshtasp',          title:'Goshtasp',              num:22, img:'goshtasp.png' },
    { slug:'esfandiyar',        title:'Esfandiyar',            num:23, img:'esfandiyar.png' },
    { slug:'clash-rostam-esp',  title:'Rostam vs. Esfandiyar', num:24, img:'clash-rostam-esp.png' },
    { slug:'seven-labours-esp', title:'Seven Labours',         num:25, img:'seven-labours-esp.png' },
    { slug:'rostams-end',       title:"Rostam's End",          num:26, img:'rostams-end.png' },
    { slug:'homay',             title:'Homay',                 num:27, img:'homay.png' },
    { slug:'bahman',            title:'Bahman',                num:28, img:'bahman.png' },
    { slug:'darab',             title:'Darab',                 num:29, img:'darab.png' },
    { slug:'dara',              title:'Dara',                  num:30, img:'dara.png' },
    { slug:'alexander',         title:'Alexander',             num:31, img:'alexander.png' },
    { slug:'ashkanian-age',     title:'The Ashkanian Age',     num:32, img:'ashkanian-age.png' },
    { slug:'ardavan',           title:'Ardavan',               num:33, img:'ardavan.png' },
  ];

  var archivesTrack = document.getElementById('archivesTrack');
  if (archivesTrack) {
    CHAPTERS.forEach(function (ch) {
      var imgPath = ch.img
        ? '/season2/uploads/chapters/' + ch.img
        : '/assets/images/chapters/chapter-1-keyumars-cover.png';
      var card = document.createElement('a');
      card.className = 'chapter-card';
      card.href = '/season2/chapter.html?slug=' + ch.slug;
      card.innerHTML =
        '<div class="cc-img" style="background-image:url(\'' + imgPath + '\')"></div>' +
        '<div class="cc-body">' +
          '<span class="cc-num">Chapter ' + ch.num + '</span>' +
          '<h4>' + ch.title + '</h4>' +
        '</div>';
      archivesTrack.appendChild(card);
    });
  }

  // ── Market data: fetch from platform-stats + DexScreener ──────
  (function () {
    var TOKEN = 'EQDhq_DjQUMJqfXLP8K8J6SlOvon08XQQK0T49xon2e0xU8p';

    function setVal(id, v) { var el = document.getElementById(id); if (el) el.textContent = v; }

    /* Load holder count from our own backend */
    fetch('/api/basic/platform-stats')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.tokenHolders) setVal('marketLiquidity', d.tokenHolders.toLocaleString());
        if (d.totalUsers)   setVal('marketStatusText', 'Live · ' + d.totalUsers.toLocaleString() + ' players');
      }).catch(function () {});

    /* Load price from DexScreener (CORS-open API) */
    fetch('https://api.dexscreener.com/latest/dex/tokens/' + TOKEN)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var pairs = d.pairs;
        if (!pairs || !pairs.length) return;
        var p = pairs[0];
        var price = p.priceUsd ? '$' + parseFloat(p.priceUsd).toFixed(6) : '—';
        var change = p.priceChange && p.priceChange.h24 != null
          ? (p.priceChange.h24 >= 0 ? '+' : '') + p.priceChange.h24.toFixed(2) + '%'
          : '—';
        setVal('marketPrice', price);
        var chEl = document.getElementById('marketChange');
        if (chEl) {
          chEl.textContent = change;
          chEl.style.color = (p.priceChange && p.priceChange.h24 >= 0) ? '#4caf7d' : '#f44b4b';
        }
        var dot = document.querySelector('.live-dot');
        if (dot) dot.style.background = '#4caf7d';
      }).catch(function () {});
  })();

})();
