import type { ForgeConfig } from '@electron-forge/shared-types';
import { MakerSquirrel } from '@electron-forge/maker-squirrel';
import { MakerZIP } from '@electron-forge/maker-zip';
import { MakerDeb } from '@electron-forge/maker-deb';
import { MakerRpm } from '@electron-forge/maker-rpm';
import { VitePlugin } from '@electron-forge/plugin-vite';
import { FusesPlugin } from '@electron-forge/plugin-fuses';
import { AutoUnpackNativesPlugin } from '@electron-forge/plugin-auto-unpack-natives';
import { FuseV1Options, FuseVersion } from '@electron/fuses';
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

// Recursively copy a node_modules dependency and its production-dep tree
// from the project's node_modules into the packaging staging dir.
async function copyDepTree(
  rootNm: string,
  dstNm: string,
  name: string,
  seen = new Set<string>(),
) {
  if (seen.has(name)) return;
  seen.add(name);
  const src = path.join(rootNm, name);
  const dst = path.join(dstNm, name);
  await fs.mkdir(path.dirname(dst), { recursive: true });
  await fs.cp(src, dst, { recursive: true });

  try {
    const pkgJson = JSON.parse(
      await fs.readFile(path.join(src, 'package.json'), 'utf8'),
    );
    const deps = Object.keys(pkgJson.dependencies ?? {});
    for (const dep of deps) {
      // Skip if not present at the root (npm hoisting can put it elsewhere; for v1 just bail)
      try {
        await fs.access(path.join(rootNm, dep));
        await copyDepTree(rootNm, dstNm, dep, seen);
      } catch {
        /* dep hoisted to a nested node_modules — skip */
      }
    }
  } catch {
    /* no package.json or unparseable — leaf */
  }
}

const config: ForgeConfig = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    new MakerSquirrel({}),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({}),
    new MakerDeb({}),
  ],
  hooks: {
    // plugin-vite ships only the bundled output into the asar; native deps need
    // to be copied in manually, with the right-arch prebuild fetched. Run in
    // packageAfterPrune so it runs after @electron/rebuild — otherwise the
    // rebuild step overwrites our prebuild fetch with the host arch.
    packageAfterPrune: async (_forgeConfig, buildPath, electronVersion, platform, arch) => {
      const projRoot = process.cwd();
      const rootNm = path.join(projRoot, 'node_modules');
      const dstNm = path.join(buildPath, 'node_modules');

      // Only better-sqlite3 needs to ship as a real node_modules entry; everything
      // else (react, zustand, fuse.js, electron-squirrel-startup) is pure JS and
      // is already bundled into the .vite output by Vite.
      await copyDepTree(rootNm, dstNm, 'better-sqlite3');

      // Strip the local platform's .node so prebuild-install can drop in the
      // target platform's binary cleanly.
      const releaseDir = path.join(dstNm, 'better-sqlite3', 'build', 'Release');
      try {
        const files = await fs.readdir(releaseDir);
        for (const f of files) {
          if (f.endsWith('.node')) {
            await fs.rm(path.join(releaseDir, f));
          }
        }
      } catch {
        /* no build dir, prebuild-install will create one */
      }

      // Fetch the prebuilt binary for the target platform/arch.
      const prebuildBin = path.join(rootNm, 'prebuild-install', 'bin.js');
      execFileSync(
        'node',
        [
          prebuildBin,
          '--runtime=electron',
          `--target=${electronVersion}`,
          `--platform=${platform}`,
          `--arch=${arch}`,
        ],
        {
          cwd: path.join(dstNm, 'better-sqlite3'),
          stdio: 'inherit',
        },
      );
    },
  },
  plugins: [
    new AutoUnpackNativesPlugin({}),
    new VitePlugin({
      build: [
        {
          entry: 'src/main.ts',
          config: 'vite.main.config.ts',
          target: 'main',
        },
        {
          entry: 'src/preload.ts',
          config: 'vite.preload.config.ts',
          target: 'preload',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.mts',
        },
      ],
    }),
    // FusesPlugin needs `codesign` on the host machine to re-sign the binary
    // after flipping fuses, so it can't run when cross-building darwin from
    // Linux. Skip it for darwin targets and keep it for everything else.
    ...(process.argv.some((a) => a.includes('darwin'))
      ? []
      : [
          new FusesPlugin({
            version: FuseVersion.V1,
            [FuseV1Options.RunAsNode]: false,
            [FuseV1Options.EnableCookieEncryption]: true,
            [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
            [FuseV1Options.EnableNodeCliInspectArguments]: false,
            [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
            [FuseV1Options.OnlyLoadAppFromAsar]: true,
          }),
        ]),
  ],
};

export default config;
