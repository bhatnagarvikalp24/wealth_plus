/**
 * Image Utilities Module
 *
 * Centralized image processing utilities for handling:
 * - Base64 encoding/decoding
 * - MIME type validation
 * - Image format validation
 * - Image fetching from URLs
 * - File upload processing
 *
 * Fixes for common "Could not process image" API errors:
 * - Incorrect MIME types
 * - Malformed base64 (newlines, prefixes, URL-safe variants)
 * - Encoding file paths instead of bytes
 * - Corrupted/zero-byte files
 * - Unsupported formats (HEIC, PDF)
 * - HTML error pages encoded instead of images
 * - Oversized images
 */

// Supported image formats and their magic bytes (file signatures)
const IMAGE_SIGNATURES: Record<string, { mime: string; ext: string }> = {
  'ffd8ff': { mime: 'image/jpeg', ext: 'jpg' },
  '89504e47': { mime: 'image/png', ext: 'png' },
  '47494638': { mime: 'image/gif', ext: 'gif' },
  '52494646': { mime: 'image/webp', ext: 'webp' }, // RIFF header for WebP
};

// Maximum image size (20MB - most APIs limit to this or less)
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;

// Maximum dimensions (most APIs have limits around 8000x8000)
const MAX_DIMENSION = 8000;

export interface ImageValidationResult {
  isValid: boolean;
  mimeType: string | null;
  extension: string | null;
  size: number;
  error?: string;
}

export interface ProcessedImage {
  base64Raw: string;        // Raw base64 without prefix
  base64DataUrl: string;    // Full data URL (data:image/png;base64,...)
  mimeType: string;
  extension: string;
  size: number;
  hash: string;             // SHA-256 hash for verification
}

export interface ImageProcessingOptions {
  maxSizeBytes?: number;
  allowedFormats?: string[];
  validateDimensions?: boolean;
  stripExif?: boolean;
}

/**
 * Detect image type from binary data using magic bytes
 */
export function detectImageType(buffer: Buffer): { mime: string; ext: string } | null {
  const hex = buffer.subarray(0, 12).toString('hex').toLowerCase();

  // Check JPEG (FFD8FF)
  if (hex.startsWith('ffd8ff')) {
    return { mime: 'image/jpeg', ext: 'jpg' };
  }

  // Check PNG (89504E47)
  if (hex.startsWith('89504e47')) {
    return { mime: 'image/png', ext: 'png' };
  }

  // Check GIF (47494638)
  if (hex.startsWith('47494638')) {
    return { mime: 'image/gif', ext: 'gif' };
  }

  // Check WebP (RIFF....WEBP)
  if (hex.startsWith('52494646') && hex.substring(16, 24) === '57454250') {
    return { mime: 'image/webp', ext: 'webp' };
  }

  // Check for common non-image formats that might slip through

  // PDF (%PDF)
  if (hex.startsWith('25504446')) {
    return null; // PDF not supported
  }

  // HEIC/HEIF (ftyp)
  if (hex.substring(8, 16) === '66747970') {
    return null; // HEIC not supported by most vision APIs
  }

  // HTML detection (<!DOCTYPE or <html)
  const textCheck = buffer.subarray(0, 100).toString('utf-8').toLowerCase();
  if (textCheck.includes('<!doctype') || textCheck.includes('<html')) {
    return null; // HTML page, not an image
  }

  return null;
}

/**
 * Validate that buffer contains a valid, processable image
 */
