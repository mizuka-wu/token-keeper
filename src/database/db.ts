import type {
  Group,
  Token,
  TokenWithGroups,
  GroupWithTokens,
} from "../types/database";
import { getDatabase } from "./init";

function getClient() {
  return getDatabase();
}

// ============ Group Operations ============

export function createGroup(
  name: string,
  description?: string,
  active: number = 1,
): Group {
  const db = getClient();
  db.exec("INSERT INTO groups (name, description, active) VALUES (?, ?, ?)", [
    name,
    description || null,
    active,
  ]);

  const result = db.prepare("SELECT last_insert_rowid() as id").get() as any;
  const lastId = result.id as number;

  return getGroup(lastId)!;
}

export function getGroups(): Group[] {
  const db = getClient();
  const stmt = db.prepare("SELECT * FROM groups ORDER BY created_at DESC");
  return stmt.all() as Group[];
}

export function getGroup(id: number): Group | null {
  const db = getClient();
  const stmt = db.prepare("SELECT * FROM groups WHERE id = ?");
  const result = stmt.get([id]) as Group | undefined;
  return result || null;
}

export function updateGroup(
  id: number,
  name?: string,
  description?: string,
  active?: number,
): Group {
  const db = getClient();
  const updates: string[] = [];
  const args: any[] = [];

  if (name !== undefined) {
    updates.push("name = ?");
    args.push(name);
  }
  if (description !== undefined) {
    updates.push("description = ?");
    args.push(description);
  }
  if (active !== undefined) {
    updates.push("active = ?");
    args.push(active);
  }

  updates.push("updated_at = CURRENT_TIMESTAMP");
  args.push(id);

  db.exec(`UPDATE groups SET ${updates.join(", ")} WHERE id = ?`, args);

  return getGroup(id)!;
}

export function deleteGroup(id: number): void {
  const db = getClient();
  db.exec("DELETE FROM groups WHERE id = ?", [id]);
}

// ============ Token Operations ============

export function createToken(
  name: string,
  value: string,
  env_name?: string,
  description?: string,
  tags?: string[],
  website?: string,
  expired_at?: string,
): Token {
  const db = getClient();
  const tagsJson = tags ? JSON.stringify(tags) : null;

  db.exec(
    "INSERT INTO tokens (name, value, env_name, description, tags, website, expired_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      name,
      value,
      env_name || null,
      description || null,
      tagsJson,
      website || null,
      expired_at || null,
    ],
  );

  const result = db.prepare("SELECT last_insert_rowid() as id").get() as any;
  const lastId = result.id as number;

  return getToken(lastId)!;
}

export function getToken(id: number): Token | null {
  const db = getClient();
  const stmt = db.prepare("SELECT * FROM tokens WHERE id = ?");
  const result = stmt.get([id]) as any;
  return result ? parseToken(result) : null;
}

export function getTokens(): Token[] {
  const db = getClient();
  const stmt = db.prepare(`
    SELECT * FROM tokens 
    ORDER BY 
      CASE WHEN expired_at IS NULL THEN 0 ELSE 1 END,
      CASE WHEN expired_at IS NULL THEN created_at ELSE expired_at END DESC
  `);
  const results = stmt.all() as any[];
  return results.map(parseToken);
}

export function getGroupTokens(groupId: number): Token[] {
  const db = getClient();
  const stmt = db.prepare(`
    SELECT t.* FROM tokens t
    INNER JOIN group_tokens gt ON t.id = gt.token_id
    WHERE gt.group_id = ?
    ORDER BY 
      CASE WHEN t.expired_at IS NULL THEN 0 ELSE 1 END,
      CASE WHEN t.expired_at IS NULL THEN t.created_at ELSE t.expired_at END DESC
  `);
  const results = stmt.all([groupId]) as any[];
  return results.map(parseToken);
}

export function updateToken(
  id: number,
  updates: Partial<Omit<Token, "id" | "created_at" | "updated_at">>,
): Token {
  const db = getClient();
  const updateFields: string[] = [];
  const args: any[] = [];

  if (updates.name !== undefined) {
    updateFields.push("name = ?");
    args.push(updates.name);
  }
  if (updates.value !== undefined) {
    updateFields.push("value = ?");
    args.push(updates.value);
  }
  if (updates.env_name !== undefined) {
    updateFields.push("env_name = ?");
    args.push(updates.env_name);
  }
  if (updates.description !== undefined) {
    updateFields.push("description = ?");
    args.push(updates.description);
  }
  if (updates.tags !== undefined) {
    const tagsJson = Array.isArray(updates.tags)
      ? JSON.stringify(updates.tags)
      : updates.tags;
    updateFields.push("tags = ?");
    args.push(tagsJson);
  }
  if (updates.website !== undefined) {
    updateFields.push("website = ?");
    args.push(updates.website);
  }
  if (updates.expired_at !== undefined) {
    updateFields.push("expired_at = ?");
    args.push(updates.expired_at);
  }

  updateFields.push("updated_at = CURRENT_TIMESTAMP");
  args.push(id);

  db.exec(`UPDATE tokens SET ${updateFields.join(", ")} WHERE id = ?`, args);

  return getToken(id)!;
}

export function deleteToken(id: number): void {
  const db = getClient();
  db.exec("DELETE FROM tokens WHERE id = ?", [id]);
}

export function searchTokens(query: string): Token[] {
  const db = getClient();
  const searchPattern = `%${query}%`;
  const stmt = db.prepare(`
    SELECT * FROM tokens 
    WHERE name LIKE ? OR description LIKE ? OR website LIKE ? OR env_name LIKE ?
    ORDER BY 
      CASE WHEN expired_at IS NULL THEN 0 ELSE 1 END,
      CASE WHEN expired_at IS NULL THEN created_at ELSE expired_at END DESC
  `);
  const results = stmt.all([
    searchPattern,
    searchPattern,
    searchPattern,
    searchPattern,
  ]) as any[];
  return results.map(parseToken);
}

// ============ Group-Token Association ============

export function addTokenToGroup(groupId: number, tokenId: number): void {
  const db = getClient();
  db.exec(
    "INSERT OR IGNORE INTO group_tokens (group_id, token_id) VALUES (?, ?)",
    [groupId, tokenId],
  );
}

export function removeTokenFromGroup(groupId: number, tokenId: number): void {
  const db = getClient();
  db.exec("DELETE FROM group_tokens WHERE group_id = ? AND token_id = ?", [
    groupId,
    tokenId,
  ]);
}

export function getTokenGroups(tokenId: number): Group[] {
  const db = getClient();
  const stmt = db.prepare(`
    SELECT g.* FROM groups g
    INNER JOIN group_tokens gt ON g.id = gt.group_id
    WHERE gt.token_id = ?
    ORDER BY g.created_at DESC
  `);
  return stmt.all([tokenId]) as Group[];
}

export function getGroupWithTokens(groupId: number): GroupWithTokens | null {
  const group = getGroup(groupId);
  if (!group) return null;

  const tokens = getGroupTokens(groupId);
  return { ...group, tokens };
}

export function getTokenWithGroups(tokenId: number): TokenWithGroups | null {
  const token = getToken(tokenId);
  if (!token) return null;

  const groups = getTokenGroups(tokenId);
  return { ...token, groups };
}

// ============ Helper Functions ============

function parseToken(row: any): Token {
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : undefined,
  };
}
