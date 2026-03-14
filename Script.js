document.addEventListener('DOMContentLoaded', () => {

  // 1. VARIABLES
  const cards = document.querySelectorAll('.back-card');
  const windows = document.querySelectorAll('.window');
  const folder = document.querySelector('.folder');
  const cardStack = document.querySelector('.card-stack');
  const files = document.querySelectorAll('.file-item');
  const previewMedia = document.querySelector('.preview-media');
  const previewTitle = document.querySelector('.preview-title');
  const previewDesc = document.querySelector('.preview-desc');
  const previewMeta = document.querySelector('.preview-meta');
  const windowDock = document.getElementById('window-dock');

  const personaWindow = document.getElementById('persona-window');
  const detailsContainer = document.getElementById('persona-details');

  const MAX_WINDOWS = 2;
  const activeWindows = [];
  const minimizedWindows = new Map();
  const activeToasts = [];
  const MAX_TOASTS = 3;
  const TOAST_LIFETIME = 5000;
  let topZ = 100;
  let hoverTimeout;

  const projectData = {
    lumify: { title: "Lumify", desc: "A calm space for understanding your skin.", image: "Images/Lumify BG.png", meta: "UX · Branding · 2024" },
    myro: { title: "Myro", desc: "Reducing friction and guiding decisions.", image: "Images/Myro BG.png", meta: "UX · Web · 2023" },
    portfolio: { title: "This Portfolio", desc: "A spatial interface exploring focus.", image: "", meta: "Experimental · 2025" }
  };

  // --- 🌟 Vibe Labels & Terracotta Bar Helper ---
  function createValueBar(label, width) {
    const percent = parseInt(width);
    let vibe = "Standard";
    if (percent > 90) vibe = "Obsessed";
    else if (percent > 75) vibe = "Critical";
    else if (percent > 50) vibe = "Growing";

    return `
      <div class="value-bar-container">
          <div class="label-row">
              <span class="value-label">${label}</span>
              <span class="vibe-tag">${vibe}</span>
          </div>
          <div class="bar-bg">
            <div class="bar-fill" style="--width: ${width}">
                <span class="bar-star">⭐</span>
            </div>
          </div>
      </div>`;
  }

  const personaData = {
    'dtc': {
      name: "Sadie",
      img: "Images/Personas/SadieJM.png",
      bio: `
        <div class="persona-bio-content">
            <p class="tagline">"I care about my skin but become easily frustrated when routines feel confusing."</p>
            <div class="bio-section">
                <h4>Frustrations</h4>
                <ul>
                    <li>Routines that feel complicated or lack immediate clarity.</li>
                    <li>Difficulty maintaining multi-step routines during busy school periods.</li>
                </ul>
            </div>
            <div class="bio-section">
                <h4>Core Values</h4>
                ${createValueBar("Self-Care", "70%")}
                ${createValueBar("Simplicity/Practicality", "95%")}
                ${createValueBar("Comfort", "80%")}
                ${createValueBar("Credibility", "75%")}
                ${createValueBar("Consistency", "60%")}
            </div>
        </div>`
    },
    'affiliate': {
      name: "Emily",
      img: "Images/Personas/EmilyJM.png",
      bio: `
        <div class="persona-bio-content">
            <p class="tagline">"I prefer practical, dermatologist-approved insights and value long-term results."</p>
            <div class="bio-section">
                <h4>Frustrations</h4>
                <ul>
                    <li>"Hydrating" products that still cause redness or stinging.</li>
                    <li>Overwhelmed by inconsistent advice and unsure what to trust.</li>
                </ul>
            </div>
            <div class="bio-section">
                <h4>Core Values</h4>
                ${createValueBar("Self-Care", "80%")}
                ${createValueBar("Simplicity/Practicality", "90%")}
                ${createValueBar("Comfort", "85%")}
                ${createValueBar("Credibility", "98%")}
                ${createValueBar("Consistency", "75%")}
            </div>
        </div>`
    },
    'retailer': {
      name: "Derreck",
      img: "Images/Personas/DerreckJM.png",
      bio: `
        <div class="persona-bio-content">
            <p class="tagline">"I value openness and community, gravitating toward inclusive spaces."</p>
            <div class="bio-section">
                <h4>Frustrations</h4>
                <ul>
                    <li>Skincare advice that feels hyper-commercial or disconnected.</li>
                    <li>Fear of judgement or dismissal when sharing skin concerns online.</li>
                </ul>
            </div>
            <div class="bio-section">
                <h4>Core Values</h4>
                ${createValueBar("Self-Care", "80%")}
                ${createValueBar("Emotional Openness", "98%")}
                ${createValueBar("Comfort", "85%")}
                ${createValueBar("Credibility", "70%")}
                ${createValueBar("Inclusivity", "85%")}
            </div>
        </div>`
    }
  };

  // 2. CORE FUNCTIONS
  function openWindow(win) {
    if (!win || activeWindows.includes(win)) { if (win) focusWindow(win); return; }
    let targetPos = null;
    if (activeWindows.length >= MAX_WINDOWS) {
      const oldest = activeWindows.shift();
      targetPos = { left: oldest.style.left, top: oldest.style.top };
      closeAndArchive(oldest);
    }
    activeWindows.push(win);
    win.classList.add('preview'); win.classList.remove('full');
    win.style.display = 'block'; win.style.opacity = '0'; win.style.zIndex = ++topZ;
    if (targetPos && targetPos.left) { win.style.left = targetPos.left; win.style.top = targetPos.top; }
    else { const anchor = (activeWindows.length === 1) ? { left: '56vw', top: '12vh' } : { left: '6vw', top: '14vh' }; win.style.left = anchor.left; win.style.top = anchor.top; }
    requestAnimationFrame(() => {
      win.style.transition = 'transform .32s cubic-bezier(.2,.8,.2,1), opacity .32s ease, left .4s ease, top .4s ease';
      win.style.opacity = '1'; win.style.transform = 'scale(1)';
    });
  }

  function openProjectWindow(id) {
    const projectWin = document.getElementById(`${id}-window`);
    if (!projectWin) return;
    projectWin.style.display = 'block'; projectWin.style.opacity = '0';
    projectWin.style.zIndex = ++topZ + 100;
    projectWin.style.left = '50%'; projectWin.style.top = '50%';
    projectWin.style.transform = 'translate(-50%, -50%) scale(0.95)';
    requestAnimationFrame(() => { projectWin.style.transition = 'all .4s cubic-bezier(.2,.8,.2,1)'; projectWin.style.opacity = '1'; projectWin.style.transform = 'translate(-50%, -50%) scale(1)'; });
  }

  function closeAndArchive(win) {
    win.style.opacity = '0'; win.style.transform = 'translateY(20px) scale(0.95)';
    setTimeout(() => { win.style.display = 'none'; const i = activeWindows.indexOf(win); if (i > -1) activeWindows.splice(i, 1); }, 300);
  }

  // --- 🌟 Persona Click Listener ---
  document.querySelectorAll('.persona-icon-container').forEach(icon => {
    icon.addEventListener('click', () => {
      const type = icon.dataset.persona;
      const data = personaData[type];
      detailsContainer.innerHTML = `
        <div class="window-bar">
            <span class="window-title">${data.name}'s Profile</span>
            <button class="close-btn">×</button>
        </div>
        <div class="persona-content-area">
            <div class="persona-header-row">
                <h3>${data.name}</h3>
                <div class="persona-window-bio">${data.bio}</div>
            </div>
            <div class="journey-map-section">
                <h4>User Journey Map</h4>
                <div class="map-container">
                    <img src="${data.img}" class="persona-window-img" alt="Journey Map">
                </div>
            </div>
        </div>`;
      personaWindow.style.display = 'block';
      setTimeout(() => { personaWindow.classList.add('active'); }, 10);
    });
  });

  // --- 🌟 Lightbox & Global Clicks ---
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('persona-window-img')) {
      const lightbox = document.createElement('div');
      lightbox.className = 'map-lightbox';
      lightbox.innerHTML = `<div class="lightbox-content"><img src="${e.target.src}"><button class="close-lightbox">×</button></div>`;
      document.body.appendChild(lightbox);
      setTimeout(() => lightbox.classList.add('active'), 10);
    }
    if (e.target.classList.contains('close-lightbox') || e.target.classList.contains('map-lightbox')) {
      const lb = document.querySelector('.map-lightbox');
      if (lb) { lb.classList.remove('active'); setTimeout(() => lb.remove(), 400); }
    }
    if (e.target.classList.contains('close-btn')) {
      personaWindow.classList.remove('active');
      setTimeout(() => { personaWindow.style.display = 'none'; }, 400);
    }
  });

  // Init Draggable, etc.
  windows.forEach(win => {
    const bar = win.querySelector('.window-bar');
    if (bar) bar.addEventListener('mousedown', e => { /* Drag Logic */ });
  });

  cards.forEach(card => card.addEventListener('click', e => { e.preventDefault(); openWindow(document.getElementById(card.dataset.window)); }));
  files.forEach(file => file.addEventListener('dblclick', () => openProjectWindow(file.dataset.project)));
});