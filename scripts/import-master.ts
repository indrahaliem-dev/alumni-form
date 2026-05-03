import fs from "node:fs";
import path from "node:path";

import * as xlsx from "xlsx";

import { prisma } from "../lib/prisma";
import { loadEnvLocal } from "./load-env-local";

type RawRow = Record<string, unknown>;

const inputPath = process.argv[2] ?? "./data/master.xlsx";
const resolvedPath = path.isAbsolute(inputPath)
  ? inputPath
  : path.resolve(process.cwd(), inputPath);

async function main() {
  loadEnvLocal();

  if (!process.env.DATABASE_URL?.trim()) {
    console.error(
      "Butuh DATABASE_URL di .env.local — connection string Postgres Supabase (port 5432, bukan file Excel)."
    );
    process.exit(1);
  }

  if (!fs.existsSync(resolvedPath)) {
    console.error(`File not found: ${resolvedPath}`);
    process.exit(1);
  }

  const workbook = xlsx.readFile(resolvedPath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    console.error("No sheets found in Excel file.");
    process.exit(1);
  }

  const sheet = workbook.Sheets[sheetName];
  const rows = xlsx.utils.sheet_to_json<RawRow>(sheet, { defval: "" });

  let processed = 0;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const nomorId = String(row["nomer_induk"] ?? row["nomor_id"] ?? "").trim();
    const nama = String(row["nama_lengkap"] ?? row["nama"] ?? "").trim();
    const konsulat = String(row["asal"] ?? row["konsulat"] ?? "").trim();

    if (!nomorId || !nama) {
      skipped += 1;
      continue;
    }

    processed += 1;

    const existing = await prisma.alumniMaster.findFirst({
      where: { nomorId },
      select: { id: true },
    });

    if (existing) {
      await prisma.alumniMaster.update({
        where: { id: existing.id },
        data: { nama, konsulat },
      });
      updated += 1;
    } else {
      await prisma.alumniMaster.create({
        data: {
          nomorId,
          nama,
          konsulat,
          sudahIsi: false,
        },
      });
      inserted += 1;
    }
  }

  console.log(
    [
      "Target: Supabase Postgres (DATABASE_URL)",
      `Processed: ${processed}`,
      `Inserted: ${inserted}`,
      `Updated: ${updated}`,
      `Skipped: ${skipped}`,
    ].join(" | ")
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
