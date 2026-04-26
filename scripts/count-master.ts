import { prisma } from "../lib/prisma";

async function main() {
  const count = await prisma.alumniMaster.count();
  console.log("AlumniMaster count =", count);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
