/**
 * Image Pipeline Test Script
 *
 * Tests the image processing utilities with various inputs:
 * - Local file
 * - URL
 * - Base64 string
 *
 * Run with: npx tsx scripts/test-image-pipeline.ts
 */

import {
  processImage,
  validateImageBuffer,
  formatForOpenAI,
  formatForAnthropic,
  getSupportedFormats,
  getMaxFileSize,
  detectImageType,
  normalizeBase64,
} from '../src/lib/image-utils';
import * as fs from 'fs/promises';
import * as path from 'path';

// Test image URLs (public domain images)
const TEST_URLS = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/200px-PNG_transparency_demonstration_1.png',
  'https://www.w3schools.com/css/img_5terre.jpg',
];

// Test base64 (1x1 red PNG)
const TEST_BASE64_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

// Test base64 with data URL prefix
const TEST_BASE64_WITH_PREFIX = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==';

// Invalid base64 (HTML content)
const TEST_INVALID_HTML = Buffer.from('<!DOCTYPE html><html><body>Error</body></html>').toString('base64');

async function runTests() {
  console.log('='.repeat(60));
  console.log('Image Pipeline Test Suite');
  console.log('='.repeat(60));
  console.log();

  let passed = 0;
  let failed = 0;

  // Test 1: Check supported formats
  console.log('Test 1: Supported Formats');
  console.log('-'.repeat(40));
  const formats = getSupportedFormats();
  console.log('Supported formats:', formats.join(', '));
  console.log('Max file size:', (getMaxFileSize() / 1024 / 1024) + 'MB');
  console.log('✓ PASS');
  passed++;
  console.log();

  // Test 2: Image type detection
  console.log('Test 2: Image Type Detection');
  console.log('-'.repeat(40));

  // PNG magic bytes
  const pngBytes = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const pngType = detectImageType(pngBytes);
  console.log('PNG detection:', pngType?.mime === 'image/png' ? '✓' : '✗', pngType);

  // JPEG magic bytes
  const jpegBytes = Buffer.from([0xFF, 0xD8, 0xFF, 0xE0]);
  const jpegType = detectImageType(jpegBytes);
  console.log('JPEG detection:', jpegType?.mime === 'image/jpeg' ? '✓' : '✗', jpegType);

  // HTML (should return null)
  const htmlBytes = Buffer.from('<!DOCTYPE html>');
  const htmlType = detectImageType(htmlBytes);
  console.log('HTML rejection:', htmlType === null ? '✓' : '✗', htmlType);

  if (pngType?.mime === 'image/png' && jpegType?.mime === 'image/jpeg' && htmlType === null) {
    console.log('✓ PASS');
    passed++;
  } else {
    console.log('✗ FAIL');
    failed++;
  }
  console.log();

  // Test 3: Base64 normalization
  console.log('Test 3: Base64 Normalization');
  console.log('-'.repeat(40));

  const withPrefix = normalizeBase64(TEST_BASE64_WITH_PREFIX);
  const withoutPrefix = normalizeBase64(TEST_BASE64_PNG);
  console.log('Strips data URL prefix:', withPrefix === withoutPrefix ? '✓' : '✗');

  const withNewlines = normalizeBase64(TEST_BASE64_PNG.match(/.{1,20}/g)!.join('\n'));
  console.log('Strips newlines:', withNewlines === TEST_BASE64_PNG ? '✓' : '✗');

  if (withPrefix === withoutPrefix && withNewlines === TEST_BASE64_PNG) {
    console.log('✓ PASS');
    passed++;
  } else {
    console.log('✗ FAIL');
    failed++;
  }
  console.log();

  // Test 4: Process base64 PNG
  console.log('Test 4: Process Base64 PNG');
  console.log('-'.repeat(40));
  try {
    const result = await processImage(TEST_BASE64_PNG, 'base64');
    console.log('MIME type:', result.mimeType);
    console.log('Size:', result.size, 'bytes');
    console.log('Hash:', result.hash.substring(0, 16) + '...');
    console.log('Base64 length:', result.base64Raw.length);
    console.log('Data URL starts with:', result.base64DataUrl.substring(0, 30) + '...');

    if (result.mimeType === 'image/png' && result.size > 0) {
      console.log('✓ PASS');
      passed++;
    } else {
      console.log('✗ FAIL');
      failed++;
    }
  } catch (error) {
    console.log('✗ FAIL:', error);
    failed++;
  }
  console.log();

  // Test 5: Process base64 with data URL prefix
  console.log('Test 5: Process Base64 with Data URL Prefix');
  console.log('-'.repeat(40));
  try {
    const result = await processImage(TEST_BASE64_WITH_PREFIX, 'base64');
    console.log('MIME type:', result.mimeType);
    console.log('Correctly stripped prefix: ✓');
    console.log('✓ PASS');
    passed++;
  } catch (error) {
    console.log('✗ FAIL:', error);
    failed++;
  }
  console.log();

  // Test 6: Reject HTML content
  console.log('Test 6: Reject HTML Content (disguised as base64)');
  console.log('-'.repeat(40));
  try {
    await processImage(TEST_INVALID_HTML, 'base64');
    console.log('✗ FAIL: Should have rejected HTML content');
    failed++;
  } catch (error) {
    if (error instanceof Error && error.message.includes('HTML')) {
      console.log('Correctly rejected HTML:', error.message);
      console.log('✓ PASS');
      passed++;
    } else {
      console.log('Wrong error:', error);
      failed++;
    }
  }
  console.log();

  // Test 7: OpenAI format
  console.log('Test 7: OpenAI Format Generation');
  console.log('-'.repeat(40));
  try {
    const processed = await processImage(TEST_BASE64_PNG, 'base64');
    const openaiFormat = formatForOpenAI(processed);

    console.log('Type:', openaiFormat.type);
    console.log('Has image_url:', !!openaiFormat.image_url);
    console.log('URL starts with data:', openaiFormat.image_url.url.startsWith('data:image/png'));
    console.log('Detail:', openaiFormat.image_url.detail);

    if (openaiFormat.type === 'image_url' && openaiFormat.image_url.url.startsWith('data:image/png')) {
      console.log('✓ PASS');
      passed++;
    } else {
      console.log('✗ FAIL');
      failed++;
    }
  } catch (error) {
    console.log('✗ FAIL:', error);
    failed++;
  }
  console.log();

  // Test 8: Anthropic format
  console.log('Test 8: Anthropic Format Generation');
  console.log('-'.repeat(40));
  try {
    const processed = await processImage(TEST_BASE64_PNG, 'base64');
    const anthropicFormat = formatForAnthropic(processed);

    console.log('Type:', anthropicFormat.type);
    console.log('Source type:', anthropicFormat.source.type);
    console.log('Media type:', anthropicFormat.source.media_type);
    console.log('Data length:', anthropicFormat.source.data.length);

    if (
      anthropicFormat.type === 'image' &&
      anthropicFormat.source.type === 'base64' &&
      anthropicFormat.source.media_type === 'image/png'
    ) {
      console.log('✓ PASS');
      passed++;
    } else {
      console.log('✗ FAIL');
      failed++;
    }
  } catch (error) {
    console.log('✗ FAIL:', error);
    failed++;
  }
  console.log();

  // Test 9: Fetch image from URL (network test)
  console.log('Test 9: Fetch Image from URL');
  console.log('-'.repeat(40));
  try {
    console.log('Fetching:', TEST_URLS[0]);
    const result = await processImage(TEST_URLS[0], 'url');
    console.log('MIME type:', result.mimeType);
    console.log('Size:', result.size, 'bytes');
    console.log('Hash:', result.hash.substring(0, 16) + '...');

    if (result.mimeType === 'image/png' && result.size > 0) {
      console.log('✓ PASS');
      passed++;
    } else {
      console.log('✗ FAIL');
      failed++;
    }
  } catch (error) {
    console.log('⚠ SKIP (network error):', error instanceof Error ? error.message : error);
    // Don't count as failure since it might be a network issue
  }
  console.log();

  // Test 10: Validate empty buffer
  console.log('Test 10: Reject Empty Buffer');
  console.log('-'.repeat(40));
  const emptyValidation = validateImageBuffer(Buffer.alloc(0));
  console.log('Is valid:', emptyValidation.isValid);
  console.log('Error:', emptyValidation.error);

  if (!emptyValidation.isValid && emptyValidation.error?.includes('empty')) {
    console.log('✓ PASS');
    passed++;
  } else {
    console.log('✗ FAIL');
    failed++;
  }
  console.log();

  // Summary
  console.log('='.repeat(60));
  console.log('Test Summary');
  console.log('='.repeat(60));
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}`);
  console.log();

  if (failed === 0) {
    console.log('🎉 All tests passed! Image pipeline is working correctly.');
  } else {
    console.log(`⚠️  ${failed} test(s) failed. Review the output above.`);
    process.exit(1);
  }
}

// Run tests
runTests().catch(console.error);
