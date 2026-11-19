// scripts/vendor-mermaid.mjs — self-host Mermaid's ESM build.
//
// Posts render diagrams with Mermaid, loaded the first time a post needs it.
// Loading it from a public CDN broke for anyone whose firewall or filter list
// blocks that CDN (Portmaster, some DNS blocklists, corporate proxies), so the
// site serves its own pinned copy instead:
//
//   assets/vendor/mermaid/<version>/mermaid.esm.min.mjs   entry point
//   assets/vendor/mermaid/<version>/chunks/…               lazily imported parts
//
// Run it in the dev container, then commit the new folder:
//
//   docker compose run --rm jekyll node scripts/vendor-mermaid.mjs 12.3.0
//
// It checks the tarball against the npm registry's sha512, replaces any other
// vendored version, and updates MERMAID_VERSION in apps/blog.js to match.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cp, mkdtemp, mkdir, readFile, readdir, rm, rename, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const version = process.argv[2];
if (!/^\d+\.\d+\.\d+$/.test(version || '')) {
  console.error('usage: node scripts/vendor-mermaid.mjs <version>   (e.g. 12.3.0)');
  process.exit(1);
}

const repo = fileURLToPath(new URL('..', import.meta.url));
const vendorDir = join(repo, 'assets', 'vendor', 'mermaid');
const blogJs = join(repo, 'assets', 'js', 'echoos', 'apps', 'blog.js');

const meta = await (await fetch(`https://registry.npmjs.org/mermaid/${version}`)).json();
if (!meta.dist) throw new Error(`mermaid@${version} is not on the npm registry`);
const tarball = Buffer.from(await (await fetch(meta.dist.tarball)).arrayBuffer());
const [algo, expected] = meta.dist.integrity.split('-');
const actual = createHash(algo).update(tarball).digest('base64');
if (actual !== expected) throw new Error(`integrity mismatch for ${meta.dist.tarball}`);

const work = await mkdtemp(join(tmpdir(), 'mermaid-'));
try {
  await writeFile(join(work, 'pkg.tgz'), tarball);
  // Only the ESM entry, its chunks and the licence: dist/ also holds UMD and
  // core builds and source maps, which the site never loads.
  execFileSync('tar', [
    '-xzf', 'pkg.tgz', '--exclude=*.map',
    'package/LICENSE', 'package/dist/mermaid.esm.min.mjs', 'package/dist/chunks/mermaid.esm.min',
  ], { cwd: work });

  const out = join(work, 'package', 'dist');
  await rename(join(work, 'package', 'LICENSE'), join(out, 'LICENSE'));
  await rm(vendorDir, { recursive: true, force: true });
  await mkdir(vendorDir, { recursive: true });
  // cp, not rename: /tmp and the bind-mounted repo are different devices.
  await cp(out, join(vendorDir, version), { recursive: true });
} finally {
  await rm(work, { recursive: true, force: true });
}

const src = await readFile(blogJs, 'utf8');
const next = src.replace(/const MERMAID_VERSION = '[^']*';/, `const MERMAID_VERSION = '${version}';`);
if (next === src && !src.includes(`const MERMAID_VERSION = '${version}';`)) {
  throw new Error('MERMAID_VERSION not found in assets/js/echoos/apps/blog.js');
}
await writeFile(blogJs, next);

const chunks = await readdir(join(vendorDir, version, 'chunks', 'mermaid.esm.min'));
console.log(`vendor-mermaid: mermaid@${version} → assets/vendor/mermaid/${version}/ (${chunks.length} chunks)`);
