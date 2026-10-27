import { z } from 'zod';

const bcryptPassword = z
  .string()
  .refine(
    (value) => Buffer.byteLength(value, 'utf8') <= 72,
    '비밀번호는 UTF-8 기준 72바이트 이하여야 합니다.'
  );

export const signupSchema = z
  .object({
    email: z
      .string()
      .trim()
      .max(254)
      .email('올바른 이메일 형식이어야 합니다.')
      .transform((v) => v.toLowerCase()),
    password: bcryptPassword
      .min(8, '비밀번호는 8자 이상이어야 합니다.')
      .max(72, '비밀번호는 72자 이하여야 합니다.'),
    nickname: z.string().trim().min(2).max(30),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .max(254)
      .email()
      .transform((v) => v.toLowerCase()),
    password: bcryptPassword.min(1).max(72),
  })
  .strict();

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
