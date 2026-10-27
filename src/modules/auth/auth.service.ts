import { Prisma, type UserRole } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { ERROR_CODE } from '../../constants/error-code.js';
import { AppError } from '../../utils/AppError.js';
import { authRepository } from './auth.repository.js';
import type { LoginInput, SignupInput } from './auth.validator.js';

const publicUser = (user: {
  id: number;
  email: string;
  nickname: string;
  role: UserRole;
}) => ({
  id: user.id,
  email: user.email,
  nickname: user.nickname,
  role: user.role,
});

export const authService = {
  async signup(input: SignupInput) {
    const existingUser = await authRepository.findUserByEmail(input.email);
    if (existingUser) {
      throw new AppError(
        409,
        ERROR_CODE.EMAIL_ALREADY_EXISTS,
        '이미 가입된 이메일입니다.'
      );
    }

    const passwordHash = await bcrypt.hash(
      input.password,
      env.BCRYPT_SALT_ROUNDS
    );

    try {
      const user = await authRepository.createUser({
        email: input.email,
        passwordHash,
        nickname: input.nickname,
      });
      return publicUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new AppError(
          409,
          ERROR_CODE.EMAIL_ALREADY_EXISTS,
          '이미 가입된 이메일입니다.'
        );
      }
      throw error;
    }
  },

  async login(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email);
    const isValid = user
      ? await bcrypt.compare(input.password, user.passwordHash)
      : false;

    if (!user || !isValid) {
      throw new AppError(
        401,
        ERROR_CODE.INVALID_CREDENTIALS,
        '이메일 또는 비밀번호가 올바르지 않습니다.'
      );
    }

    const options: SignOptions = {
      expiresIn: env.ACCESS_EXPIRES_IN as NonNullable<SignOptions['expiresIn']>,
    };
    const accessToken = jwt.sign({ email: user.email }, env.ACCESS_SECRET, {
      ...options,
      subject: String(user.id),
    });

    return { accessToken, user: publicUser(user) };
  },
};
