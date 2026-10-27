import { prisma } from '../../lib/prisma.js';

export const authRepository = {
  findUserByEmail(email: string) {
    return prisma.user.findFirst({ where: { email, deletedAt: null } });
  },

  createUser(data: { email: string; passwordHash: string; nickname: string }) {
    return prisma.user.create({ data });
  },
};
