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
        shortlist:  Array.isArray(parsed.shortlist)  ? parsed.shortlist  : [],
        sessions:   Array.isArray(parsed.sessions)   ? parsed.sessions   : [],
        user:       parsed.user || null
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
    this.bindExportButtons();
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
        if (!target) return;

        // Guard: dashboard and mining require an active user session
        if ((target === 'screen-dashboard' || target === 'screen-mining')) {
          const state = StateManager.getState();
          if (!state.user) {
            NavigationModule.showScreen('screen-login');
            return;
          }
        }

        this.showScreen(target);
      });
    });
  },

  bindMobileMenu() {
    const toggle = document.getElementById('menuToggle');
    const menu   = document.getElementById('mobileMenu');
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

  bindExportButtons() {
    // Hero showcase export buttons — operate on real session data only
    const excelDemoBtn  = document.getElementById('demoExportExcel');
    const sheetsDemoBtn = document.getElementById('demoSyncSheets');

    excelDemoBtn?.addEventListener('click', () => {
      const state = StateManager.getState();
      const pool  = state.candidates || [];
      if (pool.length === 0) {
        Toast.show('No candidates in workspace yet. Run a mining session first.', 'info');
        return;
      }
      DashboardModule.downloadCSV(pool.slice(0, 20), 'talentmine_export.csv');
      Toast.show(`Exported ${Math.min(pool.length, 20)} candidates to CSV.`, 'success');
    });

    sheetsDemoBtn?.addEventListener('click', () => {
      Toast.show('Google Sheets sync will be available once the live API is connected.', 'info');
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
  Toast.init();
  NavigationModule.init();
  CanvasModule.initHeroNetwork();
  CanvasModule.initPipelineCanvas();

  // Auth must init before anything else so it can restore the session and
  // route straight to dashboard if the user is already logged in.
  // restoreSession() calls showScreen() internally when a session exists.
  AuthModule.init();

  // If no session was restored, show the home screen as the default
  const state = StateManager.getState();
  if (!state.user) {
    NavigationModule.showScreen('screen-home');
  }

  DashboardModule.init();
  MiningModule.init();
  initScrollReveal();

  // Show backend connection status badge
  DataAdapter.probeBackend().then(hasBackend => {
    const badge = document.getElementById('dataModeBadge');
    if (badge) {
      if (hasBackend) {
        badge.textContent = 'API CONNECTED';
        badge.classList.add('is-live');
      } else {
        badge.textContent = 'API OFFLINE';
        badge.classList.remove('is-live');
      }
    }
  });
});
