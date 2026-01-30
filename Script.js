document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.back-card');
    const windows = document.querySelectorAll('.window');

    let topZ = 100;

    // ---- OPEN WINDOW ----
    cards.forEach(card => {
        card.addEventListener('click', e => {
            e.preventDefault();

            const targetId = card.dataset.window;
            const win = document.getElementById(targetId);
            if (!win) return;

            win.style.display = 'block';

            // position near mouse
            win.style.left = `${e.clientX - 100}px`;
            win.style.top = `${e.clientY - 40}px`;

            win.style.zIndex = ++topZ;
        });
    });

    // ---- CLOSE WINDOW ----
    windows.forEach(win => {
        const closeBtn = win.querySelector('.close');
        closeBtn.addEventListener('click', () => {
            win.style.display = 'none';
        });

        win.addEventListener('mousedown', () => {
            win.style.zIndex = ++topZ;
        });

        makeDraggable(win);
        makeResizable(win);
    });

    // ---- DRAG ----
    function makeDraggable(win) {
        const bar = win.querySelector('.window-bar');
        let offsetX = 0;
        let offsetY = 0;
        let dragging = false;

        bar.addEventListener('mousedown', e => {
            dragging = true;
            offsetX = e.clientX - win.offsetLeft;
            offsetY = e.clientY - win.offsetTop;
            win.style.zIndex = ++topZ;
        });

        document.addEventListener('mousemove', e => {
            if (!dragging) return;
            win.style.left = `${e.clientX - offsetX}px`;
            win.style.top = `${e.clientY - offsetY}px`;
        });

        document.addEventListener('mouseup', () => {
            dragging = false;
        });
    }

    // ---- RESIZE (POSITION-AWARE BOUNDS) ----
    function makeResizable(win) {
        const handle = win.querySelector('.resize-handle');
        if (!handle) return;

        let startX, startY, startW, startH;

        const MIN_WIDTH = 320;
        const MIN_HEIGHT = 220;
        const EDGE_MARGIN = 24;

        handle.addEventListener('mousedown', e => {
            e.preventDefault();

            startX = e.clientX;
            startY = e.clientY;
            startW = win.offsetWidth;
            startH = win.offsetHeight;

            const rect = win.getBoundingClientRect();

            const MAX_WIDTH =
                window.innerWidth - rect.left - EDGE_MARGIN;

            const MAX_HEIGHT =
                window.innerHeight - rect.top - EDGE_MARGIN;

            function resize(e) {
                let newW = startW + (e.clientX - startX);
                let newH = startH + (e.clientY - startY);

                newW = Math.max(MIN_WIDTH, Math.min(newW, MAX_WIDTH));
                newH = Math.max(MIN_HEIGHT, Math.min(newH, MAX_HEIGHT));

                win.style.width = newW + 'px';
                win.style.height = newH + 'px';
            }

            function stop() {
                document.removeEventListener('mousemove', resize);
                document.removeEventListener('mouseup', stop);
            }

            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stop);
        });
    }
});
