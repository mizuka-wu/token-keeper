import { AppDataSource, initializeDatabase } from "./connection";
import { Group } from "./entities/Group";
import { Token } from "./entities/Token";
import { GroupToken } from "./entities/GroupToken";
import type { Group as GroupType, Token as TokenType } from "../types/database";
import { EncryptionService } from "../services/encryption";

export { initializeDatabase };

// ============ Group Operations ============

export async function createGroup(
  name: string,
  description?: string,
): Promise<GroupType> {
  const groupRepo = AppDataSource.getRepository(Group);
  const group = groupRepo.create({
    name,
    description: description || null,
  });
  return (await groupRepo.save(group)) as any;
}

export async function getGroups(): Promise<GroupType[]> {
  const groupRepo = AppDataSource.getRepository(Group);
  return (await groupRepo.find({
    order: { order_index: "ASC", created_at: "DESC" },
  })) as any;
}

export async function getGroup(id: number): Promise<GroupType | null> {
  const groupRepo = AppDataSource.getRepository(Group);
  return (await groupRepo.findOne({ where: { id } })) as any;
}

export async function updateGroup(
  id: number,
  name?: string,
  description?: string,
): Promise<GroupType> {
  const groupRepo = AppDataSource.getRepository(Group);
  await groupRepo.update(id, {
    ...(name && { name }),
    ...(description !== undefined && { description }),
  });
  return (await groupRepo.findOneOrFail({ where: { id } })) as any;
}

export async function deleteGroup(id: number): Promise<void> {
  const groupRepo = AppDataSource.getRepository(Group);
  const group = await groupRepo.findOne({ where: { id } });
  if (group) {
    await groupRepo.delete(id);
  }
}

// ============ Token Operations ============

export async function createToken(
  name: string,
  value: string,
  env_name: string,
  description?: string,
  tags?: string[],
  website?: string,
  expired_at?: string,
): Promise<TokenType> {
  const tokenRepo = AppDataSource.getRepository(Token);
  const encryptedValue = EncryptionService.encrypt(value);
  const token = tokenRepo.create({
    name,
    value: encryptedValue,
    env_name,
    description: description || null,
    tags: tags ? JSON.stringify(tags) : null,
    website: website || null,
    expired_at: expired_at ? new Date(expired_at) : null,
  });
  const savedToken = await tokenRepo.save(token);
  const parsed = parseToken(savedToken);
  return {
    ...parsed,
    group_ids: [],
  } as any;
}

export async function getToken(id: number): Promise<TokenType | null> {
  const tokenRepo = AppDataSource.getRepository(Token);
  const token = await tokenRepo.findOne({
    where: { id },
    relations: ["groupTokens"],
  });
  if (!token) return null;
  const parsed = parseToken(token);
  return {
    ...parsed,
    group_ids: token.groupTokens?.map((gt) => gt.group_id) || [],
  } as any;
}

export async function getTokens(): Promise<TokenType[]> {
  const tokenRepo = AppDataSource.getRepository(Token);

  // First, try to get all tokens without relations
  const tokens = await tokenRepo.find({
    order: { expired_at: "ASC", order_index: "ASC", created_at: "DESC" },
  });

  console.log(`getTokens: Found ${tokens.length} tokens`);

  // Then load group associations separately
  const result = await Promise.all(
    tokens.map(async (token) => {
      const parsed = parseToken(token);

      // Load group_ids separately
      const gtRepo = AppDataSource.getRepository(GroupToken);
      const groupTokens = await gtRepo.find({
        where: { token_id: token.id },
      });

      return {
        ...parsed,
        group_ids: groupTokens.map((gt) => gt.group_id),
      } as any;
    }),
  );

  return result;
}

export async function updateToken(
  id: number,
  updates: Partial<Omit<TokenType, "id" | "created_at" | "updated_at">>,
): Promise<TokenType> {
  const tokenRepo = AppDataSource.getRepository(Token);
  const updateData: any = {};

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.value !== undefined)
    updateData.value = EncryptionService.encrypt(updates.value);
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
  const token = await tokenRepo.findOneOrFail({
    where: { id },
    relations: ["groupTokens"],
  });
  const parsed = parseToken(token);
  return {
    ...parsed,
    group_ids: token.groupTokens?.map((gt) => gt.group_id) || [],
  } as any;
}

