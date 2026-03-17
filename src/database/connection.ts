import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";
import { app } from "electron";
import fs from "fs";
import { Group } from "./entities/Group";
import { Token } from "./entities/Token";
import { GroupToken } from "./entities/GroupToken";

let appDataPath: string;

function getDbPath(): string {
  if (!appDataPath) {
    appDataPath = app.getPath("userData");
    const dir = path.join(appDataPath, "data");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  return path.join(appDataPath, "data", "tokens.db");
}

export const AppDataSource = new DataSource({
  type: "better-sqlite3",
  database: getDbPath(),
  entities: [Group, Token, GroupToken],
  synchronize: true,
  logging: false,
  // Disable optional dependencies that are not needed
  dropSchema: false,
  cache: false,
});

export async function initializeDatabase() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();

    // Create default group if it doesn't exist
    const groupRepo = AppDataSource.getRepository(Group);
    const defaultGroup = await groupRepo.findOne({
      where: { name: "Default" },
    });

    if (!defaultGroup) {
      const group = groupRepo.create({
        name: "Default",
        description: "Default group for tokens",
      });
      await groupRepo.save(group);
    }

    console.log("Database initialized successfully");
  }
}

export function getDatabase() {
  if (!AppDataSource.isInitialized) {
    throw new Error("Database not initialized");
  }
  return AppDataSource;
}
