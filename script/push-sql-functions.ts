import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function loadAndExecuteSQLFiles() {
  const sqlDir = path.join(__dirname, '..', 'sql-functions');

  const files = fs.readdirSync(sqlDir);
  for (const file of files) {
    const filePath = path.join(sqlDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      await prisma.$executeRawUnsafe(sql);
      console.log(`Executed SQL from file: ${file}`);
    } catch (error) {
      console.error(`Failed to execute SQL from file: ${file}`, error);
    }
  }
}

// Execute the function and handle cleanup
loadAndExecuteSQLFiles()
  .then(() => {
    console.log('SQL functions pushed successfully.');
  })
  .catch((error) => {
    console.error('Error pushing SQL functions:', error);
  })
  .finally(() => {
    prisma.$disconnect();
  });
