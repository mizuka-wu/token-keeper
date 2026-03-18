import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";
import { app } from "electron";
import fs from "fs";
import { Group } from "./entities/Group";
import { Token } from "./entities/Token";
import { GroupToken } from "./entities/GroupToken";

function getDatabasePath(): string {
  const userDataPath = app.getPath("userData");
  const dataDir = path.join(userDataPath, "data");

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  return path.join(dataDir, "tokens.db");
}

export const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: getDatabasePath(),
  entities: [Group, Token, GroupToken],
  synchronize: true,
  logging: false,
});

export async function initializeDatabase() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
    console.log("Database initialized successfully");
  }
}

export async function closeDatabase() {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
}
