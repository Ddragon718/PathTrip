import assert from 'node:assert/strict';
import test from 'node:test';
import { request } from 'node:http';
import { brotliCompressSync, gzipSync } from 'node:zlib';
import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { createApp } from '../../dist/app.js';
import { env } from '../../dist/config/env.js';
import { validate } from '../../dist/middlewares/validate.middleware.js';

const authorization = `Bearer ${jwt.sign(
  { email: 'test@pathtrip.local' },
  env.ACCESS_SECRET,
  { subject: '1', expiresIn: '5m' }
)}`;

const withServer = async (callback, application = createApp()) => {
  const server = application.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  const address = server.address();
  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve()))
    );
  }
};

test('상태 확인 API가 동작한다', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
    assert.equal(body.data.status, 'ok');
  });
});

test('인증 없이 여행 API를 호출하면 401을 반환한다', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/trips`);
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.code, 'UNAUTHORIZED');
  });
});

test('모든 보호 API가 인증 없이 접근을 차단한다', async () => {
  const paths = [
    '/api/v1/users/me',
    '/api/v1/trips/1/places',
    '/api/v1/places/1',
    '/api/v1/trips/1/routes',
    '/api/v1/maps/search?q=제주',
  ];
  await withServer(async (baseUrl) => {
    for (const path of paths) {
      const response = await fetch(`${baseUrl}${path}`);
      assert.equal(response.status, 401, path);
      assert.equal((await response.json()).code, 'UNAUTHORIZED', path);
    }
  });
});

test('잘못된 회원가입 본문은 400을 반환한다', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'not-email',
        password: 'short',
        nickname: 'x',
      }),
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.code, 'INVALID_INPUT');
  });
});

test('잘못된 JSON 본문은 500이 아닌 400을 반환한다', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{"email":',
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.code, 'INVALID_INPUT');
  });
});

test('허용 크기를 넘는 JSON 본문은 413을 반환한다', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ value: 'x'.repeat(1_100_000) }),
    });
    assert.equal(response.status, 413);
    assert.equal((await response.json()).code, 'INVALID_INPUT');
  });
});

test('압축된 JSON도 해제 후 본문 크기 제한을 적용한다', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/auth/signup`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-encoding': 'gzip',
      },
      body: gzipSync(JSON.stringify({ value: 'x'.repeat(1_100_000) })),
    });
    assert.equal(response.status, 413);
    assert.equal((await response.json()).code, 'INVALID_INPUT');
    assert.equal((await fetch(`${baseUrl}/health`)).status, 200);
  });
});

test('압축 프레임 뒤에 늦게 도착하는 바이트가 서버를 종료시키지 않는다', async () => {
  await withServer(async (baseUrl) => {
    // Local regression fixture for the body-parser decompression lifecycle.
    const frame = brotliCompressSync(Buffer.from('{}'));
    let finishSending;
    const sent = new Promise((resolve) => {
      finishSending = resolve;
    });
    const response = new Promise((resolve, reject) => {
      const req = request(
        `${baseUrl}/api/v1/auth/signup`,
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'content-encoding': 'br',
          },
        },
        (res) => {
          res.resume();
          res.on('end', () => resolve(res.statusCode));
          res.on('error', reject);
        }
      );
      req.on('error', reject);
      req.setTimeout(3000, () => req.destroy(new Error('Request timed out')));
      req.write(frame);
      setTimeout(() => {
        req.end(Buffer.from('trailing-bytes'));
        finishSending();
      }, 50);
    });
    const [status] = await Promise.all([response, sent]);
    assert.equal(status, 400);
    assert.equal((await fetch(`${baseUrl}/health`)).status, 200);
  });
});

test('인증 후 잘못된 경로 ID와 좌표를 검증한다', async () => {
  await withServer(async (baseUrl) => {
    const invalidId = await fetch(`${baseUrl}/api/v1/trips/not-a-number`, {
      headers: { authorization },
    });
    assert.equal(invalidId.status, 400);

    const invalidCoordinate = await fetch(`${baseUrl}/api/v1/trips/1/places`, {
      method: 'POST',
      headers: { authorization, 'content-type': 'application/json' },
      body: JSON.stringify({
        name: '잘못된 장소',
        category: 'CAFE',
        latitude: 91,
        longitude: 181,
      }),
    });
    const body = await invalidCoordinate.json();
    assert.equal(invalidCoordinate.status, 400);
    assert.equal(body.code, 'INVALID_COORDINATE');
  });
});

test('역전된 여행 날짜는 DB 접근 전에 거부한다', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/trips`, {
      method: 'POST',
      headers: { authorization, 'content-type': 'application/json' },
      body: JSON.stringify({
        title: '제주 여행',
        region: '제주',
        startDate: '2026-06-03',
        endDate: '2026-06-01',
      }),
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.code, 'INVALID_DATE_RANGE');
  });
});

test('Express 5 query getter에서도 변환값과 기본값을 유지한다', async () => {
  const application = express();
  application.get(
    '/query',
    validate(
      z.object({
        page: z.coerce.number().int().positive().default(1),
      }),
      'query'
    ),
    (request, response) => response.json(request.query)
  );

  await withServer(async (baseUrl) => {
    const defaultResponse = await fetch(`${baseUrl}/query`);
    assert.deepEqual(await defaultResponse.json(), { page: 1 });

    const coercedResponse = await fetch(`${baseUrl}/query?page=2`);
    const body = await coercedResponse.json();
    assert.equal(body.page, 2);
    assert.equal(typeof body.page, 'number');
  }, application);
});
