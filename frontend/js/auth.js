/**
 * TalentMine — Authentication Module
 * Handles Registration, Login, Google Auth (Firebase Ready), and Session State
 */

const AuthModule = {
  user: null,

  init() {
    this.bindForms();
    this.bindSocialAuth();
    this.bindForgotPassword();
    this.bindLogout();
    this.loadUserSession();
  },

  loadUserSession() {
    const state = StateManager.getState();
    if (state && state.user) {
      this.user = state.user;
      this.updateUserUI();
    }
  },

  updateUserUI() {
    const el = document.getElementById('workspaceUser');
    if (el) {
      el.textContent = this.user ? `${this.user.name} (${this.user.email})` : 'Workspace Owner';
    }
  },

  bindForms() {
    // Register Form
    const rf = document.getElementById('registerForm');
    if (rf) {
      const first = document.getElementById('regFirstName');
      const last = document.getElementById('regLastName');
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
        this.setUserSession({
          name: fullName,
          email: email.value.trim(),
          provider: 'email'
        });

        Toast.show(`Welcome to TalentMine, ${first.value.trim()}! Workspace initialized.`, 'success');
        NavigationModule.showScreen('screen-dashboard');
      });
    }

    // Login Form
    const lf = document.getElementById('loginForm');
    if (lf) {
      const email = document.getElementById('loginEmail');
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

        const username = email.value.split('@')[0];
        const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
        this.setUserSession({
          name: formattedName,
          email: email.value.trim(),
          provider: 'email'
        });

        Toast.show(`Welcome back, ${formattedName}! Mining session active.`, 'success');
        NavigationModule.showScreen('screen-dashboard');
      });
    }
  },

  bindSocialAuth() {
    // Google Auth Buttons
    const googleBtns = document.querySelectorAll('.btn-social:has(svg path[fill="#4285F4"]), [data-social="google"]');
    googleBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerGoogleAuth();
      });
    });

    // LinkedIn Auth Buttons
    const linkedinBtns = document.querySelectorAll('.btn-social:has(svg rect[fill="#0A66C2"]), [data-social="linkedin"]');
    linkedinBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerLinkedInAuth();
      });
    });
  },

  triggerGoogleAuth() {
    // Check if Firebase Auth is initialized on window
    if (window.firebase && window.firebase.auth) {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider)
        .then(result => {
          const user = result.user;
          this.setUserSession({
            name: user.displayName || 'Google Recruiter',
            email: user.email,
            avatar: user.photoURL,
            provider: 'firebase-google'
          });
          Toast.show(`Authenticated via Google: ${user.email}`, 'success');
          NavigationModule.showScreen('screen-dashboard');
        })
        .catch(error => {
          console.error("Firebase Auth Error", error);
          Toast.show(`Firebase Auth: ${error.message}`, 'info');
        });
      return;
    }

    // Default High-Fidelity Google OAuth Simulator
    const emailCandidate = 'alex.recruiter@gmail.com';
    this.setUserSession({
      name: 'Alex Rivera',
      email: emailCandidate,
      provider: 'google',
      avatar: 'https://lh3.googleusercontent.com/a/default-user=s96-c'
    });

    Toast.show(`Google OAuth verified! Logged in as Alex Rivera (${emailCandidate})`, 'success');
    NavigationModule.showScreen('screen-dashboard');
  },

  triggerLinkedInAuth() {
    this.setUserSession({
      name: 'Sarah Sterling',
      email: 's.sterling@talentpartners.com',
      provider: 'linkedin'
    });

    Toast.show(`LinkedIn OAuth verified! Logged in as Sarah Sterling`, 'success');
    NavigationModule.showScreen('screen-dashboard');
  },

  bindForgotPassword() {
    const forgotLinks = document.querySelectorAll('.forgot-link');
    forgotLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const email = prompt("Enter your account email to receive a password recovery link:", "recruiter@company.com");
        if (email && this.isValidEmail(email)) {
          Toast.show(`Password reset instructions sent to ${email}`, 'success');
        } else if (email) {
          Toast.show("Please enter a valid email address.", "info");
        }
      });
    });
  },

  bindLogout() {
    const logoutBtns = document.querySelectorAll('.dash-logout');
    logoutBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.user = null;
        const state = StateManager.getState();
        state.user = null;
        StateManager.saveState(state);
        this.updateUserUI();
        Toast.show("Logged out of TalentMine workspace.", "info");
        NavigationModule.showScreen('screen-home');
      });
    });
  },

  setUserSession(userData) {
    this.user = userData;
    const state = StateManager.getState();
    state.user = userData;
    StateManager.saveState(state);
    this.updateUserUI();
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
    const field = input.closest('.field');
    if (!field) return;
    field.classList.remove('field-error');
    field.querySelector('.field-msg')?.remove();
  }
};
