import { app } from "electron";
import * as path from "path";
import fs from "fs";

interface GroupConfig {
  activeGroupId: number | null;
}

let configPath: string;
let config: GroupConfig = {
  activeGroupId: null,
};

function getConfigPath(): string {
  if (!configPath) {
    const appDataPath = app.getPath("userData");
    configPath = path.join(appDataPath, "group-config.json");
  }
  return configPath;
}

function loadConfig(): void {
  const configFilePath = getConfigPath();
  try {
    if (fs.existsSync(configFilePath)) {
      const data = fs.readFileSync(configFilePath, "utf-8");
      config = JSON.parse(data);
    } else {
      config = { activeGroupId: null };
      saveConfig();
    }
  } catch (error) {
    console.error("Failed to load group config:", error);
    config = { activeGroupId: null };
  }
}

function saveConfig(): void {
  const configFilePath = getConfigPath();
  try {
    const dir = path.dirname(configFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save group config:", error);
  }
}

export function initializeGroupConfig(): void {
  loadConfig();
}

export function getActiveGroupId(): number | null {
  return config.activeGroupId;
}

export function setActiveGroupId(groupId: number | null): void {
  config.activeGroupId = groupId;
  saveConfig();
}

export function getGroupConfig(): GroupConfig {
  return { ...config };
}
