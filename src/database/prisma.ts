import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      errorFormat: "pretty",
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
