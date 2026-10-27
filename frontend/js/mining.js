/**
 * TalentMine — Mining Setup & Results Module
 * Handles filter controls, crawling simulation, table rendering, search, and candidate modals
 */

const MiningModule = {
  currentResults: [],

  init() {
    this.populateCountries();
    this.bindFilters();
    this.bindSearch();
    this.bindGenerateButton();
    this.bindModal();
    this.checkInitialData();
  },

  checkInitialData() {
    const state = StateManager.getState();
    if (state.candidates && state.candidates.length > 0) {
      this.currentResults = state.candidates;
      this.renderResults();
    }
  },

  populateCountries() {
    const select = document.getElementById('countrySelect');
    if (!select) return;
    select.innerHTML = '<option value="">Select country</option>' +
      COUNTRIES.map(c => `<option value="${this.esc(c)}">${this.esc(c)}</option>`).join('');
  },

  bindFilters() {
    const country = document.getElementById('countrySelect');
    const citySelect = document.getElementById('citySelect');
    const cityInput = document.getElementById('cityInput');

    country?.addEventListener('change', () => {
      this.clearFieldError(country);
      this.updateCityControl(country.value);
    });

    [citySelect, cityInput, document.getElementById('candidateType')].forEach(el => {
      el?.addEventListener('change', () => this.clearFieldError(el));
      el?.addEventListener('input', () => this.clearFieldError(el));
    });
  },

  updateCityControl(selectedCountry) {
    const citySelect = document.getElementById('citySelect');
    const cityInput = document.getElementById('cityInput');
    if (!citySelect || !cityInput) return;

    const cities = CITY_MAP[selectedCountry];
    if (cities && cities.length) {
      citySelect.hidden = false;
      cityInput.hidden = true;
      cityInput.value = '';
      citySelect.innerHTML = '<option value="">Select city</option>' +
        cities.map(ct => `<option value="${this.esc(ct)}">${this.esc(ct)}</option>`).join('');
    } else if (selectedCountry) {
      citySelect.hidden = true;
      citySelect.innerHTML = '';
      cityInput.hidden = false;
      cityInput.placeholder = 'Enter city name';
    } else {
      citySelect.hidden = false;
      cityInput.hidden = true;
      citySelect.innerHTML = '<option value="">Select country first</option>';
    }
  },

  bindSearch() {
    const searchInput = document.getElementById('resultsSearch');
    searchInput?.addEventListener('input', () => {
      this.renderResults();
    });
  },

  bindGenerateButton() {
    const btn = document.getElementById('generateBtn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      const country = document.getElementById('countrySelect');
      const citySelect = document.getElementById('citySelect');
      const cityInput = document.getElementById('cityInput');
      const type = document.getElementById('candidateType');
      const progress = document.getElementById('miningProgress');
      const fill = document.getElementById('progressFill');
      const msg = document.getElementById('spreadsheetMessage');
      const badge = document.getElementById('dataModeBadge');

      const chosenCity = cityInput.hidden ? citySelect.value : cityInput.value.trim();

      // Validation
      let isValid = true;
      [country, citySelect, cityInput, type].forEach(el => this.clearFieldError(el));

      if (!country.value) {
        this.showFieldError(country, 'Select a target country.');
        isValid = false;
      }
      if (!chosenCity) {
        this.showFieldError(cityInput.hidden ? citySelect : cityInput, 'Select or specify a city.');
        isValid = false;
      }
      if (!type.value) {
        this.showFieldError(type, 'Choose a candidate category.');
        isValid = false;
      }

      if (!isValid) return;

      btn.disabled = true;
      progress.hidden = false;
      fill.style.width = '10%';
      if (msg) msg.textContent = 'CONNECTING TO INTELLIGENCE CRAWLER…';

      const steps = [
        { pct: 32, txt: 'MINING PUBLIC TALENT REPOSITORIES…' },
        { pct: 64, txt: 'VERIFYING PUBLIC EMAILS & SOCIAL LINKS…' },
        { pct: 88, txt: 'RUNNING DEDUPLICATION & SKILL TAXONOMY…' }
      ];

      for (const step of steps) {
        await new Promise(r => setTimeout(r, 260));
        fill.style.width = `${step.pct}%`;
        if (msg) msg.textContent = step.txt;
      }

      const queryData = {
        country: country.value,
        city: chosenCity,
        type: type.value
      };

      const { results, source } = await DataAdapter.runMining(queryData);

      fill.style.width = '100%';
      if (badge) {
        badge.textContent = source.toUpperCase();
        if (source.includes('PHP')) {
          badge.classList.add('is-live');
        } else {
          badge.classList.remove('is-live');
        }
      }

      this.currentResults = results;

      // Update State
      const state = StateManager.getState();
      const existingIds = new Set((state.candidates || []).map(c => c.id));
      const newUnique = results.filter(c => !existingIds.has(c.id));
      state.candidates = [...(state.candidates || []), ...newUnique];

      if (results.length > 0) {
        state.sessions.push({
          id: `S-${Date.now()}`,
          createdAt: new Date().toISOString(),
          country: country.value,
          city: chosenCity,
          type: type.value,
          count: results.length
        });
      }

      StateManager.saveState(state);

      this.renderResults();
      DashboardModule.renderAll();

      btn.disabled = false;
      setTimeout(() => {
        progress.hidden = true;
        fill.style.width = '0%';
      }, 500);

      Toast.show(
        results.length > 0
          ? `Mined ${results.length} verified candidate profiles for ${chosenCity}, ${country.value}!`
          : 'No records found matching filters. Adjust search criteria.',
        results.length > 0 ? 'success' : 'info'
      );
    });
  },

  renderResults() {
    const tbody = document.getElementById('spreadsheetBody');
    const searchInput = document.getElementById('resultsSearch');
    if (!tbody) return;

    const query = (searchInput?.value || '').trim().toLowerCase();
    const source = this.currentResults || [];

    const filtered = source.filter(c => {
      if (!query) return true;
      const haystack = [
        c.name,
        c.designation,
        c.location,
        c.email,
        c.phone,
        (c.skills || []).join(' ')
      ].join(' ').toLowerCase();
      return haystack.includes(query);
    });

    tbody.innerHTML = '';

    if (filtered.length === 0) {
      tbody.innerHTML = `
        <tr class="spreadsheet-empty-row">
          <td colspan="8">
            <div class="pending-panel-inline">
              <svg class="pending-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M12 7.5v5l3 2"/></svg>
              <p class="mono">${this.currentResults.length === 0 ? 'CONFIGURE MINING FILTERS AND CLICK GENERATE' : 'NO RECORDS MATCHING CURRENT SEARCH'}</p>
              <p class="pending-sub">${this.currentResults.length === 0 ? 'Publicly mined and validated candidates will be organized in this spreadsheet.' : 'Try adjusting the keyword search or filter parameters.'}</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    const state = StateManager.getState();
    const shortlist = new Set(state.shortlist || []);

    filtered.forEach(c => {
      const isSaved = shortlist.has(c.id);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><button type="button" class="candidate-link" data-candidate="${this.esc(c.id)}">${this.esc(c.name)}</button></td>
        <td>${this.esc(c.designation)}</td>
        <td>${c.experience === 0 ? '<span style="color:var(--violet);">Student</span>' : c.experience + ' yrs'}</td>
        <td>${(c.skills || []).map(s => `<span class="skill-pill">${this.esc(s)}</span>`).join('')}</td>
        <td>${this.esc(c.location)}</td>
        <td><a href="mailto:${this.esc(c.email)}" style="color:var(--cyan);text-decoration:underline;">${this.esc(c.email)}</a></td>
        <td class="mono" style="font-size:11px;">${this.esc(c.phone)}</td>
        <td style="text-align:center;">
          <button type="button" class="row-action ${isSaved ? 'is-saved' : ''}" data-shortlist="${this.esc(c.id)}" title="${isSaved ? 'Remove from shortlist' : 'Add to shortlist'}">
            ${isSaved ? '★' : '☆'}
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // Bind row clicks
    tbody.querySelectorAll('[data-shortlist]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.toggleShortlist(btn.dataset.shortlist);
      });
    });

    tbody.querySelectorAll('[data-candidate]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.openCandidateModal(btn.dataset.candidate);
      });
    });
  },

  toggleShortlist(id) {
    const state = StateManager.getState();
    let list = state.shortlist || [];

    if (list.includes(id)) {
      list = list.filter(item => item !== id);
      Toast.show('Candidate removed from your shortlist.', 'info');
    } else {
      list.push(id);
      Toast.show('Candidate added to your shortlist!', 'success');
    }

    state.shortlist = list;
    StateManager.saveState(state);

    this.renderResults();
    DashboardModule.renderAll();
  },

  openCandidateModal(id) {
    const state = StateManager.getState();
    const all = [...(this.currentResults || []), ...(state.candidates || []), ...FALLBACK_CANDIDATES];
    const candidate = all.find(c => c.id === id);
    if (!candidate) return;

    const modal = document.getElementById('candidateModal');
    const content = document.getElementById('candidateModalContent');
    if (!modal || !content) return;

    const isSaved = (state.shortlist || []).includes(candidate.id);

    content.innerHTML = `
      <div class="eyebrow mono">CANDIDATE INTELLIGENCE PROFILE</div>
      <h2>${this.esc(candidate.name)}</h2>
      <p class="candidate-designation">${this.esc(candidate.designation)} · ${this.esc(candidate.location)}</p>

      <div class="detail-grid">
        <div>
          <span>EXPERIENCE LEVEL</span>
          <strong>${candidate.experience === 0 ? 'Student / Early Career' : `${candidate.experience} Years Active`}</strong>
        </div>
        <div>
          <span>PROFILE STATUS</span>
          <strong style="color:var(--emerald);">◈ ${candidate.status || 'Verified Active'}</strong>
        </div>
        <div>
          <span>SKILLS BREAKDOWN</span>
          <strong>${(candidate.skills || []).map(this.esc).join(' · ')}</strong>
        </div>
        <div>
          <span>EDUCATION</span>
          <strong>${this.esc(candidate.education || 'Computer Science & Software Systems')}</strong>
        </div>
        <div>
          <span>WORK EMAIL</span>
          <strong><a href="mailto:${this.esc(candidate.email)}" style="color:var(--cyan);">${this.esc(candidate.email)}</a></strong>
        </div>
        <div>
          <span>PHONE / CONTACT</span>
          <strong>${this.esc(candidate.phone)}</strong>
        </div>
        <div>
          <span>DATA SOURCE</span>
          <strong>${this.esc(candidate.source || 'Public Profile Crawler')}</strong>
        </div>
        <div>
          <span>PUBLIC PROFILE</span>
          <strong><a href="${this.esc(candidate.profile || '#')}" target="_blank" rel="noopener noreferrer" style="color:var(--cyan);text-decoration:underline;">View External Repository ↗</a></strong>
        </div>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-solid" id="modalShortlistBtn">
          ${isSaved ? '★ Remove from Shortlist' : '☆ Add to Shortlist'}
        </button>
        <button type="button" class="btn btn-outline" id="modalExportCandidate">Export Candidate (CSV)</button>
        <button type="button" class="btn btn-outline" id="modalCloseBtn">Close</button>
      </div>
    `;

    modal.hidden = false;

    document.getElementById('modalShortlistBtn')?.addEventListener('click', () => {
      this.toggleShortlist(candidate.id);
      this.openCandidateModal(candidate.id);
    });

    document.getElementById('modalExportCandidate')?.addEventListener('click', () => {
      DashboardModule.downloadCSV([candidate], `${candidate.name.toLowerCase().replace(' ', '_')}_profile.csv`);
      Toast.show(`Exported profile for ${candidate.name}`, 'success');
    });

    document.getElementById('modalCloseBtn')?.addEventListener('click', () => {
      modal.hidden = true;
    });
  },

  bindModal() {
    const modal = document.getElementById('candidateModal');
    if (!modal) return;

    modal.querySelectorAll('[data-modal-close]').forEach(el => {
      el.addEventListener('click', () => {
        modal.hidden = true;
      });
    });
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
  },

  esc(str) {
    return String(str ?? '').replace(/[&<>'"]/g, c => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    }[c]));
  }
};
