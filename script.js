/**
 * TalentMine — Root Script Entrypoint
 * Dynamically loads and bootstraps the modular frontend scripts
 */

(function loadTalentMineModules() {
  const modules = [
    './frontend/js/config.js',
    './frontend/js/data.js',
    './frontend/js/api.js',
    './frontend/js/canvas.js',
    './frontend/js/auth.js',
    './frontend/js/dashboard.js',
    './frontend/js/mining.js',
    './frontend/js/main.js'
  ];

  let loaded = 0;
  function loadNext() {
    if (loaded >= modules.length) return;
    const script = document.createElement('script');
    script.src = modules[loaded];
    script.onload = () => {
      loaded++;
      loadNext();
    };
    script.onerror = (e) => console.error(`Failed to load module: ${modules[loaded]}`, e);
    document.head.appendChild(script);
  }

  loadNext();
})();
