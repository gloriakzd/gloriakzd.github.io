document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.back-card');
  const windows = document.querySelectorAll('.window');
  const folder = document.querySelector('.folder');

  const MAX_WINDOWS = 2;
  const activeWindows = [];
  const minimizedWindows = new Map();

  const toast = document.getElementById('ui-toast');
  const dock = document.getElementById('window-dock');

  let topZ = 100;

  /* ===== FOLDER STATE ===== */
  function updateFolderState() {
    folder.classList.remove('folder--active', 'folder--busy');
    if (activeWindows.length === 1) folder.classList.add('folder--active');
    if (activeWindows.length >= 2) folder.classList.add('folder--busy');
  }

  /* ===== ACTIVE CARD ===== */
  function setActiveCard(targetWinId) {
    cards.forEach(card => {
      card.classList.toggle('active', card.dataset.window === targetWinId);
    });
  }

  /* ===== WINDOW MODE LABEL ===== */
  function updateModeLabel(win, mode) {
    const label = win.querySelector('.window-mode');
    if (!label) return;

    label.textContent =
      mode === 'full'
        ? 'Full view · drag to reposition'
        : 'Preview · double-click to expand';
  }

  /* ===== ANCHORS ===== */
  function getRightAnchor(preview = true) {
    return { left: '56vw', top: '12vh', width: preview ? '600px' : '740px' };
  }

  function getLeftAnchor(preview = true) {
    return { left: '6vw', top: '14vh', width: preview ? '580px' : '720px' };
  }

  function applyAnchor(win, preview = true) {
    const anchor =
      win.dataset.slot === 'right'
        ? getRightAnchor(preview)
        : getLeftAnchor(preview);

    win.style.left = anchor.left;
    win.style.top = anchor.top;
    win.style.width = anchor.width;
  }

  /* ===== CARD CLICK ===== */
  cards.forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      const win = document.getElementById(card.dataset.window);
      if (!win) return;

      if (minimizedWindows.has(win)) {
        restoreFromDock(win);
        setActiveCard(win.id);
        return;
      }

      if (activeWindows.includes(win)) {
        focusWindow(win);
        setActiveCard(win.id);
        return;
      }

      let slotToUse = null;

      if (activeWindows.length >= MAX_WINDOWS) {
        const oldest = activeWindows.shift();
        slotToUse = oldest.dataset.slot;
        animateMinimize(oldest);
        showToast();
      }

      win.dataset.slot = slotToUse ?? (activeWindows.length === 0 ? 'right' : 'left');

      openWindow(win);
      activeWindows.push(win);
      setActiveCard(win.id);
      updateFolderState();
    });
  });

  /* ===== WINDOW SETUP ===== */
  windows.forEach(win => {
    const closeBtn = win.querySelector('.close');
    const bar = win.querySelector('.window-bar');

    closeBtn.addEventListener('click', e => {
      e.stopPropagation();
      win.style.display = 'none';
      removeFromActive(win);
      setActiveCard(null);
      updateFolderState();
    });

    bar.addEventListener('dblclick', () => setFullMode(win));

    win.addEventListener('mousedown', () => {
      win.style.zIndex = ++topZ;
      setActiveCard(win.id);
    });

    makeDraggable(win);
    makeResizable(win);
  });

  /* ===== OPEN ===== */
  function openWindow(win) {
    setPreviewMode(win);

    win.style.display = 'block';
    win.style.opacity = '0';
    applyAnchor(win, true);
    win.style.transform = 'scale(0.96)';
    win.style.zIndex = ++topZ;

    requestAnimationFrame(() => {
      win.style.transition =
        'transform 0.25s ease, opacity 0.25s ease, width 0.25s ease';
      win.style.opacity = '1';
      win.style.transform = 'scale(1)';
    });
  }

  /* ===== PREVIEW / FULL ===== */
  function setPreviewMode(win) {
    win.classList.add('preview');
    win.classList.remove('full');
    applyAnchor(win, true);
    updateModeLabel(win, 'preview');
  }

  function setFullMode(win) {
    win.classList.remove('preview');
    win.classList.add('full');

    win.style.transition = 'width 0.25s ease';
    win.style.width =
      win.dataset.slot === 'right' ? '740px' : '720px';

    updateModeLabel(win, 'full');
  }

  /* ===== MINIMIZE ===== */
  function animateMinimize(win) {
    if (minimizedWindows.has(win)) return;

    win.style.transition =
      'transform 0.35s ease, opacity 0.35s ease';
    win.style.opacity = '0';
    win.style.transform = 'translateY(40px) scale(0.9)';

    setTimeout(() => {
      win.style.display = 'none';
      win.style.opacity = '1';
      win.style.transform = 'none';
      addToDock(win);
      setActiveCard(null);
      updateFolderState();
    }, 350);
  }

  function addToDock(win) {
    const item = document.createElement('div');
    item.className = 'dock-item';

    const title = win.querySelector('.window-bar span');
    item.textContent = title ? title.textContent : 'Window';

    item.addEventListener('click', () => restoreFromDock(win));
    minimizedWindows.set(win, item);
    dock.appendChild(item);
  }

  function restoreFromDock(win) {
    let slotToUse = null;

    if (activeWindows.length >= MAX_WINDOWS) {
      const oldest = activeWindows.shift();
      slotToUse = oldest.dataset.slot;
      animateMinimize(oldest);
      showToast();
    }

    if (slotToUse) win.dataset.slot = slotToUse;

    dock.removeChild(minimizedWindows.get(win));
    minimizedWindows.delete(win);

    openWindow(win);
    activeWindows.push(win);
    setActiveCard(win.id);
    updateFolderState();
  }

  function focusWindow(win) {
    win.style.zIndex = ++topZ;
  }

  function removeFromActive(win) {
    const i = activeWindows.indexOf(win);
    if (i > -1) activeWindows.splice(i, 1);
  }

  function showToast() {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3200);
  }

  /* ===== DRAG ===== */
  function makeDraggable(win) {
    const bar = win.querySelector('.window-bar');
    let offsetX = 0;
    let offsetY = 0;
    let dragging = false;

    bar.addEventListener('mousedown', e => {
      dragging = true;
      const rect = win.getBoundingClientRect();

      win.style.transition = 'none';
      win.style.left = `${rect.left}px`;
      win.style.top = `${rect.top}px`;
      win.style.transform = 'none';

      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      win.style.zIndex = ++topZ;
    });

    document.addEventListener('mousemove', e => {
      if (!dragging) return;
      win.style.left = `${e.clientX - offsetX}px`;
      win.style.top = `${e.clientY - offsetY}px`;
    });

    document.addEventListener('mouseup', () => {
      dragging = false;
      win.style.transition = '';
    });
  }

  /* ===== RESIZE ===== */
  function makeResizable(win) {
    const handle = win.querySelector('.resize-handle');
    if (!handle) return;
    handle.addEventListener('mousedown', () => setFullMode(win));
  }

  /* ===== TAB WIGGLE (ONCE) ===== */
  requestAnimationFrame(() => {
    folder.classList.add('wiggle');
    setTimeout(() => folder.classList.remove('wiggle'), 700);
  });
});
