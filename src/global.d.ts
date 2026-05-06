import type { LonoApi } from './preload';

declare global {
  interface Window {
    lono: LonoApi;
  }
}

export {};
