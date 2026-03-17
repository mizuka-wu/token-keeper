import { getDatabase } from "./connection";
import { Group } from "./entities/Group";
import { Token } from "./entities/Token";
import { GroupToken } from "./entities/GroupToken";
import type { Group as GroupType, Token as TokenType } from "../types/database";

// ============ Group Operations ============

export async function createGroup(
  name: string,
  description?: string,
): Promise<GroupType> {
  const db = getDatabase();
  const groupRepo = db.getRepository(Group);

  const group = groupRepo.create({
    name,
    description: description || null,
  });

  return groupRepo.save(group) as any;
}

export async function getGroups(): Promise<GroupType[]> {
  const db = getDatabase();
  const groupRepo = db.getRepository(Group);

  return groupRepo.find({
    order: {
      order_index: "ASC",
      created_at: "DESC",
    },
  }) as any;
}

export async function getGroup(id: number): Promise<GroupType | null> {
  const db = getDatabase();
  const groupRepo = db.getRepository(Group);

  return groupRepo.findOne({ where: { id } }) as any;
}

export async function updateGroup(
  id: number,
  name?: string,
  description?: string,
): Promise<GroupType> {
  const db = getDatabase();
  const groupRepo = db.getRepository(Group);

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;

  await groupRepo.update(id, updates);

  return (await getGroup(id))!;
}

export async function deleteGroup(id: number): Promise<void> {
  const db = getDatabase();
  const groupRepo = db.getRepository(Group);

  await groupRepo.delete(id);
}

// ============ Token Operations ============

export async function createToken(
  name: string,
  value: string,
  env_name?: string,
  description?: string,
  tags?: string[],
  website?: string,
  expired_at?: string,
): Promise<TokenType> {
  const db = getDatabase();
  const tokenRepo = db.getRepository(Token);

  const token = tokenRepo.create({
    name,
    value,
    env_name: env_name || null,
    description: description || null,
    tags: tags ? JSON.stringify(tags) : null,
    website: website || null,
    expired_at: expired_at ? new Date(expired_at) : null,
  });

  return tokenRepo.save(token) as any;
}

export async function getToken(id: number): Promise<TokenType | null> {
  const db = getDatabase();
  const tokenRepo = db.getRepository(Token);

  const token = await tokenRepo.findOne({ where: { id } });
  return token ? parseToken(token as any) : null;
}

export async function getTokens(): Promise<TokenType[]> {
  const db = getDatabase();
  const tokenRepo = db.getRepository(Token);

  const tokens = await tokenRepo.find({
    order: {
      expired_at: "ASC",
      order_index: "ASC",
      created_at: "DESC",
    },
  });

  return (tokens as any[]).map(parseToken);
}

export async function updateToken(
  id: number,
  updates: Partial<Omit<TokenType, "id" | "created_at" | "updated_at">>,
): Promise<TokenType> {
  const db = getDatabase();
  const tokenRepo = db.getRepository(Token);

  const updateData: any = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.value !== undefined) updateData.value = updates.value;
  if (updates.env_name !== undefined) updateData.env_name = updates.env_name;
  if (updates.description !== undefined)
    updateData.description = updates.description;
  if (updates.tags !== undefined)
    updateData.tags = JSON.stringify(updates.tags);
  if (updates.website !== undefined) updateData.website = updates.website;
  if (updates.expired_at !== undefined)
    updateData.expired_at = updates.expired_at
      ? new Date(updates.expired_at)
      : null;
  if (updates.order_index !== undefined)
    updateData.order_index = updates.order_index;

  await tokenRepo.update(id, updateData);

  return (await getToken(id))!;
}

export async function deleteToken(id: number): Promise<void> {
  const db = getDatabase();
  const tokenRepo = db.getRepository(Token);

  await tokenRepo.delete(id);
}

export async function searchTokens(query: string): Promise<TokenType[]> {
  const db = getDatabase();
  const tokenRepo = db.getRepository(Token);

  const searchPattern = `%${query}%`;
  const tokens = await tokenRepo
    .createQueryBuilder("token")
    .where("token.name LIKE :query", { query: searchPattern })
    .orWhere("token.description LIKE :query", { query: searchPattern })
    .orWhere("token.website LIKE :query", { query: searchPattern })
    .orWhere("token.env_name LIKE :query", { query: searchPattern })
    .orderBy("CASE WHEN token.expired_at IS NULL THEN 0 ELSE 1 END", "ASC")
    .addOrderBy("token.order_index", "ASC")
    .addOrderBy("token.created_at", "DESC")
    .getMany();

  return (tokens as any[]).map(parseToken);
}

