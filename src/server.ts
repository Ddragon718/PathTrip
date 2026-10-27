import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';

const server = app.listen(env.PORT, env.HOST, () => {
  console.log(`PathTrip API listening on http://${env.HOST}:${env.PORT}`);
});

const shutdown = (signal: string): void => {
  console.log(`${signal} received. Shutting down gracefully.`);
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