export async function deleteToken(id: number): Promise<void> {
  const tokenRepo = AppDataSource.getRepository(Token);
  await tokenRepo.delete(id);
}

export async function searchTokens(query: string): Promise<TokenType[]> {
  const tokenRepo = AppDataSource.getRepository(Token);
  const tokens = await tokenRepo
    .createQueryBuilder("token")
    .where("token.name LIKE :query", { query: `%${query}%` })
    .orWhere("token.description LIKE :query", { query: `%${query}%` })
    .orWhere("token.website LIKE :query", { query: `%${query}%` })
    .orWhere("token.env_name LIKE :query", { query: `%${query}%` })
    .orderBy("token.expired_at", "ASC", "NULLS FIRST")
    .addOrderBy("token.order_index", "ASC")
    .addOrderBy("token.created_at", "DESC")
    .getMany();

  return tokens.map(parseToken) as any[];
}

// ============ Order/Drag Operations ============

export async function updateGroupOrder(
  id: number,
  orderIndex: number,
): Promise<GroupType> {
  const groupRepo = AppDataSource.getRepository(Group);
  await groupRepo.update(id, { order_index: orderIndex });
  return (await groupRepo.findOneOrFail({ where: { id } })) as any;
}

export async function updateTokenOrder(
  id: number,
  orderIndex: number,
): Promise<TokenType> {
  const tokenRepo = AppDataSource.getRepository(Token);
  await tokenRepo.update(id, { order_index: orderIndex });
  const token = await tokenRepo.findOneOrFail({ where: { id } });
  return parseToken(token) as any;
}

export async function reorderGroups(groupIds: number[]): Promise<void> {
  const groupRepo = AppDataSource.getRepository(Group);
  for (let i = 0; i < groupIds.length; i++) {
    await groupRepo.update(groupIds[i], { order_index: i });
  }
}

export async function reorderTokens(tokenIds: number[]): Promise<void> {
  const tokenRepo = AppDataSource.getRepository(Token);
  for (let i = 0; i < tokenIds.length; i++) {
    await tokenRepo.update(tokenIds[i], { order_index: i });
  }
}

// ============ Group-Token Association ============

export async function addTokenToGroup(
  groupId: number,
  tokenId: number,
): Promise<void> {
  const gtRepo = AppDataSource.getRepository(GroupToken);
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
  const gtRepo = AppDataSource.getRepository(GroupToken);
  await gtRepo.delete({ group_id: groupId, token_id: tokenId });
}

export async function getGroupTokens(groupId: number): Promise<TokenType[]> {
  const gtRepo = AppDataSource.getRepository(GroupToken);
  const groupTokens = await gtRepo.find({
    where: { group_id: groupId },
    relations: ["token"],
  });

  return groupTokens.map((gt) => parseToken(gt.token)) as any[];
}

export async function getTokenGroups(tokenId: number): Promise<GroupType[]> {
  const gtRepo = AppDataSource.getRepository(GroupToken);
  const tokenGroups = await gtRepo.find({
    where: { token_id: tokenId },
    relations: ["group"],
  });

  return tokenGroups.map((tg) => tg.group) as any[];
}

export async function getGroupWithTokens(groupId: number): Promise<any> {
  const groupRepo = AppDataSource.getRepository(Group);
  const group = await groupRepo.findOne({
    where: { id: groupId },
    relations: ["groupTokens", "groupTokens.token"],
  });

  if (!group) return null;

  return {
    ...group,
    tokens: group.groupTokens.map((gt) => parseToken(gt.token)),
  };
}

export async function getTokenWithGroups(tokenId: number): Promise<any> {
  const tokenRepo = AppDataSource.getRepository(Token);
  const token = await tokenRepo.findOne({
    where: { id: tokenId },
    relations: ["groupTokens", "groupTokens.group"],
  });

  if (!token) return null;

  return {
    ...parseToken(token),
    groups: token.groupTokens.map((tg) => tg.group),
  };
}

// ============ Helper Functions ============

function parseToken(token: Token): TokenType {
  let decryptedValue = token.value;
  try {
    decryptedValue = EncryptionService.decrypt(token.value);
  } catch (error) {
    console.warn(
      "Failed to decrypt token value, returning encrypted value:",
      error,
    );
  }
  return {
    ...token,
    value: decryptedValue,
    tags: token.tags ? JSON.parse(token.tags) : undefined,
  } as any;
}
