const background = document.querySelector('[data-background]');
const bits = document.querySelector('[data-bits]');
const input = document.querySelector('[data-input]');
const line = document.querySelector('.sigil__line');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const randomizeBit = (bit) => bit.classList.toggle('is-on', Math.random() > .48);

for (let index = 0; index < 108; index += 1) {
  const backgroundBit = document.createElement('b');
  randomizeBit(backgroundBit);
  background.append(backgroundBit);
  if (!reducedMotion) {
    window.setTimeout(() => window.setInterval(() => randomizeBit(backgroundBit), 1000), Math.random() * 1000);
  }
}

for (let index = 0; index < 108; index += 1) {
  const bit = document.createElement('b');
  randomizeBit(bit);
  bit.style.setProperty('--bit-duration', `${(2.1 + Math.random() * 3.8).toFixed(2)}s`);
  bit.style.setProperty('--bit-delay', `${(-Math.random() * 5.8).toFixed(2)}s`);
  bits.append(bit);
  if (!reducedMotion) {
    window.setTimeout(() => window.setInterval(() => randomizeBit(bit), 1000), Math.random() * 1000);
  }
}

line.style.setProperty('--flicker-duration', `${(7.5 + Math.random() * 5.5).toFixed(2)}s`);
line.style.setProperty('--flicker-delay', `${(-Math.random() * 5).toFixed(2)}s`);

if (reducedMotion) {
  input.textContent = 'INPUT';
} else {
  let index = 0;
  const typeNext = () => {
    input.textContent = 'INPUT'.slice(0, index);
    index += 1;
    if (index <= 5) window.setTimeout(typeNext, 100);
  };
  window.setTimeout(typeNext, 900);
}
