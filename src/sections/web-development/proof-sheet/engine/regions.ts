export type Box = { xmin: number; ymin: number; xmax: number; ymax: number };
type DetectorResult = { label: string; score: number; box: Box };
type DetectorTimings = { backend: 'webgpu' | 'wasm'; modelLoadMs: number; inferenceMs: number; vocabularySize: number };
type WorkerMessage = { type: 'progress'; id: number; message: string } | { type: 'result'; id: number; results: DetectorResult[]; timings: DetectorTimings } | { type: 'error'; id: number; message: string };
export type Region = { label: string; score: number; x: number; y: number; width: number; height: number };
export type RegionsResult = { regions: Region[]; detectorAvailable: boolean; error?: string; timings?: DetectorTimings };
export const DETECTION_TIMEOUT_MS = 90_000;

export const VOCABULARY = [
  ['a computer monitor', 'OBSOLETE INTERFACE'], ['a rock', 'MINERAL FRAGMENT'], ['a person', 'SURVEILLANCE SUBJECT'],
  ['a plant', 'UNKNOWN BOTANICAL SPECIMEN'], ['a machine', 'ARCHIVAL MACHINE'], ['a bowl or cup', 'CERAMIC VESSEL'],
  ['a piece of cloth', 'FOLDED TEXTILE'], ['a hand tool', 'UNCLASSIFIED TOOL'], ['an animal', 'UNREGISTERED FAUNA'],
  ['a bird', 'SIGNAL CARRIER'], ['a dog', 'DOMESTIC SPECIMEN'], ['a mountain', 'ELEVATION ANOMALY'],
  ['a landscape', 'TERRAIN PLATE'], ['a body of water', 'HYDROLOGICAL VOID'], ['a river', 'LIQUID CORRIDOR'],
  ['a building', 'OCCUPIED STRUCTURE'], ['a bridge', 'CROSSING APPARATUS'], ['a road', 'TRANSIT LINE'],
  ['a tree', 'ARBOREAL SIGNAL'], ['a flower', 'BOTANICAL MARKER'],
] as const;

function hashSeed(input: string | number): number {
  const value = String(input);
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return hash >>> 0;
}

// Query the complete vocabulary so smaller or less obvious objects have a
// chance to produce a useful region. The worker remains isolated from the UI;
// its timeout provides the fallback if a browser cannot finish inference.
const queries = VOCABULARY.map(([query]) => query);
const displayLabel = new Map<string, string>(VOCABULARY);
let worker: Worker | null = null;
let nextRequestId = 0;
const pending = new Map<number, { resolve: (value: { results: DetectorResult[]; timings: DetectorTimings }) => void; reject: (reason: Error) => void; report: (message: string) => void }>();

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('./regions.worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (event: MessageEvent<WorkerMessage>) => {
    const request = pending.get(event.data.id);
    if (!request) return;
    if (event.data.type === 'progress') request.report(event.data.message);
    if (event.data.type === 'result') { pending.delete(event.data.id); request.resolve({ results: event.data.results, timings: event.data.timings }); }
    if (event.data.type === 'error') { pending.delete(event.data.id); request.reject(new Error(event.data.message)); }
  };
  worker.onerror = (event) => {
    const error = event.error instanceof Error ? event.error : new Error(event.message || 'OWLv2 WORKER FAILED');
    for (const request of pending.values()) request.reject(error);
    pending.clear(); worker?.terminate(); worker = null;
  };
  return worker;
}

export async function regions(canvas: HTMLCanvasElement, seed: number, report: (message: string) => void, signal: AbortSignal): Promise<RegionsResult> {
  try {
    report('> OWLv2 // REMOTE MODEL MAY DOWNLOAD ON FIRST USE');
    const detection = await detectInWorker(canvas, report, signal);
    const selected = suppressOverlaps(detection.results.sort((a, b) => b.score - a.score), 5 + (hashSeed(seed) % 3))
      .filter((item) => {
        const area = Math.max(0, item.box.xmax - item.box.xmin) * Math.max(0, item.box.ymax - item.box.ymin);
        return area / Math.max(1, canvas.width * canvas.height) < 0.82;
      });
    if (selected.length) return { regions: selected.map((item) => mapBox(item, canvas.width, canvas.height)), detectorAvailable: true, timings: detection.timings };
    report('> OWLv2 // ZERO DETECTIONS // COMPOSING WITHOUT CALLOUTS');
    return { regions: [], detectorAvailable: true, timings: detection.timings };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    const detail = error instanceof Error ? error.message.replace(/\s+/g, ' ').slice(0, 180) : 'UNKNOWN DETECTOR FAILURE';
    report(`> OWLv2 UNAVAILABLE // ${detail} // GEOMETRY FALLBACK`);
    return { regions: fallbackRegions(canvas, seed), detectorAvailable: false, error: detail };
  }
  return { regions: fallbackRegions(canvas, seed), detectorAvailable: false };
}

