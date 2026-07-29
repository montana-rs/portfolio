import wasmUrl from '../assets/ort-wasm-simd-threaded.jsep.wasm?url';
import wasmModuleUrl from '../assets/ort-wasm-simd-threaded.jsep.mjs?url';

type Box = { xmin: number; ymin: number; xmax: number; ymax: number };
type DetectorResult = { label: string; score: number; box: Box };
type Request = { type: 'detect'; id: number; image: ImageBitmap; labels: string[] };

type DetectorImage = { width: number; height: number };
type LoadedDetector = { detect: (image: DetectorImage, labels: string[]) => Promise<DetectorResult[]>; RawImage: { fromCanvas: (canvas: OffscreenCanvas) => DetectorImage }; backend: 'webgpu' | 'wasm'; modelLoadMs: number };
type Timings = { backend: 'webgpu' | 'wasm'; modelLoadMs: number; inferenceMs: number; vocabularySize: number };
let detectorPromise: Promise<LoadedDetector> | null = null;
let detectorRequestId = 0;

async function loadDetector(requestId: number): Promise<LoadedDetector> {
  if (!detectorPromise) detectorPromise = (async () => {
    const modelStarted = performance.now();
    const { env, pipeline: createPipeline, RawImage } = await import('https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2');
    env.allowRemoteModels = true;
    env.allowLocalModels = false;
    // Keep both ONNX runtime artifacts in the same emitted asset directory. The
    // runtime may load the JSEP module before it requests the WASM binary.
    void wasmModuleUrl;
    const resolvedWasmUrl = new URL(wasmUrl, self.location.origin);
    env.backends.onnx.wasm.wasmPaths = new URL('.', resolvedWasmUrl).href;
    let adapter: GPUAdapter | null = null;
    try { adapter = 'gpu' in navigator ? await navigator.gpu?.requestAdapter() : null; } catch { adapter = null; }
    const options = {
      progress_callback: (event: { status?: string; progress?: number }) => {
        if (event.status === 'progress' && typeof event.progress === 'number') self.postMessage({ type: 'progress', id: detectorRequestId, message: `> LOADING OWLv2 WEIGHTS... ${Math.round(event.progress)}%` });
      },
    };
    if (adapter) {
      try {
        self.postMessage({ type: 'progress', id: requestId, message: '> OWLv2 BACKEND // WEBGPU' });
        const webgpu = await createPipeline('zero-shot-object-detection', 'Xenova/owlv2-base-patch16-ensemble', { ...options, dtype: 'q4f16', device: 'webgpu' } as never);
        return { RawImage, detect: (image: DetectorImage, labels: string[]) => webgpu(image, labels, { threshold: 0.03 } as never) as Promise<DetectorResult[]>, backend: 'webgpu', modelLoadMs: performance.now() - modelStarted };
      } catch (error) { console.warn('OWLv2 WebGPU unavailable; falling back to WASM', error); }
    }
    self.postMessage({ type: 'progress', id: requestId, message: '> OWLv2 BACKEND // WASM Q8 // REMOTE MODEL' });
    const wasm = await createPipeline('zero-shot-object-detection', 'Xenova/owlv2-base-patch16-ensemble', { ...options, dtype: 'q8', device: 'wasm' } as never);
    return { RawImage, detect: (image: DetectorImage, labels: string[]) => wasm(image, labels, { threshold: 0.03 } as never) as Promise<DetectorResult[]>, backend: 'wasm', modelLoadMs: performance.now() - modelStarted };
  })();
  try { return await detectorPromise; } catch (error) { detectorPromise = null; throw error; }
}

self.onmessage = async (event: MessageEvent<Request>) => {
  if (event.data.type !== 'detect') return;
  let stage = 'WORKER INITIALIZATION';
  try {
    const image = event.data.image;
    const canvas = new OffscreenCanvas(image.width, image.height);
    const context = canvas.getContext('2d');
    if (!context) throw new Error('WORKER CANVAS CONTEXT UNAVAILABLE');
    context.drawImage(image, 0, 0);
    self.postMessage({ type: 'progress', id: event.data.id, message: '> OWLv2 // QUERYING VISUAL VOCABULARY' });
    stage = 'MODEL DOWNLOAD / INITIALIZATION';
    detectorRequestId = event.data.id;
    const detector = await loadDetector(event.data.id);
    stage = 'INFERENCE';
    self.postMessage({ type: 'progress', id: event.data.id, message: `> OWLv2 // INFERENCE START // ${detector.backend.toUpperCase()} // ${event.data.labels.length} QUERIES` });
    const inferenceStarted = performance.now();
    const results = await detector.detect(detector.RawImage.fromCanvas(canvas), event.data.labels);
    const timings: Timings = { backend: detector.backend, modelLoadMs: Math.round(detector.modelLoadMs), inferenceMs: Math.round(performance.now() - inferenceStarted), vocabularySize: event.data.labels.length };
    self.postMessage({ type: 'result', id: event.data.id, results, timings });
    image.close();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const category = /wasm|onnx|\.mjs|\.js/i.test(message) ? 'LOCAL ONNX RUNTIME ASSET' : stage;
    self.postMessage({ type: 'error', id: event.data.id, message: `${category} // ${message}` });
    event.data.image.close();
  }
};
