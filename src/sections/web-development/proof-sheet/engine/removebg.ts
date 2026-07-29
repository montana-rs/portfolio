export const MAX_SOURCE_PIXELS = 40_000_000;
export const MAX_SOURCE_DIMENSION = 8_000;

export async function removeBackground(
  source: HTMLImageElement,
  report: (message: string) => void,
): Promise<HTMLCanvasElement> {
  if (!source.naturalWidth || !source.naturalHeight) throw new Error('IMAGE DIMENSIONS UNAVAILABLE');
  if (source.naturalWidth > MAX_SOURCE_DIMENSION || source.naturalHeight > MAX_SOURCE_DIMENSION) {
    throw new Error(`IMAGE DIMENSIONS EXCEED ${MAX_SOURCE_DIMENSION}px`);
  }
  if (source.naturalWidth * source.naturalHeight > MAX_SOURCE_PIXELS) {
    throw new Error('IMAGE IS TOO LARGE // MAXIMUM 40MP');
  }
  report('REMOVE_BG // LOADING LOCAL MASK');
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const max = 1200;
  const scale = Math.min(1, max / Math.max(source.naturalWidth, source.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(source.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(source.naturalHeight * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('CANVAS CONTEXT UNAVAILABLE');
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const sample = (x: number, y: number) => {
    const index = (y * canvas.width + x) * 4;
    return [image.data[index], image.data[index + 1], image.data[index + 2]];
  };
  const corners = [sample(0, 0), sample(canvas.width - 1, 0), sample(0, canvas.height - 1), sample(canvas.width - 1, canvas.height - 1)];
  const background = corners[0].map((_, channel) => corners.reduce((sum, point) => sum + point[channel], 0) / corners.length);
  for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
    const index = (y * canvas.width + x) * 4;
    const distance = Math.hypot(image.data[index] - background[0], image.data[index + 1] - background[1], image.data[index + 2] - background[2]);
    const edge = Math.min(x, y, canvas.width - x - 1, canvas.height - y - 1);
    image.data[index + 3] = Math.round(edge < 12 ? Math.min(255, distance * 8) : Math.min(255, 80 + distance * 8));
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}
