import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './msw/server';

let originalGetComputedStyle: typeof window.getComputedStyle | null = null;

const storageState: Record<string, string> = {};
const storage: Storage = {
  getItem: (key: string) => (key in storageState ? storageState[key] : null),
  setItem: (key: string, value: string) => {
    storageState[key] = String(value);
  },
  removeItem: (key: string) => {
    delete storageState[key];
  },
  clear: () => {
    Object.keys(storageState).forEach((key) => delete storageState[key]);
  },
  key: (index: number) => Object.keys(storageState)[index] ?? null,
  get length() {
    return Object.keys(storageState).length;
  }
};

Object.defineProperty(globalThis, 'localStorage', {
  value: storage,
  configurable: true
});

Object.defineProperty(window, 'localStorage', {
  value: storage,
  configurable: true
});

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' });

  class ResizeObserverMock {
    observe = vi.fn();

    unobserve = vi.fn();

    disconnect = vi.fn();
  }

  Object.defineProperty(globalThis, 'ResizeObserver', {
    writable: true,
    value: ResizeObserverMock
  });

  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  });

  window.scrollTo = vi.fn();

  const baseGetComputedStyle = window.getComputedStyle.bind(window) as typeof window.getComputedStyle;
  originalGetComputedStyle = baseGetComputedStyle;

  // Work around jsdom warning when rc-util queries ::-webkit-scrollbar styles.
  const patchedGetComputedStyle: typeof window.getComputedStyle = (element, pseudoElt) => {
    if (pseudoElt === '::-webkit-scrollbar') {
      return baseGetComputedStyle(element);
    }

    return baseGetComputedStyle(element, pseudoElt);
  };

  Object.defineProperty(window, 'getComputedStyle', {
    configurable: true,
    writable: true,
    value: patchedGetComputedStyle
  });
  Object.defineProperty(globalThis, 'getComputedStyle', {
    configurable: true,
    writable: true,
    value: patchedGetComputedStyle
  });
});

afterEach(async () => {
  cleanup();
  server.resetHandlers();
  window.localStorage.clear();

  const { useAuthStore } = await import('@stores/auth.store');
  useAuthStore.setState({
    accessToken: null,
    refreshToken: null,
    user: null,
    isAuthenticated: false,
    authInitialized: true
  });
});

afterAll(() => {
  if (originalGetComputedStyle) {
    Object.defineProperty(window, 'getComputedStyle', {
      configurable: true,
      writable: true,
      value: originalGetComputedStyle
    });
    Object.defineProperty(globalThis, 'getComputedStyle', {
      configurable: true,
      writable: true,
      value: originalGetComputedStyle
    });
  }

  server.close();
});
