import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

test('웹 운영 출력에 지도 런타임과 정적 파일을 포함하고 환경 파일은 복사하지 않는다', () => {
  const fixture = mkdtempSync(join(tmpdir(), 'pathtrip-standalone-test-'));
  try {
    for (const directory of ['scripts', '.next/static/chunks', 'public']) {
      mkdirSync(join(fixture, directory), { recursive: true });
    }
    cpSync(
      new URL('../../apps/web/scripts/prepare-standalone.mjs', import.meta.url),
      join(fixture, 'scripts/prepare-standalone.mjs')
    );
    cpSync(
      new URL('../../apps/web/public/map-runtime.js', import.meta.url),
      join(fixture, 'public/map-runtime.js')
    );
    writeFileSync(
      join(fixture, '.next/static/chunks/app.js'),
      '/* static fixture */'
    );
    writeFileSync(join(fixture, '.env.local'), 'TEST_ONLY=not-a-secret');

    // Rerunning postbuild must also work when the destination already exists.
    for (let run = 0; run < 2; run += 1) {
      execFileSync(process.execPath, [
        join(fixture, 'scripts/prepare-standalone.mjs'),
      ]);
    }
    const output = join(fixture, '.next/standalone/apps/web');
    assert.equal(
      readFileSync(join(output, 'public/map-runtime.js'), 'utf8'),
      readFileSync(
        new URL('../../apps/web/public/map-runtime.js', import.meta.url),
        'utf8'
      )
    );
    assert.equal(
      readFileSync(join(output, '.next/static/chunks/app.js'), 'utf8'),
      '/* static fixture */'
    );
    assert.equal(existsSync(join(output, '.env.local')), false);
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
