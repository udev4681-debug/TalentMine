/**
 * TalentMine — Canvas Visualizations
 * 1. Hero 3D Particle Network
 * 2. Data Mining Interactive Pipeline Canvas
 */

const CanvasModule = {
  initHeroNetwork() {
    const canvas = document.getElementById('galaxy-canvas');
    const nodeCountEl = document.getElementById('nodeCount');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w, h, dpr, nodes = [], raf;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetNodes = prefersReducedMotion ? 50 : (w < 600 ? 60 : 120);
      nodes = Array.from({ length: targetNodes }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18,
        vy: (Math.random() - 0.5) * 0.18,
        r: 0.8 + Math.random() * 1.8
      }));

      if (nodeCountEl) {
        nodeCountEl.textContent = nodes.length;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        a.x += a.vx;
        a.y += a.vy;
        if (a.x < 0 || a.x > w) a.vx *= -1;
        if (a.y < 0 || a.y > h) a.vy *= -1;

        // Draw node connections
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 110) {
            ctx.strokeStyle = `rgba(34, 228, 255, ${(1 - dist / 110) * 0.12})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        // Draw node dot
        ctx.fillStyle = 'rgba(34, 228, 255, 0.65)';
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    resize();
    window.addEventListener('resize', resize);

    if (prefersReducedMotion) {
      draw();
    } else {
      const loop = () => {
        draw();
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }
  },

  initPipelineCanvas() {
    const canvas = document.getElementById('pipeline-canvas');
    if (!canvas) return;

    const wrap = canvas.parentElement;
    const ctx = canvas.getContext('2d');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const names = ['CANDIDATE DATA', 'MINING', 'PATTERN DISCOVERY', 'INTELLIGENCE', 'INSIGHTS'];
    const colors = ['#39C2FF', '#22E4FF', '#9B5CFF', '#B15CFF', '#2FE6B0'];

    let points = [];
    let particles = [];
    let pulses = names.map(() => 0);
    let last = performance.now();
    let spawn = 0;
    let w = 0, h = 0, dpr = 1, vertical = false;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = wrap.clientWidth;
      vertical = w < 580;
      h = vertical ? names.length * 80 : 190;

      points = names.map((_, i) =>
        vertical
          ? { x: 38, y: 40 + i * 80 }
          : { x: 64 + ((w - 128) / (names.length - 1)) * i, y: h / 2 - 16 }
      );

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function rgba(hex, a) {
      const n = parseInt(hex.slice(1), 16);
      return `rgba(${n >> 16 & 255}, ${n >> 8 & 255}, ${n & 255}, ${a})`;
    }

    function tick(dt) {
      spawn -= dt;
      if (spawn <= 0) {
        particles.push({ seg: 0, t: 0, s: 0.45 + Math.random() * 0.35 });
        spawn = 0.4 + Math.random() * 0.3;
      }
      particles.forEach(p => {
        p.t += dt * p.s;
        if (p.t >= 1) {
          p.t = 0;
          p.seg++;
          if (p.seg < pulses.length) pulses[p.seg] = 1;
        }
      });
      particles = particles.filter(p => p.seg < names.length - 1);
      pulses = pulses.map(v => Math.max(0, v - dt * 1.5));
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // Draw dashed connector line
      ctx.strokeStyle = 'rgba(140, 170, 255, 0.22)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([3, 6]);
      ctx.beginPath();
      points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw moving packets
      particles.forEach(p => {
        const a = points[p.seg];
        const b = points[p.seg + 1];
        if (!a || !b) return;
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;

        const g = ctx.createRadialGradient(x, y, 0, x, y, 7);
        g.addColorStop(0, 'rgba(224, 250, 255, 0.95)');
        g.addColorStop(1, 'rgba(34, 228, 255, 0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(x, y, 7, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw stage nodes and text
      points.forEach((p, i) => {
        const pulse = pulses[i];
        const r = 9 + pulse * 7;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2.4);
        g.addColorStop(0, rgba(colors[i], 0.5 + pulse * 0.35));
        g.addColorStop(1, rgba(colors[i], 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = rgba(colors[i], 0.7);
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(200, 212, 240, 0.95)';
        ctx.font = '600 11px "IBM Plex Mono", monospace';
        ctx.textAlign = vertical ? 'left' : 'center';
        ctx.textBaseline = vertical ? 'middle' : 'alphabetic';
        ctx.fillText(names[i], vertical ? p.x + 22 : p.x, vertical ? p.y : p.y + 44);
      });
    }

    function loop(now) {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      tick(dt);
      draw();
      requestAnimationFrame(loop);
    }

    resize();
    window.addEventListener('resize', resize);
    if (prefersReducedMotion) {
      draw();
    } else {
      requestAnimationFrame(loop);
    }
  }
};
