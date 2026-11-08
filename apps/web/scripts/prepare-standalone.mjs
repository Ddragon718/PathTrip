import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const appRoot = resolve(import.meta.dirname, '..');
const staticSource = resolve(appRoot, '.next/static');
const standaloneRoot = resolve(appRoot, '.next/standalone/apps/web');
const standaloneNext = resolve(standaloneRoot, '.next');

mkdirSync(standaloneNext, { recursive: true });
cpSync(staticSource, resolve(standaloneNext, 'static'), {
  recursive: true,
  force: true,
});
cpSync(resolve(appRoot, 'public'), resolve(standaloneRoot, 'public'), {
  recursive: true,
  force: true,
});
