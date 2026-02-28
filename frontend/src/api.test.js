import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadFile } from './api';

describe('uploadFile', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => {
        if (key === 'api_key') return 'test-api-key';
        return null;
      }),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully upload a file and return response JSON', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const mockResponse = { success: true, url: '/uploads/test.txt' };

    global.fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => mockResponse,
    });

    const result = await uploadFile(mockFile);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = global.fetch.mock.calls[0];

    expect(url).toBe('/api/upload');
    expect(options.method).toBe('POST');
    expect(options.headers).toEqual({
      'X-API-Key': 'test-api-key',
    });
    // Check that body is a FormData object and contains the file
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get('file')).toBe(mockFile);

    // Verify response
    expect(result).toEqual(mockResponse);
  });

  it('should throw "Unauthorized" error if status is 401', async () => {
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });

    global.fetch.mockResolvedValueOnce({
      status: 401,
    });

    await expect(uploadFile(mockFile)).rejects.toThrow('Unauthorized');
  });

  it('should fallback to empty string if api_key is missing in localStorage', async () => {
    // Override the mock for localStorage for this test to return null for all calls
    global.localStorage.getItem.mockImplementation(() => null);
    const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const mockResponse = { success: true, url: '/uploads/test.txt' };

    global.fetch.mockResolvedValueOnce({
      status: 200,
      json: async () => mockResponse,
    });

    await uploadFile(mockFile);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [, options] = global.fetch.mock.calls[0];

    expect(options.headers).toEqual({
      'X-API-Key': '',
    });
  });
});
