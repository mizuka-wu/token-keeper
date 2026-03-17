import { PrismaClient } from "@prisma/client";
import path from "path";
import { app } from "electron";

let prisma: PrismaClient;

function getDatabaseUrl(): string {
  const userDataPath = app.getPath("userData");
  const dataDir = path.join(userDataPath, "data");
  const dbPath = path.join(dataDir, "tokens.db");
  return `file:${dbPath}`;
}

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: getDatabaseUrl(),
        },
      },
    });
  }
  return prisma;
}

export async function initializeDatabase() {
  const client = getPrismaClient();

  // Create default group if it doesn't exist
  const defaultGroup = await client.group.findUnique({
    where: { name: "Default" },
  });

  if (!defaultGroup) {
    await client.group.create({
      data: {
        name: "Default",
        description: "Default group for tokens",
      },
    });
  }

  console.log("Database initialized successfully");
}

export async function closePrisma() {
  if (prisma) {
    await prisma.$disconnect();
  }
}
