import { z } from 'zod';

export const POSTGRES_INTEGER_MAX = 2_147_483_647;

export const databaseIdSchema = z
  .number()
  .int()
  .positive()
  .max(POSTGRES_INTEGER_MAX);

export const coercedDatabaseIdSchema = z.coerce
  .number()
  .int()
  .positive()
  .max(POSTGRES_INTEGER_MAX);

export const nonNegativeDatabaseIntegerSchema = z
  .number()
  .int()
  .nonnegative()
  .max(POSTGRES_INTEGER_MAX);
