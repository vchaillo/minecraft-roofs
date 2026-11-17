import { paintScenery } from './scenery.mjs?v=seasons';

const storageKey = 'roofs.appearance';
const seasons = ['spring', 'summer', 'autumn', 'winter'];
const times = ['day', 'night'];

export function setupAppearance(onChange) {
  const profile = document.querySelector('.appearance');
  const toggle = document.querySelector('#appearance-toggle');
  const menu = document.querySelector('#appearance-menu');
  const canvas = document.querySelector('#scenery');
  let saved;
  try {
    saved = JSON.parse(localStorage.getItem(storageKey));
  } catch {}
  const state = {
    season: seasons.includes(saved?.season) ? saved.season : 'autumn',
    time: times.includes(saved?.time) ? saved.time : 'day',
  };

  function render() {
    paintScenery(canvas, state.season, state.time, window.innerWidth / Math.max(1, window.innerHeight));
    document.documentElement.dataset.time = state.time;
    onChange();
  }

  for (const input of menu.querySelectorAll('input')) {
    input.checked = state[input.name] === input.value;
    input.addEventListener('change', () => {
      state[input.name] = input.value;
      render();
      try {
        localStorage.setItem(storageKey, JSON.stringify(state));
      } catch {}
    });
  }

  function setOpen(open) {
    menu.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', () => setOpen(menu.hidden));
  document.addEventListener('click', event => {
    if (!menu.hidden && !profile.contains(event.target)) setOpen(false);
  });
  document.addEventListener('focusin', event => {
    if (!menu.hidden && !profile.contains(event.target)) setOpen(false);
  });
  document.addEventListener('keydown', event => {
    if (menu.hidden || event.key !== 'Escape') return;
    event.preventDefault();
    toggle.focus();
    setOpen(false);
  });

  let frame;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(render);
  });
  render();
}