function detectInWorker(canvas: HTMLCanvasElement, report: (message: string) => void, signal: AbortSignal): Promise<{ results: DetectorResult[]; timings: DetectorTimings }> {
  return new Promise(async (resolve, reject) => {
    const id = ++nextRequestId;
    const timeout = window.setTimeout(() => { pending.delete(id); worker?.terminate(); worker = null; reject(new Error(`OWLv2 TIMEOUT // ${DETECTION_TIMEOUT_MS / 1000}S LIMIT`)); }, DETECTION_TIMEOUT_MS);
    const cancel = () => { window.clearTimeout(timeout); pending.delete(id); worker?.terminate(); worker = null; reject(new DOMException('Render superseded', 'AbortError')); };
    signal.addEventListener('abort', cancel, { once: true });
    try {
      const maxDimension = 512;
      const scale = Math.min(1, maxDimension / Math.max(canvas.width, canvas.height));
      const inferenceCanvas = document.createElement('canvas');
      inferenceCanvas.width = Math.max(1, Math.round(canvas.width * scale));
      inferenceCanvas.height = Math.max(1, Math.round(canvas.height * scale));
      const inferenceContext = inferenceCanvas.getContext('2d');
      if (!inferenceContext) throw new Error('INFERENCE CANVAS CONTEXT UNAVAILABLE');
      inferenceContext.drawImage(canvas, 0, 0, inferenceCanvas.width, inferenceCanvas.height);
      const image = await createImageBitmap(inferenceCanvas);
      if (signal.aborted) { image.close(); return cancel(); }
      pending.set(id, { resolve: (value) => { window.clearTimeout(timeout); signal.removeEventListener('abort', cancel); resolve({ ...value, results: value.results.map((item) => scaleBox(item, 1 / scale)) }); }, reject: (error) => { window.clearTimeout(timeout); signal.removeEventListener('abort', cancel); reject(error); }, report });
      ensureWorker().postMessage({ type: 'detect', id, image, labels: queries }, [image]);
    } catch (error) { window.clearTimeout(timeout); signal.removeEventListener('abort', cancel); reject(new Error(`WORKER CONSTRUCTION // ${error instanceof Error ? error.message : 'IMAGEBITMAP FAILED'}`)); }
  });
}

function scaleBox(item: DetectorResult, scale: number): DetectorResult {
  return { ...item, box: { xmin: item.box.xmin * scale, ymin: item.box.ymin * scale, xmax: item.box.xmax * scale, ymax: item.box.ymax * scale } };
}

function suppressOverlaps(results: DetectorResult[], limit: number): DetectorResult[] {
  const kept: DetectorResult[] = [];
  for (const candidate of results) {
    if (kept.some((existing) => iou(existing.box, candidate.box) > 0.6)) continue;
    kept.push(candidate);
    if (kept.length === limit) break;
  }
  return kept;
}

function iou(a: Box, b: Box): number {
  const x1 = Math.max(a.xmin, b.xmin), y1 = Math.max(a.ymin, b.ymin), x2 = Math.min(a.xmax, b.xmax), y2 = Math.min(a.ymax, b.ymax);
  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const areaA = Math.max(0, a.xmax - a.xmin) * Math.max(0, a.ymax - a.ymin);
  const areaB = Math.max(0, b.xmax - b.xmin) * Math.max(0, b.ymax - b.ymin);
  return intersection / Math.max(1, areaA + areaB - intersection);
}

function mapBox(item: DetectorResult, width: number, height: number): Region {
  const x = Math.max(0, Math.min(width, item.box.xmin));
  const y = Math.max(0, Math.min(height, item.box.ymin));
  const right = Math.max(x, Math.min(width, item.box.xmax));
  const bottom = Math.max(y, Math.min(height, item.box.ymax));
  return { label: displayLabel.get(item.label) ?? item.label.toUpperCase(), score: item.score, x, y, width: right - x, height: bottom - y };
}

function fallbackRegions(canvas: HTMLCanvasElement, seed: number): Region[] {
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return [];
  const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
  let minX = width, minY = height, maxX = 0, maxY = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] > 24) { minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y); }
  if (maxX <= minX || maxY <= minY) return [];
  const box = { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  const labels = VOCABULARY.map(([, label]) => label);
  return Array.from({ length: 1 + (hashSeed(seed) % 4) }, (_, index) => ({ label: labels[hashSeed(seed + index) % labels.length], score: 0, x: box.x + box.width * index * 0.08, y: box.y + box.height * index * 0.08, width: box.width * (0.72 - index * 0.08), height: box.height * (0.72 - index * 0.08) }));
}
