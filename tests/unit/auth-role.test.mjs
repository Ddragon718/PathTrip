import assert from 'node:assert/strict';
import test from 'node:test';
import bcrypt from 'bcrypt';
import { authService } from '../../dist/modules/auth/auth.service.js';
import { authRepository } from '../../dist/modules/auth/auth.repository.js';

test('로그인은 DB의 역할을 반환하고 비밀번호 해시를 노출하지 않는다', async (t) => {
  const passwordHash = await bcrypt.hash('test-password-only', 4);
  const lookup = t.mock.method(authRepository, 'findUserByEmail');
  for (const role of ['USER', 'ADMIN']) {
    lookup.mock.mockImplementation(async () => ({
      id: 1,
      email: 'test@example.com',
      nickname: '테스트',
      role,
      passwordHash,
    }));
    const result = await authService.login({
      email: 'test@example.com',
      password: 'test-password-only',
    });
    assert.equal(result.user.role, role);
    assert.equal(result.user.passwordHash, undefined);
    assert.equal(typeof result.accessToken, 'string');
  }
});

test('회원가입은 클라이언트가 보낸 관리자 역할을 DB 생성에 전달하지 않는다', async (t) => {
  t.mock.method(authRepository, 'findUserByEmail', async () => null);
  const create = t.mock.method(authRepository, 'createUser', async (data) => ({
    ...data,
    id: 2,
    role: 'USER',
  }));
  const user = await authService.signup({
    email: 'new@example.com',
    password: 'test-password-only',
    nickname: '새 사용자',
    role: 'ADMIN',
  });
  assert.equal(create.mock.calls[0].arguments[0].role, undefined);
  assert.equal(user.role, 'USER');
});
