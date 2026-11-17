const soundKey = 'roofs.menu-click';
let soundUrl;
try { soundUrl = localStorage.getItem(soundKey); } catch {}
let context;
let sample;
let lastClick = -Infinity;

function makeClick(audio) {
  const buffer = audio.createBuffer(1, Math.round(audio.sampleRate * .065), audio.sampleRate);
  const data = buffer.getChannelData(0);
  let seed = 73;
  let previous = 0;
  for (let i = 0; i < data.length; i++) {
    const t = i / audio.sampleRate;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const noise = seed / 2147483648 - 1;
    const attack = Math.min(1, t * 1800);
    const rebound = t > .016 ? .34 * Math.exp(-(t - .016) * 230) : 0;
    data[i] = (noise - previous * .63) * (attack * Math.exp(-t * 240) + rebound) * .31
      + Math.sin(t * Math.PI * 2 * 620) * Math.exp(-t * 190) * attack * .16;
    previous = noise;
  }
  return buffer;
}

function playClick() {
  if (performance.now() - lastClick < 30) return;
  lastClick = performance.now();
  if (soundUrl) {
    const audio = new Audio(soundUrl);
    audio.volume = .25;
    void audio.play().catch(() => {});
    return;
  }
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    context ??= new AudioContext();
    if (context.state === 'suspended') void context.resume().catch(() => {});
    sample ??= makeClick(context);
    const source = context.createBufferSource();
    source.buffer = sample;
    source.connect(context.destination);
    source.start();
  } catch {
    // Audio availability should not affect the controls.
  }
}

export function setupMenuSound() {
  document.addEventListener('click', event => {
    if (event.target.closest?.('button:not(:disabled), input[type=radio], input[type=checkbox]')) playClick();
  }, { capture: true });

  const fileInput = document.querySelector('#click-sound');
  const status = document.querySelector('#click-sound-status');
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    try {
      if (file.size > 256 * 1024 || await file.slice(0, 4).text() !== 'OggS') throw new Error();
      const reader = new FileReader();
      const data = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(new Blob([file], { type: 'audio/ogg' }));
      });
      soundUrl = data;
      try { localStorage.setItem(soundKey, data); } catch {}
      status.textContent = 'Son personnalisé chargé.';
      playClick();
    } catch {
      status.textContent = 'Choisissez un fichier OGG de moins de 256 Kio.';
    }
  });
}
