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
  const workspaceOverlay = document.querySelector('.workspace-overlay');
  const windowDock = document.getElementById('window-dock');

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

  // 2. SPATIAL LOGIC
  function getRightAnchor() { return { left: '56vw', top: '12vh' }; }
  function getLeftAnchor() { return { left: '6vw', top: '14vh' }; }

  // 3. CORE FUNCTIONS
  function openWindow(win) {
    if (!win || activeWindows.includes(win)) {
      if (win) focusWindow(win);
      return;
    }

    let targetPos = null;

    if (activeWindows.length >= MAX_WINDOWS) {
      const oldest = activeWindows.shift();
      targetPos = { left: oldest.style.left, top: oldest.style.top };
      closeAndArchive(oldest);
      createToast("System: Giving the screen a break...");
    }

    activeWindows.push(win);
    win.classList.add('preview');
    win.classList.remove('full');

    if (minimizedWindows.has(win)) {
      minimizedWindows.get(win).remove();
      minimizedWindows.delete(win);
    }

    win.style.display = 'block';
    win.style.opacity = '0';
    win.style.zIndex = ++topZ;

    if (targetPos && targetPos.left) {
      win.style.left = targetPos.left;
      win.style.top = targetPos.top;
    } else {
      const anchor = (activeWindows.length === 1) ? getRightAnchor() : getLeftAnchor();
      win.style.left = anchor.left;
      win.style.top = anchor.top;
    }

    requestAnimationFrame(() => {
      win.style.transition = 'transform .32s cubic-bezier(.2,.8,.2,1), opacity .32s ease, left .4s ease, top .4s ease';
      win.style.opacity = '1';
      win.style.transform = 'scale(1)';
    });

    updateFolderState();
    animateFolder();
  }

  // --- PROJECT SPECIFIC OPENING (Centered & Exempt from 2-window rule) ---
  function openProjectWindow(id) {
    const projectWin = document.getElementById(`${id}-window`);
    if (!projectWin) return;

    projectWin.style.display = 'block';
    projectWin.style.opacity = '0';
    projectWin.style.zIndex = ++topZ + 100; // Above workspace

    // Center it
    projectWin.style.left = '50%';
    projectWin.style.top = '50%';
    projectWin.style.transform = 'translate(-50%, -50%) scale(0.95)';

    requestAnimationFrame(() => {
      projectWin.style.transition = 'all .4s cubic-bezier(.2,.8,.2,1)';
      projectWin.style.opacity = '1';
      projectWin.style.transform = 'translate(-50%, -50%) scale(1)';
    });
  }

  function closeAndArchive(win) {
    win.style.opacity = '0';
    win.style.transform = 'translateY(20px) scale(0.95)';
    setTimeout(() => {
      win.style.display = 'none';
      removeFromActive(win);
      addToDock(win);
      updateFolderState();
    }, 300);
  }

  function addToDock(win) {
    if (minimizedWindows.has(win)) return;
    const item = document.createElement('div');
    item.className = 'dock-item';
    item.textContent = win.querySelector('.window-title')?.textContent || "Window";
    item.addEventListener('click', () => openWindow(win));
    minimizedWindows.set(win, item);
    windowDock.appendChild(item);
  }

  function updateFolderState() {
    folder.classList.remove('folder--active', 'folder--busy');
    if (activeWindows.length === 1) folder.classList.add('folder--active');
    else if (activeWindows.length >= 2) folder.classList.add('folder--busy');
  }

  function removeFromActive(win) {
    const i = activeWindows.indexOf(win);
    if (i > -1) activeWindows.splice(i, 1);
  }

  function createToast(msg) {
    if (activeToasts.length >= MAX_TOASTS) removeToast(activeToasts[0]);
    const toast = document.createElement('div');
    toast.className = 'ui-toast';
    toast.innerHTML = msg;
    document.body.appendChild(toast);
    activeToasts.push(toast);
    updateToastPositions();
    requestAnimationFrame(() => toast.classList.add('show'));
    toast._timer = setTimeout(() => removeToast(toast), TOAST_LIFETIME);
  }

  function removeToast(t) {
    clearTimeout(t._timer);
    t.classList.remove('show');
    setTimeout(() => {
      t.remove();
      const i = activeToasts.indexOf(t);
      if (i > -1) activeToasts.splice(i, 1);
      updateToastPositions();
    }, 350);
  }

  function updateToastPositions() {
    activeToasts.forEach((t, i) => { t.style.bottom = `${28 + (i * 84)}px`; });
  }

  function focusWindow(win) {
    win.style.zIndex = ++topZ;
  }

  function makeDraggable(win) {
    const bar = win.querySelector('.window-bar');
    let ox = 0, oy = 0, dragging = false;
    bar.addEventListener('mousedown', e => {
      dragging = true;
      const r = win.getBoundingClientRect();
      win.style.transition = 'none';
      ox = e.clientX - r.left; oy = e.clientY - r.top;
      win.style.zIndex = ++topZ;
    });
    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      win.style.left = `${e.clientX - ox}px`;
      win.style.top = `${e.clientY - oy}px`;
      win.style.transform = 'none';
    });
    document.addEventListener('mouseup', () => { dragging = false; });
  }

  function animateFolder() {
    folder.classList.remove('folder-breathe');
    void folder.offsetWidth;
    folder.classList.add('folder-breathe');
  }

  function setFullMode(win) {
    win.classList.remove('preview');
    win.classList.add('full');
    win.style.left = '50%';
    win.style.top = '50%';
    win.style.transform = 'translate(-50%, -50%) scale(1)';
  }

  // 4. EVENT LISTENERS
  cards.forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      const win = document.getElementById(card.dataset.window);
      openWindow(win);
    });
  });

  windows.forEach(win => {
    win.querySelector('.close').addEventListener('click', e => {
      e.stopPropagation();
      closeAndArchive(win);
    });
    win.querySelector('.window-bar').addEventListener('dblclick', () => {
      if (!win.classList.contains('full')) setFullMode(win);
      else { win.classList.remove('full'); win.classList.add('preview'); }
    });
    win.addEventListener('mousedown', () => { focusWindow(win); });
    makeDraggable(win);
  });

  files.forEach(file => {
    file.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      const data = projectData[file.dataset.project];
      if (!data) return;
      previewTitle.textContent = data.title;
      previewDesc.textContent = data.desc;
      previewMeta.textContent = data.meta;
      if (data.image) {
        previewMedia.innerHTML = `<img src="${data.image}" alt="">`;
        setTimeout(() => previewMedia.querySelector('img')?.classList.add('loaded'), 10);
      }
    });

    file.addEventListener('mouseleave', () => {
      hoverTimeout = setTimeout(() => {
        previewTitle.textContent = "Select a file";
        previewDesc.textContent = "Hover over a project to preview.";
        previewMeta.textContent = "";
        previewMedia.innerHTML = "";
      }, 280);
    });

    // FIXED: Correct double-click logic for project files
    file.addEventListener('dblclick', () => {
      const projectId = file.dataset.project;
      createToast(`<strong>Opening ${projectData[projectId].title}</strong>`);
      setTimeout(() => openProjectWindow(projectId), 400);
    });
  });

  // 5. INITIALIZATION
  requestAnimationFrame(() => { folder.classList.add('wiggle'); });
  setTimeout(() => createToast("System: Workspace Initialized."), 1000);
});