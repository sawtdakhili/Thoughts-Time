import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Mock sql.js to avoid WASM loading in tests
vi.mock('sql.js', () => {
  return {
    default: vi.fn().mockResolvedValue({
      Database: vi.fn().mockImplementation(() => ({
        run: vi.fn(),
        exec: vi.fn().mockReturnValue([]),
        prepare: vi.fn().mockReturnValue({
          run: vi.fn(),
          free: vi.fn(),
        }),
        export: vi.fn().mockReturnValue(new Uint8Array()),
        close: vi.fn(),
      })),
    }),
  };
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});
