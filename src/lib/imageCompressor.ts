/**
 * Client-side image compression and resizing utility using HTML5 Canvas.
 * Reduces storage usage and speeds up upload/load times before persisting to Supabase Storage.
 */

export interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
}

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  const ext = file.name.split('.').pop()?.toLowerCase();

  // Bypass compression for vector SVG or non-image files
  if (ext === 'svg' || file.type === 'image/svg+xml') {
    return file;
  }

  // Ensure browser environment
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  const maxWidth = options.maxWidth || 1600;
  const maxHeight = options.maxHeight || 1600;
  const quality = options.quality ?? 0.82;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // If file is already small (< 150 KB) and dimensions are within limits, skip resize
        if (file.size <= 150 * 1024 && width <= maxWidth && height <= maxHeight) {
          resolve(file);
          return;
        }

        // Scale dimensions keeping aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(file);
          return;
        }

        const isPng = ext === 'png' || file.type === 'image/png';
        const outputType = isPng ? 'image/png' : 'image/jpeg';

        if (!isPng) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }

            // If compressed result is larger than original file and dimensions didn't change, keep original
            if (blob.size >= file.size && width === img.width && height === img.height) {
              resolve(file);
              return;
            }

            const compressedFile = new File([blob], file.name, {
              type: outputType,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          outputType,
          isPng ? undefined : quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

if (typeof window !== 'undefined') {
  (window as any).__compressImage = compressImage;
}