// ============ Order/Drag Operations ============

export async function updateGroupOrder(
  id: number,
  orderIndex: number,
): Promise<GroupType> {
  const db = getDatabase();
  const groupRepo = db.getRepository(Group);

  await groupRepo.update(id, { order_index: orderIndex });

  return (await getGroup(id))!;
}

export async function updateTokenOrder(
  id: number,
  orderIndex: number,
): Promise<TokenType> {
  const db = getDatabase();
  const tokenRepo = db.getRepository(Token);

  await tokenRepo.update(id, { order_index: orderIndex });

  return (await getToken(id))!;
}

export async function reorderGroups(groupIds: number[]): Promise<void> {
  const db = getDatabase();
  const groupRepo = db.getRepository(Group);

  for (let i = 0; i < groupIds.length; i++) {
    await groupRepo.update(groupIds[i], { order_index: i });
  }
}

export async function reorderTokens(tokenIds: number[]): Promise<void> {
  const db = getDatabase();
  const tokenRepo = db.getRepository(Token);

  for (let i = 0; i < tokenIds.length; i++) {
    await tokenRepo.update(tokenIds[i], { order_index: i });
  }
}

// ============ Group-Token Association ============

export async function addTokenToGroup(
  groupId: number,
  tokenId: number,
): Promise<void> {
  const db = getDatabase();
  const gtRepo = db.getRepository(GroupToken);

  const existing = await gtRepo.findOne({
    where: { group_id: groupId, token_id: tokenId },
  });

  if (!existing) {
    const gt = gtRepo.create({ group_id: groupId, token_id: tokenId });
    await gtRepo.save(gt);
  }
}

export async function removeTokenFromGroup(
  groupId: number,
  tokenId: number,
): Promise<void> {
  const db = getDatabase();
  const gtRepo = db.getRepository(GroupToken);

  await gtRepo.delete({ group_id: groupId, token_id: tokenId });
}

export async function getGroupTokens(groupId: number): Promise<TokenType[]> {
  const db = getDatabase();
  const tokenRepo = db.getRepository(Token);

  const tokens = await tokenRepo
    .createQueryBuilder("token")
    .innerJoin("group_tokens", "gt", "token.id = gt.token_id")
    .where("gt.group_id = :groupId", { groupId })
    .orderBy("CASE WHEN token.expired_at IS NULL THEN 0 ELSE 1 END", "ASC")
    .addOrderBy("token.order_index", "ASC")
    .addOrderBy("token.created_at", "DESC")
    .getMany();

  return (tokens as any[]).map(parseToken);
}

export async function getTokenGroups(tokenId: number): Promise<GroupType[]> {
  const db = getDatabase();
  const groupRepo = db.getRepository(Group);

  return groupRepo
    .createQueryBuilder("group")
    .innerJoin("group_tokens", "gt", "group.id = gt.group_id")
    .where("gt.token_id = :tokenId", { tokenId })
    .orderBy("group.created_at", "DESC")
    .getMany() as any;
}

export async function getGroupWithTokens(groupId: number): Promise<any> {
  const db = getDatabase();
  const groupRepo = db.getRepository(Group);

  const group = await groupRepo.findOne({
    where: { id: groupId },
    relations: ["groupTokens", "groupTokens.token"],
  });

  if (!group) return null;

  return {
    ...group,
    tokens: (group as any).groupTokens.map((gt: any) => parseToken(gt.token)),
  };
}

export async function getTokenWithGroups(tokenId: number): Promise<any> {
  const db = getDatabase();
  const tokenRepo = db.getRepository(Token);

  const token = await tokenRepo.findOne({
    where: { id: tokenId },
    relations: ["groupTokens", "groupTokens.group"],
  });

  if (!token) return null;

  return {
    ...parseToken(token as any),
    groups: (token as any).groupTokens.map((gt: any) => gt.group),
  };
}

// ============ Helper Functions ============

function parseToken(token: any): TokenType {
  return {
    ...token,
    tags: token.tags ? JSON.parse(token.tags) : undefined,
  };
}
