// ===== Global Page Orchestration Script =====

document.addEventListener('DOMContentLoaded', () => {
  // ===== Live IST clock =====
  function updateClock() {
    const opts = { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false };
    try {
      const t = new Date().toLocaleTimeString('en-GB', opts);
      const el = document.getElementById('navClock');
      if (el) el.textContent = t;
    } catch (e) {
      console.error(e);
    }
  }
  setInterval(updateClock, 30000);
  updateClock();

  // ===== Dynamic Copyright Year =====
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Reveal-on-scroll =====
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // ===== Click-to-copy email =====
  const emailLink = document.getElementById('emailLink');
  if (emailLink) {
    emailLink.addEventListener('click', function(e) {
      if (navigator.clipboard) {
        e.preventDefault();
        navigator.clipboard.writeText('halderanangsha@gmail.com').then(() => {
          const c = document.getElementById('copied');
          if (c) {
            c.classList.add('show');
            setTimeout(() => c.classList.remove('show'), 1800);
          }
        });
        // open email client after a small delay
        setTimeout(() => { window.location.href = 'mailto:halderanangsha@gmail.com'; }, 250);
      }
    });
  }

  // ===== Subtle magnetic hover on buttons =====
  document.querySelectorAll('.btn, .lab-btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      btn.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });

  // ===== Scroll progress bar =====
  const sp = document.getElementById('scrollProgress');
  function updateProgress() {
    if (!sp) return;
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    sp.style.width = pct + '%';
  }
  document.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // ===== Custom cursor (desktop only) =====
  const cursorDot = document.getElementById('cursorDot');
  const cursorRing = document.getElementById('cursorRing');
  let mouseX = -100, mouseY = -100;
  let ringX = mouseX, ringY = mouseY;
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (isFinePointer && cursorDot && cursorRing) {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
    });

    function rafRing() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.transform = `translate(${ringX}px, ${ringY}px)`;
      requestAnimationFrame(rafRing);
    }
    rafRing();

    const hoverSelectors = 'a, button, .project, .btn, .badge, .now-card, .contact-mail, .lab-tab, .toggle-slider, .control-slider';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverSelectors)) {
        cursorRing.classList.add('hover');
      } else {
        cursorRing.classList.remove('hover');
      }
    });

    document.addEventListener('mouseleave', () => {
      cursorDot.classList.add('hidden');
      cursorRing.classList.add('hidden');
    });
    document.addEventListener('mouseenter', () => {
      cursorDot.classList.remove('hidden');
      cursorRing.classList.remove('hidden');
    });
  } else {
    if (cursorDot) cursorDot.style.display = 'none';
    if (cursorRing) cursorRing.style.display = 'none';
  }

  // ===== Hero cursor spotlight =====
  const hero = document.getElementById('hero');
  if (hero && isFinePointer) {
    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      hero.style.setProperty('--mouse-x', x + '%');
      hero.style.setProperty('--mouse-y', y + '%');
    });
  }

  // ===== Animated counters =====
  const easeOutQuart = (t) => 1 - Math.pow(1 - t, 4);
  function animateCounter(el, target, decimals = 0, duration = 1800) {
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = easeOutQuart(t);
      const val = target * eased;
      if (decimals > 0) {
        el.textContent = val.toFixed(decimals);
      } else if (target >= 10000) {
        el.textContent = Math.floor(val).toLocaleString();
      } else {
        el.textContent = Math.floor(val);
      }
      if (t < 1) requestAnimationFrame(tick);
      else {
        if (decimals > 0) el.textContent = target.toFixed(decimals);
        else el.textContent = target.toLocaleString();
      }
    }
    requestAnimationFrame(tick);
  }
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const wrap = e.target;
        const counter = wrap.querySelector('.counter');
        if (counter) {
          const target = parseFloat(wrap.dataset.target || counter.dataset.target);
          const decimals = parseInt(wrap.dataset.decimals || '0', 10);
          animateCounter(counter, target, decimals);
          counterObserver.unobserve(wrap);
        }
      }
    });
  }, { threshold: 0.4 });
  document.querySelectorAll('.stat-num').forEach(el => counterObserver.observe(el));

  // ===== 3D card tilt on projects =====
  document.querySelectorAll('.project').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotX = (0.5 - y) * 6;   // max 6 deg tilt
      const rotY = (x - 0.5) * 6;
      card.style.transform = `perspective(1200px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
      card.style.setProperty('--card-x', (x * 100) + '%');
      card.style.setProperty('--card-y', (y * 100) + '%');
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // ===== Portrait subtle 3D tilt =====
  (() => {
    const p = document.querySelector('.portrait');
    if (!p) return;
    if (!isFinePointer) return;
    p.addEventListener('mousemove', (e) => {
      const rect = p.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotX = (0.5 - y) * 8;
      const rotY = (x - 0.5) * 8;
      p.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });
    p.addEventListener('mouseleave', () => { p.style.transform = ''; });
  })();

  // ==========================================
  // NEW WORK: Recruiter Floating Hub Logic
  // ==========================================
  const hub = document.getElementById('recruiterHub');
  const hubTrigger = document.getElementById('hubTrigger');
  if (hub && hubTrigger) {
    hubTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      hub.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!hub.contains(e.target)) {
        hub.classList.remove('active');
      }
    });

  }

  // ==========================================
  // NEW WORK: 3D Interactive Lab Switcher
  // ==========================================
  const labTabs = document.querySelectorAll('.lab-tab');
  const labPanels = document.querySelectorAll('.lab-panel');
  let activeSimulation = null;

  function switchTab(targetTab) {
    const modelId = targetTab.dataset.model;
    
    // Deactivate previous tabs & panels
    labTabs.forEach(t => t.classList.remove('active'));
    labPanels.forEach(p => p.classList.remove('active'));

    // Activate new ones
    targetTab.classList.add('active');
    const activePanel = document.getElementById(`panel-${modelId}`);
    if (activePanel) activePanel.classList.add('active');

    // Tear down current active simulation
    if (activeSimulation && typeof activeSimulation.destroy === 'function') {
      activeSimulation.destroy();
      activeSimulation = null;
    }

    // Launch new simulation
    const viewport = document.getElementById('labViewport');
    if (!viewport) return;

    // Clear previous canvases if any
    const canvases = viewport.querySelectorAll('canvas');
    canvases.forEach(c => {
      if (!c.classList.contains('preserve')) {
        c.remove();
      }
    });

    // Run specific model script initializer
    if (modelId === 'ai' && window.initNeuralNetSim) {
      activeSimulation = window.initNeuralNetSim(viewport);
    } else if (modelId === 'robotics' && window.initRoboticArmSim) {
      activeSimulation = window.initRoboticArmSim(viewport);
    } else if (modelId === 'cs' && window.initBinaryTreeSim) {
      activeSimulation = window.initBinaryTreeSim(viewport);
    }
  }

  labTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.classList.contains('active')) return;
      switchTab(tab);
    });
  });

  // Lazy initialize first tab when Tech Lab enters viewport
  const techLabSection = document.getElementById('tech-lab');
  if (techLabSection) {
    const labObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const firstTab = document.querySelector('.lab-tab');
          if (firstTab && !activeSimulation) {
            switchTab(firstTab);
          }
          labObserver.unobserve(techLabSection);
        }
      });
    }, { threshold: 0.15 });
    labObserver.observe(techLabSection);
  }
});
