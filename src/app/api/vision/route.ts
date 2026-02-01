/**
 * Vision API Endpoint
 *
 * Handles image processing and sends to AI vision APIs.
 * Supports multiple input types: URL, file upload, base64.
 *
 * This endpoint addresses common "Could not process image" errors:
 * - Validates image format before sending to API
 * - Ensures correct base64 encoding
 * - Validates MIME types from actual file content
 * - Handles various input formats uniformly
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  processImage,
  formatForOpenAI,
  formatForAnthropic,
  saveDebugCopy,
  getSupportedFormats,
  getMaxFileSize,
  ProcessedImage,
} from '@/lib/image-utils';

interface VisionRequest {
  // Image input - one of these must be provided
  imageUrl?: string;
  imageBase64?: string;
  // For file uploads, use FormData with 'file' field

  // Processing options
  prompt?: string;
  provider?: 'openai' | 'anthropic';
  model?: string;
  saveDebug?: boolean;
}

interface VisionResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    response: string;
    imageInfo: {
      mimeType: string;
      size: number;
      hash: string;
    };
    debugPath?: string;
  };
}

// Environment validation
function getApiKey(provider: 'openai' | 'anthropic'): string {
  const envVar = provider === 'openai' ? 'OPENAI_API_KEY' : 'ANTHROPIC_API_KEY';
  const key = process.env[envVar];

  if (!key) {
    throw new Error(`${envVar} environment variable is not set`);
  }

  return key;
}

// Call OpenAI Vision API
async function callOpenAIVision(
  processedImage: ProcessedImage,
  prompt: string,
  model: string = 'gpt-4o'
): Promise<string> {
  const apiKey = getApiKey('openai');

  console.log('[Vision API] Calling OpenAI Vision API');
  console.log(`  - Model: ${model}`);
  console.log(`  - Image size: ${processedImage.size} bytes`);
  console.log(`  - Image MIME: ${processedImage.mimeType}`);

  const imageContent = formatForOpenAI(processedImage);

  const requestBody = {
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          imageContent,
        ],
      },
    ],
    max_tokens: 4096,
  };

  console.log('[Vision API] Request payload structure:', JSON.stringify({
    model: requestBody.model,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt.substring(0, 50) + '...' },
        {
          type: imageContent.type,
          image_url: {
            url: `data:${processedImage.mimeType};base64,[${processedImage.base64Raw.length} chars]`,
            detail: imageContent.image_url.detail,
          },
        },
      ],
    }],
    max_tokens: requestBody.max_tokens,
  }, null, 2));

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Vision API] OpenAI API error:', errorText);
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || 'No response generated';
}

// Call Anthropic Claude Vision API
async function callAnthropicVision(
  processedImage: ProcessedImage,
  prompt: string,
  model: string = 'claude-sonnet-4-20250514'
): Promise<string> {
  const apiKey = getApiKey('anthropic');

  console.log('[Vision API] Calling Anthropic Vision API');
  console.log(`  - Model: ${model}`);
  console.log(`  - Image size: ${processedImage.size} bytes`);
  console.log(`  - Image MIME: ${processedImage.mimeType}`);

  const imageContent = formatForAnthropic(processedImage);

  const requestBody = {
    model,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          imageContent,
          { type: 'text', text: prompt },
        ],
      },
    ],
  };

  console.log('[Vision API] Request payload structure:', JSON.stringify({
    model: requestBody.model,
    max_tokens: requestBody.max_tokens,
    messages: [{
      role: 'user',
      content: [
        {
          type: 'image',
          source: {
            type: 'base64',
            media_type: processedImage.mimeType,
            data: `[${processedImage.base64Raw.length} chars]`,
          },
        },
        { type: 'text', text: prompt.substring(0, 50) + '...' },
      ],
    }],
  }, null, 2));

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Vision API] Anthropic API error:', errorText);
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  // Extract text from content blocks
  const textContent = data.content?.find((block: { type: string }) => block.type === 'text');
  return textContent?.text || 'No response generated';
}

// Handle POST request
export async function POST(request: NextRequest): Promise<NextResponse<VisionResponse>> {
  console.log('[Vision API] Received POST request');

  try {
    let processedImage: ProcessedImage;
    let prompt: string = 'Describe this image in detail.';
    let provider: 'openai' | 'anthropic' = 'anthropic';
    let model: string | undefined;
    let saveDebug: boolean = false;

    const contentType = request.headers.get('content-type') || '';
    console.log(`[Vision API] Content-Type: ${contentType}`);

    // Handle FormData (file upload)
    if (contentType.includes('multipart/form-data')) {
      console.log('[Vision API] Processing FormData upload');

      const formData = await request.formData();
      const file = formData.get('file');
      const promptField = formData.get('prompt');
      const providerField = formData.get('provider');
      const modelField = formData.get('model');
      const saveDebugField = formData.get('saveDebug');

      if (!file || !(file instanceof File)) {
        return NextResponse.json({
          success: false,
          error: 'No file uploaded. Include a "file" field in FormData.',
        }, { status: 400 });
      }

      if (promptField && typeof promptField === 'string') {
        prompt = promptField;
      }
      if (providerField === 'openai' || providerField === 'anthropic') {
        provider = providerField;
      }
      if (modelField && typeof modelField === 'string') {
        model = modelField;
      }
      if (saveDebugField === 'true') {
        saveDebug = true;
      }

      console.log(`[Vision API] File: ${file.name}, Size: ${file.size}, Type: ${file.type}`);

      // Process the uploaded file
      processedImage = await processImage(file, 'file');

    } else if (contentType.includes('application/json')) {
      // Handle JSON request
      console.log('[Vision API] Processing JSON request');

      const body: VisionRequest = await request.json();

      if (body.prompt) prompt = body.prompt;
      if (body.provider) provider = body.provider;
      if (body.model) model = body.model;
      if (body.saveDebug) saveDebug = body.saveDebug;

      if (body.imageUrl) {
        console.log(`[Vision API] Fetching image from URL: ${body.imageUrl}`);
        processedImage = await processImage(body.imageUrl, 'url');
      } else if (body.imageBase64) {
        console.log(`[Vision API] Processing base64 input (${body.imageBase64.length} chars)`);
        processedImage = await processImage(body.imageBase64, 'base64');
      } else {
        return NextResponse.json({
          success: false,
          error: 'No image provided. Include "imageUrl" or "imageBase64" in the request body.',
        }, { status: 400 });
      }
    } else {
      return NextResponse.json({
        success: false,
        error: `Unsupported content type: ${contentType}. Use multipart/form-data or application/json.`,
      }, { status: 400 });
    }

    // Log processed image info
    console.log('[Vision API] Image processed successfully:');
    console.log(`  - MIME: ${processedImage.mimeType}`);
    console.log(`  - Size: ${processedImage.size} bytes`);
    console.log(`  - Base64 length: ${processedImage.base64Raw.length} chars`);
    console.log(`  - Hash: ${processedImage.hash.substring(0, 16)}...`);

    // Save debug copy if requested
    let debugPath: string | undefined;
    if (saveDebug) {
      debugPath = await saveDebugCopy(processedImage);
      console.log(`[Vision API] Debug copy saved to: ${debugPath}`);
    }

    // Call the appropriate vision API
    let response: string;
    if (provider === 'openai') {
      response = await callOpenAIVision(processedImage, prompt, model);
    } else {
      response = await callAnthropicVision(processedImage, prompt, model);
    }

    console.log('[Vision API] API call successful');

    return NextResponse.json({
      success: true,
      message: 'Image processed successfully',
      data: {
        response,
        imageInfo: {
          mimeType: processedImage.mimeType,
          size: processedImage.size,
          hash: processedImage.hash,
        },
        debugPath,
      },
    });

  } catch (error) {
    console.error('[Vision API] Error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json({
      success: false,
      error: errorMessage,
    }, { status: 500 });
  }
}

// Handle GET request (for API info)
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    name: 'Vision API',
    version: '1.0.0',
    description: 'Image processing endpoint for AI vision APIs',
    supportedFormats: getSupportedFormats(),
    maxFileSize: getMaxFileSize(),
    maxFileSizeFormatted: `${getMaxFileSize() / 1024 / 1024}MB`,
    usage: {
      fileUpload: {
        method: 'POST',
        contentType: 'multipart/form-data',
        fields: {
          file: 'Image file (required)',
          prompt: 'Text prompt (optional)',
          provider: 'openai | anthropic (optional, default: anthropic)',
          model: 'Model name (optional)',
          saveDebug: 'true to save debug copy (optional)',
        },
      },
      jsonRequest: {
        method: 'POST',
        contentType: 'application/json',
        body: {
          imageUrl: 'URL of image (use this OR imageBase64)',
          imageBase64: 'Base64 encoded image (use this OR imageUrl)',
          prompt: 'Text prompt (optional)',
          provider: 'openai | anthropic (optional, default: anthropic)',
          model: 'Model name (optional)',
          saveDebug: 'true to save debug copy (optional)',
        },
      },
    },
  });
}
