const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const MAX_DATA_URL_LENGTH = 1_800_000;
const MAX_DIMENSION = 1600;

/**
 * Prepara una imagen para guardarla en el CRM sin depender de almacenamiento
 * externo. Redimensiona y convierte a WebP para mantener pequeño el payload.
 */
export async function compressPropertyImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`${file.name} no es una imagen válida.`);
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error(`${file.name} supera el límite de 12 MB.`);
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(objectUrl);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('El navegador no pudo procesar la imagen.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    let result = canvas.toDataURL('image/webp', 0.82);
    if (result.length > MAX_DATA_URL_LENGTH) result = canvas.toDataURL('image/webp', 0.65);
    if (result.length > MAX_DATA_URL_LENGTH) result = canvas.toDataURL('image/webp', 0.5);
    if (result.length > MAX_DATA_URL_LENGTH) {
      throw new Error(`${file.name} sigue siendo demasiado pesada después de comprimirla.`);
    }
    return result;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function compressPropertyImages(files: FileList | File[]): Promise<string[]> {
  const selected = Array.from(files);
  if (selected.length > 8) throw new Error('Puedes cargar hasta 8 imágenes a la vez.');
  return Promise.all(selected.map(compressPropertyImage));
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('No se pudo leer una de las imágenes.'));
    image.src = src;
  });
}
