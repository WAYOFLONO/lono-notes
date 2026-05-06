import { randomUUID } from 'node:crypto';
import path from 'node:path';
import fs from 'node:fs';
import { app, clipboard, ipcMain, net, protocol } from 'electron';
import { pathToFileURL } from 'node:url';

const SCHEME = 'lono-img';

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

function screenshotsDir(): string {
  const dir = path.join(app.getPath('userData'), 'screenshots');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function registerScreenshotsScheme() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      privileges: {
        standard: true,
        secure: true,
        supportFetchAPI: true,
        stream: true,
      },
    },
  ]);
}

export function registerScreenshotsHandlers() {
  const dir = screenshotsDir();

  protocol.handle(SCHEME, (request) => {
    const url = new URL(request.url);
    // URLs look like: lono-img://images/<filename>
    const filename = path.basename(url.pathname);
    if (!filename) {
      return new Response('not found', { status: 404 });
    }
    const filePath = path.join(dir, filename);
    if (!filePath.startsWith(dir)) {
      return new Response('forbidden', { status: 403 });
    }
    if (!fs.existsSync(filePath)) {
      return new Response('not found', { status: 404 });
    }
    return net.fetch(pathToFileURL(filePath).toString());
  });

  ipcMain.handle(
    'screenshots:save',
    async (_e, payload: { mime: string; data: Uint8Array }) => {
      const ext = MIME_TO_EXT[payload.mime] ?? 'png';
      const filename = `${randomUUID()}.${ext}`;
      const target = path.join(dir, filename);
      await fs.promises.writeFile(target, Buffer.from(payload.data));
      return `${SCHEME}://images/${filename}`;
    },
  );

  // Reads an image from the OS clipboard via Electron's native API
  // (more reliable than browser clipboardData.items, especially on Linux/WSLg).
  ipcMain.handle('screenshots:pasteFromClipboard', async () => {
    const image = clipboard.readImage();
    if (image.isEmpty()) return null;
    const buffer = image.toPNG();
    if (buffer.length === 0) return null;
    const filename = `${randomUUID()}.png`;
    const target = path.join(dir, filename);
    await fs.promises.writeFile(target, buffer);
    return `${SCHEME}://images/${filename}`;
  });
}
