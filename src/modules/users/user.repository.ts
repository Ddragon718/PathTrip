import { prisma } from '../../lib/prisma.js';

export const userRepository = {
  findById(id: number) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, email: true, nickname: true, role: true },
    });
  },
};
