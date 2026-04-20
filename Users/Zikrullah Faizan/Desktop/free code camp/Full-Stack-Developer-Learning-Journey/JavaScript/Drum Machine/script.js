// Drum Machine functionality
const padData = [
  { key: 'Q', id: 'Heater-1', desc: 'Heater 1', src: 'https://cdn.freecodecamp.org/curriculum/drum/Heater-1.mp3' },
  { key: 'W', id: 'Heater-2', desc: 'Heater 2', src: 'https://cdn.freecodecamp.org/curriculum/drum/Heater-2.mp3' },
  { key: 'E', id: 'Heater-3', desc: 'Heater 3', src: 'https://cdn.freecodecamp.org/curriculum/drum/Heater-3.mp3' },
  { key: 'A', id: 'Heater-4', desc: 'Heater 4', src: 'https://cdn.freecodecamp.org/curriculum/drum/Heater-4_1.mp3' },
  { key: 'S', id: 'Clap', desc: 'Clap', src: 'https://cdn.freecodecamp.org/curriculum/drum/Heater-6.mp3' },
  { key: 'D', id: 'Open-HH', desc: 'Open-HH', src: 'https://cdn.freecodecamp.org/curriculum/drum/Dsc_Oh.mp3' },
  { key: 'Z', id: "Kick-n-Hat", desc: "Kick-n'-Hat", src: 'https://cdn.freecodecamp.org/curriculum/drum/Kick_n_Hat.mp3' },
  { key: 'X', id: 'Kick', desc: 'Kick', src: 'https://cdn.freecodecamp.org/curriculum/drum/RP4_KICK_1.mp3' },
  { key: 'C', id: 'Closed-HH', desc: 'Closed-HH', src: 'https://cdn.freecodecamp.org/curriculum/drum/Cev_H2.mp3' }
];

const display = document.getElementById('display');
const pads = document.querySelectorAll('.drum-pad');

function playSound(key) {
  const pad = padData.find(p => p.key === key);
  if (!pad) return;
  const audio = document.getElementById(key);
  if (audio) {
    audio.currentTime = 0;
    audio.play();
    display.innerText = pad.desc;
    // Visual feedback
    const padBtn = document.getElementById(pad.id);
    padBtn.classList.add('active');
    setTimeout(() => padBtn.classList.remove('active'), 150);
  }
}

pads.forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.innerText.trim();
    playSound(key);
  });
});

document.addEventListener('keydown', (e) => {
  const key = e.key.toUpperCase();
  if (padData.some(p => p.key === key)) {
    playSound(key);
  }
});
