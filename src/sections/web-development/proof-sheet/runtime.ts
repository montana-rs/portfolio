import { removeBackground } from './engine/removebg';
import { dither, imageLayer } from './engine/dither';
import { regions } from './engine/regions';
import type { RegionsResult } from './engine/regions';
import { compose } from './grammar/compose';

const MAX_SEED = 0xffffffff;
const MAX_FILE_BYTES = 160_000_000;

type RuntimeRoot = HTMLElement & { dataset: DOMStringMap };

export function initProofSheet(): void {
  const start = () => {
    const root = document.querySelector<RuntimeRoot>('[data-proof-sheet]');
    if (!root || root.dataset.ready) return;
    root.dataset.ready = 'true';
    setup(root);
  };
  start();
  document.addEventListener('astro:page-load', start);
}

function setup(root: RuntimeRoot): void {
  const drop = required<HTMLDivElement>(root, '[data-proof-drop]');
  const fileInput = required<HTMLInputElement>(root, '[data-proof-file]');
  const choose = required<HTMLButtonElement>(root, '[data-proof-choose]');
  const seedInput = required<HTMLInputElement>(root, '[data-proof-seed]');
  const recompose = required<HTMLButtonElement>(root, '[data-proof-recompose]');
  const status = required<HTMLParagraphElement>(root, '[data-proof-status]');
  const result = required<HTMLDivElement>(root, '[data-proof-result]');
  let source: HTMLImageElement | null = null;
  let seed = hashSeed('proof-sheet');
  let renderToken = 0;
  let renderController: AbortController | null = null;
  let previewUrl: string | null = null;
  let maskedSource: HTMLImageElement | null = null;
  let maskedCache: HTMLCanvasElement | null = null;
  let detectionCache: { seed: number; result: RegionsResult } | null = null;

  seedInput.value = String(seed);
  const report = (message: string) => { status.textContent = message; };
  const currentReport = (token: number) => (message: string) => { if (token === renderToken) report(message); };

  choose.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => { const file = fileInput.files?.[0]; if (file) void acceptFile(file); fileInput.value = ''; });
  drop.addEventListener('dragover', (event) => { event.preventDefault(); drop.classList.add('is-armed'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('is-armed'));
  drop.addEventListener('drop', (event) => { event.preventDefault(); drop.classList.remove('is-armed'); const file = event.dataTransfer?.files?.[0]; if (file) void acceptFile(file); });
  const onPaste = (event: ClipboardEvent) => { if (!document.contains(root)) return; const item = [...(event.clipboardData?.items ?? [])].find((entry) => entry.type.startsWith('image/')); const file = item?.getAsFile(); if (file) void acceptFile(file); };
  document.addEventListener('paste', onPaste);
  seedInput.addEventListener('change', () => {
    const normalized = normalizeSeed(seedInput.value);
    if (normalized === null) { report('ERROR // SEED MUST BE AN INTEGER FROM 0 TO 4294967295'); seedInput.value = String(seed); return; }
    seed = normalized; seedInput.value = String(seed); if (source) void render();
  });
  recompose.addEventListener('click', () => { seed = hashSeed(`${seed}:fork`); seedInput.value = String(seed); if (source) void render(); });

  async function acceptFile(file: File): Promise<void> {
    if (!file.type.startsWith('image/')) { report('ERROR // IMAGE INPUT REQUIRED'); return; }
    if (file.size > MAX_FILE_BYTES) { report('ERROR // IMAGE FILE EXCEEDS 160MB LIMIT'); return; }
    renderController?.abort(); renderController = new AbortController();
    report('READING // LOCAL IMAGE');
    try {
      const url = URL.createObjectURL(file);
      try {
        const image = new Image(); image.src = url; await image.decode();
        if (!image.naturalWidth || !image.naturalHeight) throw new Error('IMAGE DECODED WITH NO DIMENSIONS');
        source = image; maskedSource = null; maskedCache = null; detectionCache = null; seed = hashSeed(`${image.naturalWidth}:${image.naturalHeight}:${file.size}`); seedInput.value = String(seed); recompose.disabled = false;
      } finally { URL.revokeObjectURL(url); }
      await render();
    } catch (error) { if (!isAbort(error)) report(`ERROR // ${error instanceof Error ? error.message : 'IMAGE DECODE FAILED'}`); }
  }

  async function render(): Promise<void> {
    if (!source) return;
    const token = ++renderToken;
    renderController?.abort();
    const controller = new AbortController(); renderController = controller;
    const reportCurrent = currentReport(token);
    const stale = () => { if (controller.signal.aborted || token !== renderToken) throw new DOMException('Render superseded', 'AbortError'); };
    result.replaceChildren();
    drop.classList.add('is-working');
    try {
      const masked = source === maskedSource && maskedCache ? maskedCache : await removeBackground(source, reportCurrent);
      if (source !== maskedSource) { maskedSource = source; maskedCache = masked; detectionCache = null; }
      stale();
      const detection = detectionCache?.seed === seed
        ? detectionCache.result
        : await regions(masked, seed, reportCurrent, controller.signal);
      detectionCache = { seed, result: detection };
      stale();
      const labels = [...new Set(detection.regions.map((region) => region.label))].slice(0, 3);
      const layer = imageLayer(masked, 1580, 1050);
      reportCurrent('DITHER // kit Recipe + USER_NORMALIZE 2/98 on image layer');
      const dithered = dither(layer, seed);
      reportCurrent('COMPOSE // crisp type + callouts over dithered image');
      const poster = await compose(dithered, labels, detection.regions, seed, { width: masked.width, height: masked.height }, !detection.detectorAvailable);
      stale();
      const blob = await new Promise<Blob>((resolve, reject) => poster.toBlob((value) => value ? resolve(value) : reject(new Error('PNG ENCODE FAILED')), 'image/png'));
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(blob);
      const image = document.createElement('img'); image.src = previewUrl; image.alt = 'Generated 2000 by 2000 Proof Sheet';
      const download = document.createElement('a'); download.className = 'proof-tool__download'; download.download = `proof-sheet-${seed}.png`; download.href = previewUrl; download.textContent = 'DOWNLOAD 2000PX PNG';
      result.replaceChildren(image, download);
      const timing = detection.timings ? ` // ${detection.timings.backend.toUpperCase()} // LOAD ${detection.timings.modelLoadMs}MS // INFERENCE ${detection.timings.inferenceMs}MS // ${detection.timings.vocabularySize} QUERIES` : '';
      if (detection.detectorAvailable && detection.regions.length) reportCurrent(`COMPLETE // OWLv2 DETECTION RETAINED${timing}`);
      else if (detection.detectorAvailable) reportCurrent(`COMPLETE // OWLv2 ZERO DETECTIONS${timing}`);
      else if (detection.error?.startsWith('OWLv2 TIMEOUT')) reportCurrent(`OWLv2 TIMEOUT // GEOMETRY FALLBACK${timing}`);
      else reportCurrent(`DETECTOR UNAVAILABLE // GEOMETRY FALLBACK${detection.error ? ` // ${detection.error}` : ''}`);
    } catch (error) {
      if (isAbort(error)) return;
      reportCurrent(`ERROR // ${error instanceof Error ? error.message : 'LOCAL PIPELINE HALTED'}`);
    } finally { if (token === renderToken) drop.classList.remove('is-working'); }
  }
}

function required<T extends Element>(root: Element, selector: string): T { const element = root.querySelector<T>(selector); if (!element) throw new Error(`Proof Sheet control missing: ${selector}`); return element; }
function isAbort(error: unknown): boolean { return error instanceof DOMException && error.name === 'AbortError'; }
function normalizeSeed(value: string): number | null { if (!/^\d+$/.test(value.trim())) return null; const number = Number(value); return Number.isSafeInteger(number) && number >= 0 && number <= MAX_SEED ? number : null; }
export function hashSeed(input: string): number { let hash = 2166136261; for (let index = 0; index < input.length; index++) hash = Math.imul(hash ^ input.charCodeAt(index), 16777619); return hash >>> 0; }