export function validateImageBuffer(
  buffer: Buffer,
  options: ImageProcessingOptions = {}
): ImageValidationResult {
  const {
    maxSizeBytes = MAX_IMAGE_SIZE,
    allowedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  } = options;

  // Check for empty/zero-byte files
  if (!buffer || buffer.length === 0) {
    return {
      isValid: false,
      mimeType: null,
      extension: null,
      size: 0,
      error: 'Image buffer is empty (zero bytes)',
    };
  }

  // Check file size
  if (buffer.length > maxSizeBytes) {
    return {
      isValid: false,
      mimeType: null,
      extension: null,
      size: buffer.length,
      error: `Image size ${(buffer.length / 1024 / 1024).toFixed(2)}MB exceeds maximum ${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  // Detect image type from magic bytes
  const imageType = detectImageType(buffer);

  if (!imageType) {
    // Try to identify what we received
    const preview = buffer.subarray(0, 100).toString('utf-8');
    if (preview.includes('<!DOCTYPE') || preview.includes('<html')) {
      return {
        isValid: false,
        mimeType: null,
        extension: null,
        size: buffer.length,
        error: 'Received HTML content instead of image (possibly an error page or redirect)',
      };
    }

    return {
      isValid: false,
      mimeType: null,
      extension: null,
      size: buffer.length,
      error: 'Unsupported or unrecognized image format. Supported: JPEG, PNG, GIF, WebP',
    };
  }

  // Check if format is in allowed list
  if (!allowedFormats.includes(imageType.mime)) {
    return {
      isValid: false,
      mimeType: imageType.mime,
      extension: imageType.ext,
      size: buffer.length,
      error: `Image format ${imageType.mime} is not allowed. Allowed formats: ${allowedFormats.join(', ')}`,
    };
  }

  return {
    isValid: true,
    mimeType: imageType.mime,
    extension: imageType.ext,
    size: buffer.length,
  };
}

/**
 * Clean and normalize base64 string
 * Removes data URL prefix, newlines, spaces, and handles URL-safe variants
 */
export function normalizeBase64(input: string): string {
  let cleaned = input.trim();

  // Remove data URL prefix if present (e.g., "data:image/png;base64,")
  const dataUrlMatch = cleaned.match(/^data:[^;]+;base64,(.+)$/i);
  if (dataUrlMatch) {
    cleaned = dataUrlMatch[1];
  }

  // Remove all whitespace and newlines
  cleaned = cleaned.replace(/[\s\r\n]+/g, '');

  // Convert URL-safe base64 to standard base64
  cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');

  // Ensure proper padding
  const paddingNeeded = (4 - (cleaned.length % 4)) % 4;
  cleaned += '='.repeat(paddingNeeded);

  return cleaned;
}

/**
 * Encode buffer to clean base64 string (no newlines, proper padding)
 */
export function encodeToBase64(buffer: Buffer): string {
  // Node's base64 encoding already produces clean output
  return buffer.toString('base64');
}

/**
 * Create a data URL from buffer and MIME type
 */
export function createDataUrl(buffer: Buffer, mimeType: string): string {
  const base64 = encodeToBase64(buffer);
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Decode base64 string to buffer with validation
 */
export function decodeBase64(base64String: string): Buffer {
  const normalized = normalizeBase64(base64String);

  // Validate base64 characters
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    throw new Error('Invalid base64 characters detected');
  }

  return Buffer.from(normalized, 'base64');
}

/**
 * Calculate SHA-256 hash of buffer for verification
 */
export async function calculateHash(buffer: Buffer): Promise<string> {
  const crypto = await import('crypto');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Fetch image from URL with validation
 */
export async function fetchImageFromUrl(
  url: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const { maxSizeBytes = MAX_IMAGE_SIZE } = options;

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }

  // Only allow http/https
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error(`Unsupported protocol: ${parsedUrl.protocol}`);
  }

  console.log(`[ImageUtils] Fetching image from: ${url}`);

  const response = await fetch(url, {
    headers: {
      'Accept': 'image/*',
      'User-Agent': 'Mozilla/5.0 (compatible; ImageFetcher/1.0)',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch image: HTTP ${response.status} ${response.statusText}`);
  }

  // Check content-type header (but don't fully trust it)
  const contentType = response.headers.get('content-type') || '';
  console.log(`[ImageUtils] Response content-type: ${contentType}`);

  // Get response as buffer
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`[ImageUtils] Downloaded ${buffer.length} bytes`);

  // Validate the actual image content
  const validation = validateImageBuffer(buffer, options);

  if (!validation.isValid) {
    throw new Error(`Image validation failed: ${validation.error}`);
  }

  // Process and return
  const base64Raw = encodeToBase64(buffer);
  const hash = await calculateHash(buffer);

  console.log(`[ImageUtils] Image validated successfully:`);
  console.log(`  - MIME: ${validation.mimeType}`);
  console.log(`  - Size: ${validation.size} bytes`);
  console.log(`  - Hash: ${hash.substring(0, 16)}...`);

  return {
    base64Raw,
    base64DataUrl: createDataUrl(buffer, validation.mimeType!),
    mimeType: validation.mimeType!,
    extension: validation.extension!,
    size: validation.size,
    hash,
  };
}

/**
 * Process uploaded file (from FormData)
 */
export async function processUploadedFile(
  file: File | Blob,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  console.log(`[ImageUtils] Processing uploaded file: ${file instanceof File ? file.name : 'blob'}`);
  console.log(`[ImageUtils] File size: ${file.size} bytes`);
  console.log(`[ImageUtils] File type: ${file.type}`);

  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // CRITICAL: Don't trust the file.type - validate actual content
  const validation = validateImageBuffer(buffer, options);

  if (!validation.isValid) {
    throw new Error(`Image validation failed: ${validation.error}`);
  }

  const base64Raw = encodeToBase64(buffer);
  const hash = await calculateHash(buffer);

  console.log(`[ImageUtils] File processed successfully:`);
  console.log(`  - Detected MIME: ${validation.mimeType}`);
  console.log(`  - Size: ${validation.size} bytes`);
  console.log(`  - Hash: ${hash.substring(0, 16)}...`);

  return {
    base64Raw,
    base64DataUrl: createDataUrl(buffer, validation.mimeType!),
    mimeType: validation.mimeType!,
    extension: validation.extension!,
    size: validation.size,
    hash,
  };
}

/**
 * Process base64 string input (validate and normalize)
 */
