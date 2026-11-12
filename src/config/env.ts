import 'dotenv/config';
import { z } from 'zod';

const booleanFromString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3113),
  HOST: z.string().min(1).default('127.0.0.1'),
  DATABASE_URL: z
    .string()
    .min(1)
    .default('postgresql://postgres:postgres@localhost:5432/pathtrip'),
  CLIENT_URL: z.string().default('http://localhost:3000'),
  ACCESS_SECRET: z
    .string()
    .min(16)
    .default('development-access-secret-change-me'),
  ACCESS_EXPIRES_IN: z
    .string()
    .regex(/^\d+(?:ms|s|m|h|d|w|y)$/, '예: 15m, 1h, 7d 형식이어야 합니다.')
    .default('15m'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
  KAKAO_MAP_REST_API_KEY: z.string().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  GOOGLE_GEOCODING_API_KEY: z.string().optional(),
  DEBUG_MODE: booleanFromString,
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const messages = result.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join(', ');
  throw new Error(`환경 변수 설정이 올바르지 않습니다: ${messages}`);
}

export const env = result.data;
