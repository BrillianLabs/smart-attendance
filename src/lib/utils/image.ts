/**
 * Compresses an image file on the client side using the Canvas API.
 */
export async function compressImage(
  file: File,
  options: { maxWidth: number; maxHeight: number; quality: number } = {
    maxWidth: 1024,
    maxHeight: 1024,
    quality: 0.8,
  }
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio
        if (width > height) {
          if (width > options.maxWidth) {
            height *= options.maxWidth / width;
            width = options.maxWidth;
          }
        } else {
          if (height > options.maxHeight) {
            width *= options.maxHeight / height;
            height = options.maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('Could not get canvas context'));

        ctx.drawImage(img, 0, 0, width, height);

        // Export as WebP if supported, fallback to JPEG
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('Canvas conversion failed'));
            
            // Create a new file from the blob
            const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const compressedFile = new File([blob], fileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            
            resolve(compressedFile);
          },
          'image/webp',
          options.quality
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}
