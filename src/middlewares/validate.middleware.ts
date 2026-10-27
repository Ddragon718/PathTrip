import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

type RequestTarget = 'body' | 'params' | 'query';

export const validate =
  (schema: ZodType, target: RequestTarget = 'body'): RequestHandler =>
  (request, _response, next) => {
    const parsed = schema.safeParse(request[target]);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    if (target === 'query') {
      // Express 5 exposes req.query through a getter that reparses the URL on
      // every access. Define an own property so Zod defaults/coercions survive.
      Object.defineProperty(request, 'query', {
        value: parsed.data,
        configurable: true,
        enumerable: true,
      });
    } else {
      Object.assign(request[target], parsed.data);
    }
    next();
  };