export async function processBase64Input(
  base64Input: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  console.log(`[ImageUtils] Processing base64 input (${base64Input.length} chars)`);

  // Normalize the base64
  const normalized = normalizeBase64(base64Input);

  // Decode to buffer
  let buffer: Buffer;
  try {
    buffer = decodeBase64(normalized);
  } catch (error) {
    throw new Error(`Failed to decode base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  console.log(`[ImageUtils] Decoded to ${buffer.length} bytes`);

  // Validate the image content
  const validation = validateImageBuffer(buffer, options);

  if (!validation.isValid) {
    throw new Error(`Image validation failed: ${validation.error}`);
  }

  const base64Raw = encodeToBase64(buffer);
  const hash = await calculateHash(buffer);

  console.log(`[ImageUtils] Base64 processed successfully:`);
  console.log(`  - MIME: ${validation.mimeType}`);
  console.log(`  - Size: ${validation.size} bytes`);
  console.log(`  - Hash: ${hash.substring(0, 16)}...`);

  return {
    base64Raw,
    base64DataUrl: createDataUrl(buffer, validation.mimeType!),
    mimeType: validation.mimeType!,
    extension: validation.extension!,
    size: validation.size,
    hash,
  };
}

/**
 * Read local file and process
 */
export async function processLocalFile(
  filePath: string,
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  const fs = await import('fs/promises');
  const path = await import('path');

  console.log(`[ImageUtils] Reading local file: ${filePath}`);

  // Validate file exists
  try {
    await fs.access(filePath);
  } catch {
    throw new Error(`File not found: ${filePath}`);
  }

  // Read file
  const buffer = await fs.readFile(filePath);

  console.log(`[ImageUtils] Read ${buffer.length} bytes from ${path.basename(filePath)}`);

  // Validate the image
  const validation = validateImageBuffer(buffer, options);

  if (!validation.isValid) {
    throw new Error(`Image validation failed: ${validation.error}`);
  }

  const base64Raw = encodeToBase64(buffer);
  const hash = await calculateHash(buffer);

  console.log(`[ImageUtils] Local file processed successfully:`);
  console.log(`  - MIME: ${validation.mimeType}`);
  console.log(`  - Size: ${validation.size} bytes`);
  console.log(`  - Hash: ${hash.substring(0, 16)}...`);

  return {
    base64Raw,
    base64DataUrl: createDataUrl(buffer, validation.mimeType!),
    mimeType: validation.mimeType!,
    extension: validation.extension!,
    size: validation.size,
    hash,
  };
}

/**
 * Format image for OpenAI Vision API
 * Returns the correct payload structure for GPT-4 Vision
 */
export function formatForOpenAI(processedImage: ProcessedImage): {
  type: 'image_url';
  image_url: { url: string; detail?: 'low' | 'high' | 'auto' };
} {
  return {
    type: 'image_url',
    image_url: {
      url: processedImage.base64DataUrl,
      detail: 'auto',
    },
  };
}

/**
 * Format image for Anthropic Claude API
 * Returns the correct payload structure for Claude Vision
 */
export function formatForAnthropic(processedImage: ProcessedImage): {
  type: 'image';
  source: {
    type: 'base64';
    media_type: string;
    data: string;
  };
} {
  return {
    type: 'image',
    source: {
      type: 'base64',
      media_type: processedImage.mimeType,
      data: processedImage.base64Raw,
    },
  };
}

/**
 * Save debug copy of processed image
 */
export async function saveDebugCopy(
  processedImage: ProcessedImage,
  outputPath?: string
): Promise<string> {
  const fs = await import('fs/promises');
  const path = await import('path');
  const os = await import('os');

  const fileName = `debug_image_${Date.now()}.${processedImage.extension}`;
  const fullPath = outputPath || path.join(os.tmpdir(), fileName);

  const buffer = Buffer.from(processedImage.base64Raw, 'base64');
  await fs.writeFile(fullPath, buffer);

  console.log(`[ImageUtils] Debug copy saved to: ${fullPath}`);

  return fullPath;
}

/**
 * Unified image processor - handles URL, file upload, base64, or local path
 */
export async function processImage(
  input: string | File | Blob,
  inputType: 'url' | 'file' | 'base64' | 'path',
  options: ImageProcessingOptions = {}
): Promise<ProcessedImage> {
  console.log(`[ImageUtils] Processing image with type: ${inputType}`);

  switch (inputType) {
    case 'url':
      if (typeof input !== 'string') {
        throw new Error('URL input must be a string');
      }
      return fetchImageFromUrl(input, options);

    case 'file':
      if (!(input instanceof File) && !(input instanceof Blob)) {
        throw new Error('File input must be a File or Blob');
      }
      return processUploadedFile(input, options);

    case 'base64':
      if (typeof input !== 'string') {
        throw new Error('Base64 input must be a string');
      }
      return processBase64Input(input, options);

    case 'path':
      if (typeof input !== 'string') {
        throw new Error('Path input must be a string');
      }
      return processLocalFile(input, options);

    default:
      throw new Error(`Unknown input type: ${inputType}`);
  }
}

/**
 * Quick validation check - returns true if image can be processed
 */
export function canProcessImage(buffer: Buffer): boolean {
  const validation = validateImageBuffer(buffer);
  return validation.isValid;
}

/**
 * Get supported formats list
 */
export function getSupportedFormats(): string[] {
  return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
}

/**
 * Get max file size
 */
export function getMaxFileSize(): number {
  return MAX_IMAGE_SIZE;
}
