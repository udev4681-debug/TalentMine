/**
 * TalentMine — Main Orchestrator & State Manager
 */

const StateManager = {
  getState() {
    try {
      const raw = localStorage.getItem(CONFIG.STORE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return {
        candidates: Array.isArray(parsed.candidates) ? parsed.candidates : [],
        shortlist: Array.isArray(parsed.shortlist) ? parsed.shortlist : [],
        sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
        user: parsed.user || null
      };
    } catch (e) {
      return { candidates: [], shortlist: [], sessions: [], user: null };
    }
  },

  saveState(state) {
    try {
      localStorage.setItem(CONFIG.STORE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('LocalStorage unavailable', e);
    }
  }
};

const Toast = {
  container: null,

  init() {
    if (!this.container) {
      let el = document.getElementById('toastContainer');
      if (!el) {
        el = document.createElement('div');
        el.id = 'toastContainer';
        document.body.appendChild(el);
      }
      this.container = el;
    }
  },

  show(message, type = 'info') {
    this.init();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type} mono`;
    toast.innerHTML = `<span>◈</span> <span>${message}</span>`;
    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 320);
    }, 3500);
  }
};

const NavigationModule = {
  init() {
    this.bindScreenTransitions();
    this.bindMobileMenu();
    this.bindShowcaseDemo();
  },

  showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.classList.remove('active'));

    const target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      window.scrollTo(0, 0);

      if (screenId === 'screen-dashboard') {
        DashboardModule.renderAll();
      }
      if (screenId === 'screen-mining') {
        MiningModule.renderResults();
      }
    }
  },

  bindScreenTransitions() {
    document.querySelectorAll('[data-goto]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = btn.getAttribute('data-goto');
        if (target) {
          this.showScreen(target);
        }
      });
    });
  },

  bindMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const menu = document.getElementById('mobileMenu');
    if (!toggle || !menu) return;

    toggle.addEventListener('click', () => {
      const isOpen = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    menu.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('click', () => {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  },

  bindShowcaseDemo() {
    // Interactive buttons inside the hero showcase console
    const excelDemoBtn = document.getElementById('demoExportExcel');
    const sheetsDemoBtn = document.getElementById('demoSyncSheets');

    excelDemoBtn?.addEventListener('click', () => {
      DashboardModule.downloadCSV(FALLBACK_CANDIDATES.slice(0, 5), 'talentmine_demo_sample.csv');
      Toast.show('Downloaded TalentMine sample dataset (Excel/CSV)', 'success');
    });

    sheetsDemoBtn?.addEventListener('click', () => {
      Toast.show('Initiating Google Sheets API handshake...', 'info');
      setTimeout(() => {
        Toast.show('Sample talent intelligence synced with Google Cloud Sheets demo!', 'success');
      }, 1000);
    });
  }
};

function initScrollReveal() {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const elements = document.querySelectorAll('.reveal');

  if (prefersReduced || !('IntersectionObserver' in window)) {
    elements.forEach(e => e.classList.add('in'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  elements.forEach(el => observer.observe(el));
}

// Global App Initialization
document.addEventListener('DOMContentLoaded', () => {
  // Proactively initialize state with fallback candidates if empty for high-fidelity experience
  const state = StateManager.getState();
  if (!state.candidates || state.candidates.length === 0) {
    state.candidates = [...FALLBACK_CANDIDATES];
    state.sessions = [
      {
        id: 'S-INIT',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        country: 'India',
        city: 'Bengaluru',
        type: 'professional',
        count: 8
      },
      {
        id: 'S-INIT2',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        country: 'United States',
        city: 'San Francisco',
        type: 'student',
        count: 7
      }
    ];
    state.shortlist = ['TM-101', 'TM-104'];
    StateManager.saveState(state);
  }

  Toast.init();
  NavigationModule.init();
  CanvasModule.initHeroNetwork();
  CanvasModule.initPipelineCanvas();
  AuthModule.init();
  DashboardModule.init();
  MiningModule.init();
  initScrollReveal();

  // Test backend connection and notify user non-intrusively
  DataAdapter.probeBackend().then(hasBackend => {
    const badge = document.getElementById('dataModeBadge');
    if (badge) {
      if (hasBackend) {
        badge.textContent = 'PHP BACKEND CONNECTED';
        badge.classList.add('is-live');
      } else {
        badge.textContent = 'LOCAL DEMO ADAPTER';
        badge.classList.remove('is-live');
      }
    }
  });
});
