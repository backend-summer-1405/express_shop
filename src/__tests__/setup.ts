import { prisma } from '../lib/prisma';
beforeAll(async () => {
  await prisma.$transaction([
    prisma.rating.deleteMany(),
    prisma.like.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.news.deleteMany(),
    prisma.profileImage.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.wallet.deleteMany(),
    prisma.user.deleteMany(),
  ]);
});

afterAll(async () => {
  await prisma.$disconnect();
});
