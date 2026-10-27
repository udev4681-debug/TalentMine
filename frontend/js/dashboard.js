/**
 * TalentMine — Dashboard Module
 * Handles Overview stats, Analytics charts, Export actions, and Shortlist
 */

const DashboardModule = {
  init() {
    this.bindNav();
    this.renderAll();
  },

  bindNav() {
    const navItems = document.querySelectorAll('.dash-nav-item');
    const panels = document.querySelectorAll('.dash-panel');

    navItems.forEach(btn => {
      btn.addEventListener('click', () => {
        navItems.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const target = btn.dataset.panel;
        panels.forEach(p => p.classList.toggle('active', p.id === `panel-${target}`));

        if (target === 'overview') this.renderOverview();
        if (target === 'analytics') this.renderAnalytics();
        if (target === 'export') this.renderExport();
        if (target === 'shortlist') this.renderShortlist();
      });
    });
  },

  renderAll() {
    this.renderStats();
    this.renderOverview();
    this.renderAnalytics();
    this.renderExport();
    this.renderShortlist();
  },

  renderStats() {
    const state = StateManager.getState();
    const all = state.candidates || [];
    const students = all.filter(c => c.type === 'student').length;
    const pros = all.filter(c => c.type === 'professional').length;
    const sessions = (state.sessions || []).length;

    const values = [all.length, students, pros, sessions];
    const statEls = document.querySelectorAll('.stats-grid .stat-value');
    statEls.forEach((el, i) => {
      if (values[i] !== undefined) {
        el.textContent = values[i];
      }
    });

    const note = document.querySelector('.stats-note');
    if (note) {
      note.textContent = sessions > 0
        ? `CONNECTED WORKSPACE · ${all.length} VERIFIED RECORDS · ${sessions} MINING SESSION${sessions === 1 ? '' : 'S'} LOGGED`
        : 'LOCAL WORKSPACE · RUN YOUR FIRST MINING SESSION TO POPULATE COUNTS';
    }
  },

  renderOverview() {
    const state = StateManager.getState();
    const all = state.candidates || [];
    const students = all.filter(c => c.type === 'student').length;
    const pros = all.filter(c => c.type === 'professional').length;
    const total = all.length || 1;

    const proPercent = Math.round((pros / total) * 100);
    const stuPercent = Math.round((students / total) * 100);

    const breakdownBox = document.querySelector('.overview-grid .empty-state:first-child');
    if (breakdownBox) {
      if (all.length > 0) {
        breakdownBox.innerHTML = `
          <p class="mono" style="color:var(--cyan);margin-bottom:14px;">CANDIDATE TYPE BREAKDOWN</p>
          <div class="chart-bars-wrap">
            <div class="chart-bar-row">
              <div class="chart-bar-header">
                <span>Working Professionals</span>
                <strong>${pros} (${proPercent}%)</strong>
              </div>
              <div class="chart-track">
                <div class="chart-bar-fill pro" style="width:${proPercent}%"></div>
              </div>
            </div>
            <div class="chart-bar-row">
              <div class="chart-bar-header">
                <span>Students & Graduates</span>
                <strong>${students} (${stuPercent}%)</strong>
              </div>
              <div class="chart-track">
                <div class="chart-bar-fill student" style="width:${stuPercent}%"></div>
              </div>
            </div>
          </div>
          <p class="empty-sub" style="margin-top:18px;">Based on ${all.length} validated candidate profile records in this workspace.</p>
        `;
      } else {
        breakdownBox.innerHTML = `
          <div class="empty-chart" aria-hidden="true">
            <svg viewBox="0 0 220 100"><line x1="10" y1="88" x2="210" y2="88" stroke="rgba(140,170,255,0.28)" stroke-width="1.4"/><line x1="10" y1="10" x2="10" y2="88" stroke="rgba(140,170,255,0.28)" stroke-width="1.4"/></svg>
          </div>
          <p class="mono">CANDIDATE TYPE BREAKDOWN</p>
          <p class="empty-sub">Run a mining session to see live student vs. professional ratios.</p>
        `;
      }
    }

    const activityBox = document.querySelector('.overview-grid .empty-state:last-child');
    if (activityBox) {
      const sessions = state.sessions || [];
      if (sessions.length > 0) {
        activityBox.innerHTML = `
          <p class="mono" style="color:var(--emerald);margin-bottom:12px;">RECENT MINING ACTIVITY</p>
          <div style="display:flex;flex-direction:column;gap:8px;text-align:left;">
            ${sessions.slice(-3).reverse().map(s => `
              <div style="background:var(--panel-2);border:1px solid var(--border);border-radius:var(--radius-sm);padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <div style="font-size:12px;color:var(--text);font-weight:600;">${s.country} · ${s.city || 'Any City'}</div>
                  <div style="font-size:10px;color:var(--text-dim);text-transform:uppercase;">Type: ${s.type || 'All'}</div>
                </div>
                <span class="mono" style="color:var(--cyan);font-size:11px;">+${s.count} records</span>
              </div>
            `).join('')}
          </div>
        `;
      } else {
        activityBox.innerHTML = `
          <p class="mono">RECENT MINING ACTIVITY</p>
          <p class="empty-sub">Run a session to generate activity logs. Validated records are stored automatically in this workspace.</p>
        `;
      }
    }
  },

  renderAnalytics() {
    const box = document.getElementById('analyticsContent');
    if (!box) return;

    const state = StateManager.getState();
    const sessions = state.sessions || [];
    const candidates = state.candidates || [];
    const shortlist = state.shortlist || [];

    if (!sessions.length && !candidates.length) {
      box.innerHTML = `
        <div class="empty-state hud-corners">
          <p class="mono">NO MINING SESSIONS RECORDED YET</p>
          <p class="empty-sub">Configure and trigger a search on the Mining page to generate analytical telemetry.</p>
          <button class="btn btn-solid btn-sm" style="margin-top:16px;" onclick="NavigationModule.showScreen('screen-mining')">Start Mining</button>
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <div class="analytics-cards">
        <div class="stat-card hud-corners">
          <div class="stat-value">${sessions.length}</div>
          <div class="stat-label">SESSIONS EXECUTED</div>
        </div>
        <div class="stat-card hud-corners">
          <div class="stat-value">${candidates.length}</div>
          <div class="stat-label">CANDIDATES MINED</div>
        </div>
        <div class="stat-card hud-corners">
          <div class="stat-value">${shortlist.length}</div>
          <div class="stat-label">SHORTLISTED TALENT</div>
        </div>
      </div>
      <div class="section-head" style="margin-bottom:18px;">
        <div class="eyebrow mono" style="font-size:10.5px;">SESSION AUDIT LOG</div>
      </div>
      <div class="activity-list hud-corners">
        ${sessions.slice().reverse().map(s => `
          <div class="activity-row">
            <span><strong>${s.country || 'Global'}</strong> · ${s.city || 'All Cities'} (${s.type || 'Combined'})</span>
            <strong>${s.count} verified records</strong>
            <small class="mono">${new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderExport() {
    const box = document.getElementById('exportContent');
    if (!box) return;

    const state = StateManager.getState();
    const count = (state.candidates || []).length;

    if (!count) {
      box.innerHTML = `
        <div class="empty-state hud-corners">
          <p class="mono">NO CANDIDATE DATA TO EXPORT YET</p>
          <p class="empty-sub">Run a search in the Mining tab to populate verified records ready for export.</p>
          <button class="btn btn-solid btn-sm" style="margin-top:16px;" onclick="NavigationModule.showScreen('screen-mining')">Go to Mining Setup</button>
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <div class="export-ready hud-corners">
        <p class="mono">◈ ${count} VERIFIED CANDIDATE RECORD${count === 1 ? '' : 'S'} READY FOR EXPORT</p>
        <p class="empty-sub" style="max-width:none;margin-top:6px;">Download formatted datasets directly or sync to Google Cloud Sheets.</p>
        <div class="export-options-grid">
          <div class="export-box">
            <h3>Excel / CSV Spreadsheets</h3>
            <p>Export all candidate columns, contacts, and skills formatted as comma-separated values.</p>
            <button class="btn btn-solid btn-sm" id="btnExportCsv">Download CSV</button>
          </div>
          <div class="export-box">
            <h3>Structured JSON Feed</h3>
            <p>Export standardized JSON schemas for importing into ATS systems (Greenhouse, Lever, Workday).</p>
            <button class="btn btn-outline btn-sm" id="btnExportJson">Download JSON</button>
          </div>
          <div class="export-box">
            <h3>Google Sheets Sync</h3>
            <p>Connect your verified records to a live Google Sheet for recruiting collaboration.</p>
            <button class="btn btn-outline btn-sm" id="btnSyncSheets">Sync Google Sheets</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btnExportCsv')?.addEventListener('click', () => {
      this.downloadCSV(state.candidates);
      Toast.show(`Downloaded talentmine-records.csv (${count} records)`, 'success');
    });

    document.getElementById('btnExportJson')?.addEventListener('click', () => {
      this.downloadJSON(state.candidates);
      Toast.show(`Downloaded talentmine-records.json (${count} records)`, 'success');
    });

    document.getElementById('btnSyncSheets')?.addEventListener('click', () => {
      this.simulateGoogleSheetsSync(count);
    });
  },

  renderShortlist() {
    const box = document.getElementById('shortlistContent');
    if (!box) return;

    const state = StateManager.getState();
    const shortlistIds = state.shortlist || [];
    const all = state.candidates || [];
    const shortlistedCandidates = shortlistIds
      .map(id => all.find(c => c.id === id))
      .filter(Boolean);

    if (!shortlistedCandidates.length) {
      box.innerHTML = `
        <div class="empty-state hud-corners">
          <p class="mono">NO CANDIDATES SHORTLISTED YET</p>
          <p class="empty-sub">Star candidates from your mining results table to build a curated talent list.</p>
          <button class="btn btn-solid btn-sm" style="margin-top:16px;" onclick="NavigationModule.showScreen('screen-mining')">Browse Mining Results</button>
        </div>
      `;
      return;
    }

    box.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <span class="mono" style="font-size:11.5px;color:var(--cyan);">${shortlistedCandidates.length} CANDIDATE${shortlistedCandidates.length === 1 ? '' : 'S'} SHORTLISTED</span>
        <button class="btn btn-outline btn-sm" id="btnExportShortlist">Export Shortlist (CSV)</button>
      </div>
      <div class="shortlist-list">
        ${shortlistedCandidates.map(c => `
          <div class="shortlist-row hud-corners">
            <div>
              <strong>${c.name}</strong>
              <span>${c.designation} · ${c.location} · ${c.experience ? c.experience + ' yrs' : 'Student'}</span>
            </div>
            <div class="shortlist-actions">
              <button class="btn btn-outline btn-sm" data-view-candidate="${c.id}">View Details</button>
              <button class="btn btn-outline btn-sm" style="color:var(--rose);" data-remove-shortlist="${c.id}">Remove</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    box.querySelectorAll('[data-view-candidate]').forEach(btn => {
      btn.addEventListener('click', () => {
        MiningModule.openCandidateModal(btn.dataset.viewCandidate);
      });
    });

    box.querySelectorAll('[data-remove-shortlist]').forEach(btn => {
      btn.addEventListener('click', () => {
        MiningModule.toggleShortlist(btn.dataset.removeShortlist);
        this.renderShortlist();
      });
    });

    document.getElementById('btnExportShortlist')?.addEventListener('click', () => {
      this.downloadCSV(shortlistedCandidates, 'talentmine-shortlist.csv');
      Toast.show(`Exported ${shortlistedCandidates.length} shortlisted candidates!`, 'success');
    });
  },

  downloadCSV(rows, filename = 'talentmine-records.csv') {
    const headers = ['ID', 'Name', 'Designation', 'Experience', 'Skills', 'Location', 'Email', 'Phone', 'Type', 'Country', 'City', 'Source', 'Profile'];
    const csvContent = [
      headers.join(','),
      ...rows.map(c => [
        c.id,
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.designation || '').replace(/"/g, '""')}"`,
        c.experience || 0,
        `"${(c.skills ? c.skills.join('; ') : '').replace(/"/g, '""')}"`,
        `"${(c.location || '').replace(/"/g, '""')}"`,
        c.email || '',
        c.phone || '',
        c.type || '',
        c.country || '',
        c.city || '',
        c.source || '',
        c.profile || ''
      ].join(','))
    ].join('\r\n');

    this.triggerDownload(csvContent, filename, 'text/csv;charset=utf-8');
  },

  downloadJSON(rows, filename = 'talentmine-records.json') {
    const jsonStr = JSON.stringify(rows, null, 2);
    this.triggerDownload(jsonStr, filename, 'application/json;charset=utf-8');
  },

  triggerDownload(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },

  simulateGoogleSheetsSync(count) {
    Toast.show(`Syncing ${count} candidate records to Google Sheets...`, 'info');
    setTimeout(() => {
      Toast.show(`Successfully synced ${count} records with "TalentMine Pipeline (2026)" on Google Drive!`, 'success');
    }, 1200);
  }
};
