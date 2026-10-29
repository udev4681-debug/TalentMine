/**
 * TalentMine — Authentication Module
 * Handles Registration, Login, Google Auth (Firebase), and Session Persistence
 */

const AuthModule = {
  user: null,

  init() {
    this.bindForms();
    this.bindSocialAuth();
    this.bindForgotPassword();
    this.bindLogout();
    this.restoreSession();
  },

  /**
   * Called on every page load.
   * Checks localStorage first, then Firebase onAuthStateChanged.
   * Whichever fires first with a valid user wins; the other is a no-op.
   */
  restoreSession() {
    // 1. Check localStorage immediately (instant, no async wait)
    const state = StateManager.getState();
    if (state && state.user) {
      this.user = state.user;
      this.updateUserUI();
      NavigationModule.showScreen('screen-dashboard');
    }

    // 2. Also hook Firebase onAuthStateChanged so Google sessions survive refresh
    if (window.firebase && window.firebase.auth) {
      firebase.auth().onAuthStateChanged(firebaseUser => {
        if (firebaseUser) {
          // Firebase has an active session — sync it into our state
          const userData = {
            name:     firebaseUser.displayName || firebaseUser.email.split('@')[0],
            email:    firebaseUser.email,
            avatar:   firebaseUser.photoURL || null,
            provider: 'firebase-google'
          };
          // Only update if not already showing dashboard (avoid redundant re-render)
          if (!this.user || this.user.email !== firebaseUser.email) {
            this.setUserSession(userData);
            NavigationModule.showScreen('screen-dashboard');
          }
        } else {
          // Firebase has no session — if our localStorage user was firebase-google,
          // it means the Firebase token expired; clear it
          const currentState = StateManager.getState();
          if (currentState.user && currentState.user.provider === 'firebase-google') {
            this.clearSession();
          }
        }
      });
    }
  },

  updateUserUI() {
    const el = document.getElementById('workspaceUser');
    if (el) {
      el.textContent = this.user
        ? `${this.user.name} (${this.user.email})`
        : 'Workspace Owner';
    }
  },

  setUserSession(userData) {
    this.user = userData;
    const state = StateManager.getState();
    state.user = userData;
    StateManager.saveState(state);
    this.updateUserUI();
  },

  clearSession() {
    this.user = null;
    const state = StateManager.getState();
    state.user = null;
    StateManager.saveState(state);
    this.updateUserUI();
  },

  bindForms() {
    // ── Register Form ─────────────────────────────────────────────────────────
    const rf = document.getElementById('registerForm');
    if (rf) {
      const first = document.getElementById('regFirstName');
      const last  = document.getElementById('regLastName');
      const email = document.getElementById('regEmail');

      [first, last, email].forEach(input => {
        input?.addEventListener('input', () => this.clearFieldError(input));
      });

      rf.addEventListener('submit', async (e) => {
        e.preventDefault();
        let valid = true;

        if (!first.value.trim() || first.value.trim().length < 2) {
          this.showFieldError(first, 'Enter at least 2 characters.');
          valid = false;
        }
        if (!last.value.trim() || last.value.trim().length < 2) {
          this.showFieldError(last, 'Enter at least 2 characters.');
          valid = false;
        }
        if (!this.isValidEmail(email.value)) {
          this.showFieldError(email, 'Enter a valid work email.');
          valid = false;
        }

        if (!valid) {
          rf.classList.add('shake');
          setTimeout(() => rf.classList.remove('shake'), 300);
          return;
        }

        const fullName = `${first.value.trim()} ${last.value.trim()}`;
        this.setUserSession({ name: fullName, email: email.value.trim(), provider: 'email' });
        Toast.show(`Welcome to TalentMine, ${first.value.trim()}! Workspace initialized.`, 'success');
        NavigationModule.showScreen('screen-dashboard');
      });
    }

    // ── Login Form ────────────────────────────────────────────────────────────
    const lf = document.getElementById('loginForm');
    if (lf) {
      const email    = document.getElementById('loginEmail');
      const password = document.getElementById('loginPassword');

      [email, password].forEach(input => {
        input?.addEventListener('input', () => this.clearFieldError(input));
      });

      lf.addEventListener('submit', async (e) => {
        e.preventDefault();
        let valid = true;

        if (!this.isValidEmail(email.value)) {
          this.showFieldError(email, 'Enter a valid email address.');
          valid = false;
        }
        if (!password.value || password.value.length < 8) {
          this.showFieldError(password, 'Password must be at least 8 characters.');
          valid = false;
        }

        if (!valid) {
          lf.classList.add('shake');
          setTimeout(() => lf.classList.remove('shake'), 300);
          return;
        }

        const username      = email.value.split('@')[0];
        const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
        this.setUserSession({ name: formattedName, email: email.value.trim(), provider: 'email' });
        Toast.show(`Welcome back, ${formattedName}! Mining session active.`, 'success');
        NavigationModule.showScreen('screen-dashboard');
      });
    }
  },

  bindSocialAuth() {
    const googleBtns   = document.querySelectorAll('[data-social="google"]');
    const linkedinBtns = document.querySelectorAll('[data-social="linkedin"]');

    googleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => { e.preventDefault(); this.triggerGoogleAuth(); });
    });
    linkedinBtns.forEach(btn => {
      btn.addEventListener('click', (e) => { e.preventDefault(); this.triggerLinkedInAuth(); });
    });
  },

  triggerGoogleAuth() {
    if (window.firebase && window.firebase.auth) {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider)
        .then(result => {
          const u = result.user;
          this.setUserSession({
            name:     u.displayName || u.email.split('@')[0],
            email:    u.email,
            avatar:   u.photoURL || null,
            provider: 'firebase-google'
          });
          Toast.show(`Authenticated via Google: ${u.email}`, 'success');
          NavigationModule.showScreen('screen-dashboard');
        })
        .catch(error => {
          console.error('Firebase Auth Error', error);
          Toast.show(`Google sign-in failed: ${error.message}`, 'info');
        });
      return;
    }
    // Firebase not loaded — inform user rather than injecting fake data
    Toast.show('Google sign-in is not available in this environment. Please use email login.', 'info');
  },

  triggerLinkedInAuth() {
    // LinkedIn OAuth requires a server-side redirect — not available yet
    Toast.show('LinkedIn sign-in will be available once the OAuth redirect URI is configured.', 'info');
  },

  bindForgotPassword() {
    document.querySelectorAll('.forgot-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const email = prompt('Enter your account email to receive a password reset link:');
        if (email && this.isValidEmail(email)) {
          Toast.show(`Password reset instructions sent to ${email}`, 'success');
        } else if (email !== null) {
          Toast.show('Please enter a valid email address.', 'info');
        }
      });
    });
  },

  bindLogout() {
    // Use delegated click — handles both static and dynamically added logout buttons.
    // Prevent the data-goto handler from also firing by stopping propagation.
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.dash-logout');
      if (!btn) return;
      e.preventDefault();
      e.stopPropagation();   // ← stops [data-goto] handler from double-firing

      // Sign out of Firebase if active
      if (window.firebase && window.firebase.auth) {
        firebase.auth().signOut().catch(() => {});
      }

      this.clearSession();
      Toast.show('Logged out of TalentMine workspace.', 'info');
      NavigationModule.showScreen('screen-home');
    });
  },

  isValidEmail(val) {
    return val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  },

  showFieldError(input, msg) {
    const field = input.closest('.field');
    if (!field) return;
    field.classList.add('field-error');
    let err = field.querySelector('.field-msg');
    if (!err) {
      err = document.createElement('span');
      err.className = 'field-msg mono';
      field.appendChild(err);
    }
    err.textContent = msg;
  },

  clearFieldError(input) {
    const field = input?.closest('.field');
    if (!field) return;
    field.classList.remove('field-error');
    field.querySelector('.field-msg')?.remove();
  }
};
