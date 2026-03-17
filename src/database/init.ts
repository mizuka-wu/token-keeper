import path from "path";
import { app } from "electron";
import fs from "fs";

let dbPath: string;
let client: any = null;

function getDbPath(): string {
  if (!dbPath) {
    const appDataPath = app.getPath("userData");
    dbPath = path.join(appDataPath, "tokens.db");

    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  return dbPath;
}

export async function initializeDatabase() {
  const dbFile = getDbPath();

  const Database = (await import("libsql")).default;
  client = new Database(dbFile);

  client.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create default group if it doesn't exist
  const defaultGroupStmt = client.prepare(
    "SELECT COUNT(*) as count FROM groups WHERE name = ?",
  );
  const result = defaultGroupStmt.get(["Default"]) as any;
  if (result.count === 0) {
    client.exec(
      "INSERT INTO groups (name, description, active) VALUES (?, ?, ?)",
      ["Default", "Default group for tokens", 1],
    );
  }

  client.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      env_name TEXT,
      description TEXT,
      tags TEXT,
      website TEXT,
      expired_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  client.exec(`
    CREATE TABLE IF NOT EXISTS group_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      token_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
      UNIQUE(group_id, token_id)
    )
  `);

  return client;
}

export function getDatabase() {
  if (!client) {
    const dbFile = getDbPath();
    const Database = require("libsql");
    client = new Database(dbFile);
  }
  return client;
}
