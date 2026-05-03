import { prisma } from "../lib/prisma";
import { loadEnvLocal } from "./load-env-local";

async function main() {
  loadEnvLocal();

  if (!process.env.DATABASE_URL?.trim()) {
    console.error(
      "Butuh DATABASE_URL di .env.local — connection string Postgres Supabase."
    );
    process.exit(1);
  }

  const count = await prisma.alumniMaster.count();
  console.log("alumni_master count =", count);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
