import { compositeGrain } from '../engine/grain';
import type { Region } from '../engine/regions';

export async function compose(
  source: HTMLCanvasElement,
  labels: string[],
  regions: Region[],
  seed: number,
  sourceSize: { width: number; height: number },
  detectorUnavailable: boolean,
): Promise<HTMLCanvasElement> {
  const poster = document.createElement('canvas'); poster.width = 2000; poster.height = 2000;
  const context = poster.getContext('2d');
  if (!context) throw new Error('COMPOSITE CANVAS CONTEXT UNAVAILABLE');
  const mono = getComputedStyle(document.documentElement).getPropertyValue('--font-micro').trim() || '"JetBrains Mono", monospace';
  context.clearRect(0, 0, 2000, 2000);
  context.fillStyle = '#111'; context.fillRect(90, 90, 1820, 1820);
  context.fillStyle = '#d8d5cb'; context.fillRect(128, 128, 1744, 1744);
  context.save();
  context.beginPath(); context.rect(90, 90, 1820, 1820); context.clip();
  await compositeGrain(context);
  context.restore();
  context.save(); context.globalAlpha = 0.92; context.drawImage(source, 210, 340, 1580, 1050); context.restore();
  context.strokeStyle = '#111'; context.lineWidth = 5; context.strokeRect(210, 340, 1580, 1050);
  context.fillStyle = '#111'; context.font = `bold 72px ${mono}`; context.fillText('PROOF SHEET', 210, 245);
  context.font = `24px ${mono}`; context.fillText('TECHNICAL DOCUMENT // REMOTE MODEL / IMAGE LOCAL', 214, 290);
  context.font = `22px ${mono}`;
  context.fillText(`CATALOGUE // ${String(seed >>> 0).padStart(10, '0')}`, 210, 1510);
  context.fillText(`CLASS // ${labels.join(' / ').toUpperCase() || 'UNCLASSIFIED'}`, 210, 1550);
  context.fillText(`STATUS // ${detectorUnavailable ? 'DETECTOR UNAVAILABLE / GEOMETRY FALLBACK' : 'PLAUSIBLE / UNVERIFIED / RETAINED'}`, 210, 1590);
  if (detectorUnavailable) { context.fillStyle = '#b21e16'; context.font = `bold 18px ${mono}`; context.fillText('> DETECTOR UNAVAILABLE // GEOMETRY FALLBACK', 210, 1630); }
  context.fillStyle = '#111'; context.font = `12px ${mono}`; context.fillText('> IMAGE STAYS IN BROWSER // MODEL WEIGHTS DOWNLOAD REMOTELY ON FIRST USE', 210, 1690);
  regions.forEach((region, index) => {
    const x = clamp(210 + (region.x / sourceSize.width) * 1580, 210, 1750);
    const y = clamp(340 + (region.y / sourceSize.height) * 1050, 340, 1350);
    const width = clamp((region.width / sourceSize.width) * 1580, 40, 1790 - x);
    const height = clamp((region.height / sourceSize.height) * 1050, 40, 1390 - y);
    context.strokeStyle = '#b21e16'; context.lineWidth = 4; context.strokeRect(x, y, width, height);
    context.fillStyle = '#b21e16'; context.font = `bold 18px ${mono}`;
    const text = `${String(index + 1).padStart(2, '0')} // ${region.label.toUpperCase()} // ${region.score.toFixed(3)}`;
    const chipX = clamp(x + 8, 214, 1780); const chipY = Math.max(y - 30, 300); const metrics = context.measureText(text);
    context.fillStyle = '#d8d5cb'; context.fillRect(chipX, chipY, Math.min(metrics.width + 12, 1790 - chipX), 28);
    context.fillStyle = '#b21e16'; context.fillText(text.slice(0, 70), chipX + 4, chipY + 19);
  });
  context.fillStyle = '#111'; context.font = `12px ${mono}`; drawBarcode(context, seed, 210, 1740, 1580, 78); context.fillText('PROOF SHEET // 00 / 00', 1540, 1850);
  return poster;
}

function clamp(value: number, min: number, max: number): number { return Math.min(max, Math.max(min, value)); }

function drawBarcode(context: CanvasRenderingContext2D, seed: number, x: number, y: number, width: number, height: number) {
  let state = seed >>> 0;
  const next = () => { state = Math.imul(state ^ (state >>> 16), 2246822519) >>> 0; return state; };
  context.fillStyle = '#111';
  for (let cursor = x; cursor < x + width;) { const bar = 2 + (next() % 12); context.fillRect(cursor, y, bar, height); cursor += bar + 2 + (next() % 8); }
}
