/**
 * Image Validation Endpoint
 *
 * Validates images without calling external APIs.
 * Useful for testing image processing pipeline.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  processImage,
  formatForOpenAI,
  formatForAnthropic,
  saveDebugCopy,
  getSupportedFormats,
  getMaxFileSize,
} from '@/lib/image-utils';

interface ValidationResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    isValid: boolean;
    mimeType: string;
    size: number;
    sizeFormatted: string;
    hash: string;
    base64Length: number;
    debugPath?: string;
    // Preview of the formatted payloads
    openaiPayloadPreview: object;
    anthropicPayloadPreview: object;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<ValidationResponse>> {
  console.log('[Validation API] Received POST request');

  try {
    const contentType = request.headers.get('content-type') || '';
    let processedImage;
    let saveDebug = false;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file');
      saveDebug = formData.get('saveDebug') === 'true';

      if (!file || !(file instanceof File)) {
        return NextResponse.json({
          success: false,
          error: 'No file uploaded',
        }, { status: 400 });
      }

      console.log(`[Validation API] Processing file: ${file.name}`);
      processedImage = await processImage(file, 'file');

    } else if (contentType.includes('application/json')) {
      const body = await request.json();
      saveDebug = body.saveDebug || false;

      if (body.imageUrl) {
        console.log(`[Validation API] Fetching URL: ${body.imageUrl}`);
        processedImage = await processImage(body.imageUrl, 'url');
      } else if (body.imageBase64) {
        console.log(`[Validation API] Processing base64`);
        processedImage = await processImage(body.imageBase64, 'base64');
      } else {
        return NextResponse.json({
          success: false,
          error: 'No image provided',
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: 'Unsupported content type',
      }, { status: 400 });
    }

    // Generate API payloads for preview
    const openaiFormat = formatForOpenAI(processedImage);
    const anthropicFormat = formatForAnthropic(processedImage);

    // Save debug copy if requested
    let debugPath: string | undefined;
    if (saveDebug) {
      debugPath = await saveDebugCopy(processedImage);
    }

    return NextResponse.json({
      success: true,
      message: 'Image validation successful - ready for API submission',
      data: {
        isValid: true,
        mimeType: processedImage.mimeType,
        size: processedImage.size,
        sizeFormatted: `${(processedImage.size / 1024).toFixed(2)} KB`,
        hash: processedImage.hash,
        base64Length: processedImage.base64Raw.length,
        debugPath,
        openaiPayloadPreview: {
          type: openaiFormat.type,
          image_url: {
            url: `data:${processedImage.mimeType};base64,[${processedImage.base64Raw.length} chars]`,
            detail: openaiFormat.image_url.detail,
          },
        },
        anthropicPayloadPreview: {
          type: anthropicFormat.type,
          source: {
            type: anthropicFormat.source.type,
            media_type: anthropicFormat.source.media_type,
            data: `[${anthropicFormat.source.data.length} chars]`,
          },
        },
      },
    });

  } catch (error) {
    console.error('[Validation API] Error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    name: 'Image Validation API',
    description: 'Validates images without calling external AI APIs',
    supportedFormats: getSupportedFormats(),
    maxFileSize: `${getMaxFileSize() / 1024 / 1024}MB`,
    endpoints: {
      validate: {
        method: 'POST',
        description: 'Validate an image and preview API payloads',
      },
    },
  });
}
