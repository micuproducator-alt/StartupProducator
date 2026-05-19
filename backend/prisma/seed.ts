import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Pornire proces de import date geografice...");

  const sqlPath = path.join(__dirname, "data_corected_character_casing.sql");
  const sqlFile = fs.readFileSync(sqlPath, "utf-8");

  // 1. Curățare tabele înainte de import (Opțional)
  await prisma.locations.deleteMany({});
  await prisma.counties.deleteMany({});

  // 2. Parsare și Import Județe
  const countyRegex = /\((\d+),\s*(\d+),\s*'([^']+)'\)/g;
  const counties = [];
  let match;
  while ((match = countyRegex.exec(sqlFile)) !== null) {
    counties.push({
      id: parseInt(match[1]),
      county_code: parseInt(match[2]),
      name: match[3],
    });
  }
  console.log(`📦 Importăm ${counties.length} județe...`);
  await prisma.counties.createMany({ data: counties });

  // 3. Parsare și Import Localități
  // În SQL-ul tău numele localității este între ghilimele duble " "
  const locationRegex = /\((\d+),\s*(\d+),\s*(\d+),\s*"([^"]+)"\)/g;
  const locations = [];
  while ((match = locationRegex.exec(sqlFile)) !== null) {
    locations.push({
      id: parseInt(match[1]),
      siruta: parseInt(match[2]),
      county_code: parseInt(match[3]),
      name: match[4],
    });
  }

  console.log(
    `📦 Am găsit ${locations.length} localități. Se inserează în tranșe...`,
  );

  const chunkSize = 1000;
  for (let i = 0; i < locations.length; i += chunkSize) {
    const chunk = locations.slice(i, i + chunkSize);
    await prisma.locations.createMany({ data: chunk });
    console.log(
      `✅ Progres: ${Math.min(i + chunkSize, locations.length)} / ${locations.length}`,
    );
  }

  console.log("🏁 IMPORT COMPLET!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
