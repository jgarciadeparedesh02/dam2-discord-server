import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const userData: Prisma.UserCreateInput[] = [
    {
      username: "luna",
      email: "luna@example.com",
      password: "LunaPassword",
      photoUrl: "https://picsum.photos/200/300?image=1027",
    },
    {
      username: "max",
      email: "max@example.com",
      password: "MaxPassword",
      photoUrl: "https://picsum.photos/200/300?image=1028",
    },
    {
      username: "cooper",
      email: "cooper@example.com",
      password: "CooperPassword",
      photoUrl: "https://picsum.photos/200/300?image=1029",
    },
  ];

async function main() {
    console.log(`Start seeding ...`);
    for (const u of userData) {
        // create pet if not exists
        const user = await prisma.user.upsert({
            where: { email: u.email },
            create: u,
            update: {},
        });
        console.log(`Upserted User with id: ${user.id}`);
    }
    console.log(`Seeding finished.`);
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });