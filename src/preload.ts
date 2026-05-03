import { contextBridge } from 'electron';

const api = {
  version: '0.1.0',
};

contextBridge.exposeInMainWorld('lono', api);

export type LonoApi = typeof api;

declare global {
  interface Window {
    lono: LonoApi;
  }
}
