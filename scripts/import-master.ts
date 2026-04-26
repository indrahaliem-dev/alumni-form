import fs from "node:fs";
import path from "node:path";

import * as xlsx from "xlsx";

import { prisma } from "../lib/prisma";

type RawRow = Record<string, unknown>;

const inputPath = process.argv[2] ?? "./data/master.xlsx";
const resolvedPath = path.isAbsolute(inputPath)
  ? inputPath
  : path.resolve(process.cwd(), inputPath);

async function main() {
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
    const nomerInduk = String(row["nomer_induk"] ?? "").trim();
    const namaLengkap = String(row["nama_lengkap"] ?? "").trim();
    const asal = String(row["asal"] ?? "").trim();

    if (!nomerInduk || !namaLengkap) {
      skipped += 1;
      continue;
    }

    processed += 1;

    const existing = await prisma.alumniMaster.findUnique({
      where: { nomerInduk },
      select: { id: true },
    });

    if (existing) {
      updated += 1;
      await prisma.alumniMaster.update({
        where: { nomerInduk },
        data: { namaLengkap, asal },
      });
    } else {
      inserted += 1;
      await prisma.alumniMaster.create({
        data: { nomerInduk, namaLengkap, asal },
      });
    }
  }

  console.log(
    [
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
