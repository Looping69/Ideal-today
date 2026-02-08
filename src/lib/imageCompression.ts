/**
 * Smart Image Compression Utility
 * 
 * Compresses images to the smallest possible size while preserving quality.
 * Uses adaptive quality based on image dimensions and complexity.
 */

export interface CompressionOptions {
    /** Maximum width in pixels (default: 1920) */
    maxWidth?: number;
    /** Maximum height in pixels (default: 1080) */
    maxHeight?: number;
    /** Target quality 0-1 (default: 0.8) */
    quality?: number;
    /** Target file size in bytes (optional, will iterate to find best quality) */
    targetSizeBytes?: number;
    /** Output format (default: 'webp' if supported, else 'jpeg') */
    outputFormat?: 'webp' | 'jpeg' | 'png';
}

export interface CompressionResult {
    blob: Blob;
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
    width: number;
    height: number;
    format: string;
}

const DEFAULT_OPTIONS: Required<Omit<CompressionOptions, 'targetSizeBytes'>> = {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.82,
    outputFormat: 'webp',
};

/**
 * Check if the browser supports WebP encoding
 */
function supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Load an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number
): { width: number; height: number } {
    let width = originalWidth;
    let height = originalHeight;

    // Only downscale, never upscale
    if (width <= maxWidth && height <= maxHeight) {
        return { width, height };
    }

    const aspectRatio = width / height;

    if (width > maxWidth) {
        width = maxWidth;
        height = Math.round(width / aspectRatio);
    }

    if (height > maxHeight) {
        height = maxHeight;
        width = Math.round(height * aspectRatio);
    }

    return { width, height };
}

/**
 * Compress an image using Canvas
 */
function compressWithCanvas(
    img: HTMLImageElement,
    width: number,
    height: number,
    format: string,
    quality: number
): Promise<Blob> {
    return new Promise((resolve, reject) => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }

        // Use high-quality image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw the image
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        const mimeType = format === 'webp' ? 'image/webp' : format === 'png' ? 'image/png' : 'image/jpeg';

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Failed to create blob'));
                }
            },
            mimeType,
            quality
        );
    });
}

/**
 * Estimate image complexity based on color variance
 * Higher complexity = more detail to preserve = higher quality needed
 */
function estimateComplexity(img: HTMLImageElement): number {
    const canvas = document.createElement('canvas');
    const sampleSize = 100; // Sample at 100x100 for speed
    canvas.width = sampleSize;
    canvas.height = sampleSize;

    const ctx = canvas.getContext('2d');
    if (!ctx) return 0.5;

    ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
    const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
    const data = imageData.data;

    // Calculate color variance as a complexity metric
    let sumR = 0, sumG = 0, sumB = 0;
    let sumR2 = 0, sumG2 = 0, sumB2 = 0;
    const pixelCount = sampleSize * sampleSize;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        sumR += r;
        sumG += g;
        sumB += b;
        sumR2 += r * r;
        sumG2 += g * g;
        sumB2 += b * b;
    }

    const meanR = sumR / pixelCount;
    const meanG = sumG / pixelCount;
    const meanB = sumB / pixelCount;

    const varR = (sumR2 / pixelCount) - (meanR * meanR);
    const varG = (sumG2 / pixelCount) - (meanG * meanG);
    const varB = (sumB2 / pixelCount) - (meanB * meanB);

    // Normalize variance to 0-1 range (max theoretical variance is ~16256)
    const avgVariance = (varR + varG + varB) / 3;
    const normalizedComplexity = Math.min(avgVariance / 5000, 1);

    return normalizedComplexity;
}

/**
 * Determine optimal quality based on image properties
 */
function calculateAdaptiveQuality(
    img: HTMLImageElement,
    baseQuality: number
): number {
    const complexity = estimateComplexity(img);

    // Higher complexity = higher quality to preserve details
    // Lower complexity (solid colors, gradients) = can use lower quality
    const qualityAdjustment = (complexity - 0.5) * 0.15;
    const adaptiveQuality = Math.max(0.6, Math.min(0.95, baseQuality + qualityAdjustment));

    return adaptiveQuality;
}

/**
 * Main compression function
 * Intelligently compresses an image file to the smallest size while preserving quality
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<CompressionResult> {
    const opts = { ...DEFAULT_OPTIONS, ...options };

    // Determine output format
    let format = opts.outputFormat;
    if (format === 'webp' && !supportsWebP()) {
        format = 'jpeg';
    }

    // Skip compression for already small files (under 100KB) unless they're huge dimensions
    if (file.size < 100 * 1024 && file.type !== 'image/bmp') {
        const img = await loadImage(file);
        if (img.width <= opts.maxWidth && img.height <= opts.maxHeight) {
            // Return original file as blob
            return {
                blob: file,
                originalSize: file.size,
                compressedSize: file.size,
                compressionRatio: 1,
                width: img.width,
                height: img.height,
                format: file.type.split('/')[1] || 'unknown',
            };
        }
    }

    const img = await loadImage(file);
    const originalSize = file.size;

    // Calculate target dimensions
    const { width, height } = calculateDimensions(
        img.width,
        img.height,
        opts.maxWidth,
        opts.maxHeight
    );

    // Calculate adaptive quality based on image complexity
    const adaptiveQuality = calculateAdaptiveQuality(img, opts.quality);

    let blob: Blob;

    if (opts.targetSizeBytes) {
        // Iteratively find the best quality to meet target size
        let currentQuality = adaptiveQuality;
        let attempts = 0;
        const maxAttempts = 8;

        blob = await compressWithCanvas(img, width, height, format, currentQuality);

        while (blob.size > opts.targetSizeBytes && attempts < maxAttempts && currentQuality > 0.3) {
            currentQuality -= 0.1;
            blob = await compressWithCanvas(img, width, height, format, currentQuality);
            attempts++;
        }

        // If still too large, try reducing dimensions
        if (blob.size > opts.targetSizeBytes) {
            const scaleFactor = Math.sqrt(opts.targetSizeBytes / blob.size);
            const reducedWidth = Math.round(width * scaleFactor);
            const reducedHeight = Math.round(height * scaleFactor);
            blob = await compressWithCanvas(img, reducedWidth, reducedHeight, format, currentQuality);
        }
    } else {
        blob = await compressWithCanvas(img, width, height, format, adaptiveQuality);
    }

    // Clean up object URL
    URL.revokeObjectURL(img.src);

    // If compressed size is larger than original and dimensions haven't changed, use original
    if (blob.size >= originalSize && width === img.width && height === img.height) {
        return {
            blob: file,
            originalSize,
            compressedSize: originalSize,
            compressionRatio: 1,
            width: img.width,
            height: img.height,
            format: file.type.split('/')[1] || 'unknown',
        };
    }

    const compressionRatio = originalSize / blob.size;

    return {
        blob,
        originalSize,
        compressedSize: blob.size,
        compressionRatio,
        width,
        height,
        format,
    };
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
    files: File[],
    options: CompressionOptions = {}
): Promise<CompressionResult[]> {
    return Promise.all(files.map(file => compressImage(file, options)));
}

/**
 * Convert a Blob to a File object
 */
export function blobToFile(blob: Blob, originalName: string, format: string): File {
    const extension = format === 'webp' ? 'webp' : format === 'png' ? 'png' : 'jpg';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const newName = `${baseName}.${extension}`;

    return new File([blob], newName, { type: blob.type });
}

/**
 * Format bytes to human readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
