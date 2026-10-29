/**
 * TalentMine — API Adapter
 * All candidate data is fetched from the PHP backend (or your live API when ready).
 * No fallback data, no synthesized records.
 */

const DataAdapter = {
  isBackendActive: null,

  async probeBackend() {
    if (this.isBackendActive !== null) return this.isBackendActive;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1500);
      const res = await fetch(`${CONFIG.API_BASE}/../index.php`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      this.isBackendActive = res.ok;
    } catch (e) {
      this.isBackendActive = false;
    }
    return this.isBackendActive;
  },

  async runMining({ country, city, type, skill, q }) {
    const params = new URLSearchParams();
    if (country) params.append('country', country);
    if (city)    params.append('city', city);
    if (type)    params.append('type', type);
    if (skill)   params.append('skill', skill);
    if (q)       params.append('q', q);

    const response = await fetch(`${CONFIG.API_BASE}/candidates.php?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    const json = await response.json();
    return {
      results: json.results || [],
      count: json.count || 0,
      source: 'API'
    };
  },

  async getPlatformStats() {
    const response = await fetch(`${CONFIG.API_BASE}/stats.php`);
    if (!response.ok) {
      throw new Error(`Stats API error: ${response.status}`);
    }
    return await response.json();
  }
};
