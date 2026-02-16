document.addEventListener('DOMContentLoaded', () => {

  const cards = document.querySelectorAll('.back-card');
  const windows = document.querySelectorAll('.window');
  const folder = document.querySelector('.folder');
  const cardStack = document.querySelector('.card-stack');

  const MAX_WINDOWS = 2;
  const activeWindows = [];
  const minimizedWindows = new Map();

  let topZ = 100;

  /* ==============================
     🔔 STACKED TOAST SYSTEM
  ============================== */

  const activeToasts = [];
  const MAX_TOASTS = 3;
  const TOAST_LIFETIME = 5000;

  function createToast(message) {
    if (activeToasts.length >= MAX_TOASTS) {
      removeToast(activeToasts[0]);
    }

    const toast = document.createElement('div');
    toast.className = 'ui-toast';
    toast.innerHTML = message;

    document.body.appendChild(toast);
    activeToasts.push(toast);

    updateToastPositions();

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    toast._timer = setTimeout(() => {
      removeToast(toast);
    }, TOAST_LIFETIME);
  }

  function removeToast(toast) {
    if (!toast) return;

    clearTimeout(toast._timer);
    toast.classList.remove('show');

    setTimeout(() => {
      toast.remove();
      const i = activeToasts.indexOf(toast);
      if (i > -1) activeToasts.splice(i, 1);
      updateToastPositions();
    }, 350);
  }

  function updateToastPositions() {
    activeToasts.forEach((toast, i) => {
      toast.style.bottom = `${28 + (i * 84)}px`;
    });
  }

  function dismissToastsEarly() {
    [...activeToasts].forEach(removeToast);
  }

  /* ==============================
     FOLDER + CARD STACK STATE
  ============================== */
  function updateFolderState() {
    folder.classList.remove('folder--active', 'folder--busy');

    if (activeWindows.length === 1) {
      folder.classList.add('folder--active');
    }

    if (activeWindows.length >= 2) {
      folder.classList.add('folder--busy');
    }
  }
  function animateFolder() {
    folder.classList.remove('folder-breathe');
    void folder.offsetWidth; // force restart animation
    folder.classList.add('folder-breathe');

  /* ⭐ NEW: MICRO DEPTH SHIFT */
  if (activeWindows.length > 0) {
    cardStack?.classList.add('depth-shift');
  } else {
    cardStack?.classList.remove('depth-shift');
  }
}

  /* ==============================
     ACTIVE CARD
  ============================== */

  function setActiveCard(targetWinId) {
    cards.forEach(card => {
      card.classList.toggle('active', card.dataset.window === targetWinId);
    });
  }

  /* ==============================
     WINDOW MODE LABEL
  ============================== */

  function updateModeLabel(win, mode) {
    const label = win.querySelector('.window-mode');
    if (!label) return;

    label.textContent =
      mode === 'full'
        ? 'Full view · drag to reposition'
        : 'Preview · double-click to expand';
  }

  /* ==============================
     ANCHORS
  ============================== */

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

  /* ==============================
     REPLACE WINDOW
  ============================== */

  function replaceWindow(oldWin, newWin) {

    const slot = oldWin.dataset.slot;

    oldWin.style.transition = 'transform .28s ease, opacity .28s ease';
    oldWin.style.transform = 'translateY(-12px) scale(.98)';
    oldWin.style.opacity = '0';

    setTimeout(() => {
      oldWin.style.display = 'none';
      oldWin.style.opacity = '1';
      oldWin.style.transform = 'none';

      addToDock(oldWin);
      removeFromActive(oldWin);

      newWin.dataset.slot = slot;
      openWindow(newWin);
      activeWindows.push(newWin);

      setActiveCard(newWin.id);
      updateFolderState();

    }, 280);
  }

  /* ==============================
     CARD CLICK
  ============================== */

  cards.forEach(card => {
    card.addEventListener('click', e => {
      e.preventDefault();
      dismissToastsEarly();

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

      if (activeWindows.length >= MAX_WINDOWS) {
        const oldest = activeWindows[0];
        replaceWindow(oldest, win);

        createToast(`
          <strong>Your screen’s getting crowded.</strong><br>
          Let’s give one window a break.
        `);

        return;
      }

      win.dataset.slot =
        activeWindows.length === 0 ? 'right' : 'left';

      openWindow(win);
      activeWindows.push(win);
      setActiveCard(win.id);
      updateFolderState();
      animateFolder(); // ⭐ NEW

    });
  });

/* ==============================
   WINDOW SETUP
============================== */

windows.forEach(win => {

  const closeBtn = win.querySelector('.close');
  const bar = win.querySelector('.window-bar');

  closeBtn.addEventListener('click', e => {
    e.stopPropagation();
    dismissToastsEarly();
    animateMinimize(win);
    setActiveCard(null);
  });

  bar.addEventListener('dblclick', () => {
    if (!win.classList.contains('full')) {
      setFullMode(win);
    }
  });

  win.addEventListener('mousedown', () => {
    win.style.zIndex = ++topZ;
    setActiveCard(win.id);
  });

  makeDraggable(win);
  makeResizable(win);
});

/* ==============================
   OPEN WINDOW
============================== */

function openWindow(win) {

  win.classList.remove('full');
  setPreviewMode(win);

  if (minimizedWindows.has(win)) {
    minimizedWindows.get(win).remove();
    minimizedWindows.delete(win);
  }

  win.style.display = 'block';
  win.style.opacity = '0';
  applyAnchor(win, true);
  win.style.transform = 'scale(.98)';
  win.style.zIndex = ++topZ;

  requestAnimationFrame(() => {
    win.style.transition = 'transform .32s cubic-bezier(.2,.8,.2,1), opacity .32s ease, width .32s ease';
    win.style.opacity = '1';
    win.style.transform = 'scale(1)';
  });
}

/* ==============================
   PREVIEW / FULL
============================== */

function setPreviewMode(win) {
  win.classList.add('preview');
  win.classList.remove('full');
  applyAnchor(win, true);
  updateModeLabel(win, 'preview');
}

/* ⭐⭐⭐ FULL FOCUS MODE ⭐⭐⭐ */

function setFullMode(win) {

  activeWindows
    .filter(w => w !== win)
    .forEach(w => {
      w.style.transition = 'opacity .3s ease, transform .3s ease';
      w.style.opacity = '0';
      w.style.transform = 'scale(.96)';
      setTimeout(() => {
        w.style.display = 'none';
      }, 300);
    });

  activeWindows.length = 0;
  activeWindows.push(win);

  win.classList.remove('preview');
  win.classList.add('full');

  win.style.transition =
    'left .45s ease, top .45s ease, width .45s ease, height .45s ease, transform .45s ease';

  win.style.left = '50%';
  win.style.top = '50%';
  win.style.transform = 'translate(-50%, -50%) scale(1)';
  win.style.width = 'min(880px, 92vw)';
  win.style.height = 'min(78vh, 780px)';
  win.style.zIndex = ++topZ;

  updateModeLabel(win, 'full');
  updateFolderState();
}


/* ==============================
   MINIMIZE
============================== */

function animateMinimize(win) {

  if (minimizedWindows.has(win)) return;

  win.style.transition = 'transform .30s ease, opacity .30s ease';
  win.style.opacity = '0';
  win.style.transform = 'translateY(40px) scale(.92)';

  setTimeout(() => {
    win.style.display = 'none';
    win.style.opacity = '1';
    win.style.transform = 'none';

    addToDock(win);
    removeFromActive(win);
    updateFolderState();
  }, 300);
}

function addToDock(win) {

  if (minimizedWindows.has(win)) return;

  const item = document.createElement('div');
  item.className = 'dock-item';

  const title = win.querySelector('.window-title');
  item.textContent = title ? title.textContent : 'Window';

  item.addEventListener('click', () => restoreFromDock(win));

  minimizedWindows.set(win, item);
  document.getElementById('window-dock').appendChild(item);
}

function restoreFromDock(win) {

  if (activeWindows.length >= MAX_WINDOWS) {
    const oldest = activeWindows[0];
    replaceWindow(oldest, win);

    createToast(`
        <strong>Your screen’s getting crowded.</strong><br>
        Let’s give one window a break.
      `);

    return;
  }

  minimizedWindows.get(win).remove();
  minimizedWindows.delete(win);

  win.dataset.slot =
    activeWindows.length === 0 ? 'right' : 'left';

  openWindow(win);
  activeWindows.push(win);
  setActiveCard(win.id);
  updateFolderState();
}

/* ==============================
   FOCUS PULSE
============================== */

function focusWindow(win) {

  win.style.zIndex = ++topZ;

  /* restart animation cleanly */
  win.classList.remove('focus-pulse');
  void win.offsetWidth;
  win.classList.add('focus-pulse');

  /* ⭐ restore soft float movement */
  win.style.transition = 'transform .32s cubic-bezier(.2,.8,.2,1)';
  win.style.transform = 'scale(1.02) translateY(-6px)';

  setTimeout(() => {
    win.style.transform = 'scale(1) translateY(0)';
  }, 180);
}


function removeFromActive(win) {
  const i = activeWindows.indexOf(win);
  if (i > -1) activeWindows.splice(i, 1);
}

/* ==============================
   DRAG
============================== */

function makeDraggable(win) {
  const bar = win.querySelector('.window-bar');
  let offsetX = 0, offsetY = 0, dragging = false;

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

/* ==============================
   RESIZE
============================== */

function makeResizable(win) {
  const handle = win.querySelector('.resize-handle');
  if (!handle) return;
  handle.addEventListener('mousedown', () => setFullMode(win));
}

/* ==============================
   FOLDER WIGGLE
============================== */

requestAnimationFrame(() => {
  folder.classList.add('wiggle');
  setTimeout(() => folder.classList.remove('wiggle'), 700);
});

});


/* ==============================
   Fscroll inside the window = sections gently appear.
============================== */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('show');
    }
  });
},{
  threshold: 0.15
});

document.querySelectorAll('.reveal').forEach(el=>{
  observer.observe(el);
});
