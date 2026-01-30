const cards = document.querySelectorAll('.back-card');
const windows = document.querySelectorAll('.window');

cards.forEach(card => {
  card.addEventListener('click', () => {
    const target = card.classList.contains('card-one')
      ? 'work-window'
      : 'about-window';

    const win = document.getElementById(target);
    win.style.display = 'block';
  });
});

windows.forEach(win => {
  win.querySelector('.close').addEventListener('click', () => {
    win.style.display = 'none';
  });
});
