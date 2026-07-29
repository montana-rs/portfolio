import grainUrl from '../assets/grain.png?url';

let grainImage: Promise<HTMLImageElement> | null = null;

export async function compositeGrain(context: CanvasRenderingContext2D): Promise<void> {
  grainImage ??= loadGrain();
  const image = await grainImage;
  const pattern = context.createPattern(image, 'repeat');
  if (!pattern) throw new Error('GRAIN PATTERN UNAVAILABLE');
  context.save();
  context.globalAlpha = 0.2;
  context.globalCompositeOperation = 'multiply';
  context.fillStyle = pattern;
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  context.restore();
}

function loadGrain(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('GRAIN ASSET FAILED TO LOAD'));
    image.src = grainUrl;
  });
}
