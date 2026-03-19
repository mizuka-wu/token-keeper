import { AppDataSource, initializeDatabase } from "./connection";
import { Group } from "./entities/Group";
import { Token } from "./entities/Token";
import { GroupToken } from "./entities/GroupToken";
import type { Group as GroupType, Token as TokenType } from "../types/database";
import { EncryptionService } from "../services/encryption";
import { randomUUID } from "crypto";
import type {
  CreateGroup,
  UpdateGroup,
  CreateToken,
  UpdateToken,
} from "../schemas/index";

export { initializeDatabase };

// ============ Group Operations ============

export async function createGroup(payload: CreateGroup): Promise<GroupType> {
  const groupRepo = AppDataSource.getRepository(Group);
  const group = groupRepo.create({
    uuid: randomUUID(),
    name: payload.name,
    description: payload.description || null,
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

export async function getGroupByUuid(uuid: string): Promise<GroupType | null> {
  const groupRepo = AppDataSource.getRepository(Group);
  return (await groupRepo.findOne({ where: { uuid } })) as any;
}

export async function updateGroup(
  id: number,
  payload: UpdateGroup,
): Promise<GroupType> {
  const groupRepo = AppDataSource.getRepository(Group);
  const updateData: any = {};
  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.description !== undefined)
    updateData.description = payload.description;

  await groupRepo.update(id, updateData);
  return (await groupRepo.findOneOrFail({ where: { id } })) as any;
}

export async function deleteGroup(id: number): Promise<void> {
  const groupRepo = AppDataSource.getRepository(Group);
  const group = await groupRepo.findOne({ where: { id } });
  if (group) {
    await groupRepo.delete(id);
    // Clear active group config if the deleted group was active
    const groupConfig = await import("../config/groupConfig");
    const activeGroupId = groupConfig.getActiveGroupId();
    if (activeGroupId === id) {
      groupConfig.clearActiveGroup();
    }
  }
}

// ============ Token Operations ============

export async function createToken(payload: CreateToken): Promise<TokenType> {
  const tokenRepo = AppDataSource.getRepository(Token);
  const encryptedValue = EncryptionService.encrypt(payload.value);
  const token = tokenRepo.create({
    name: payload.name,
    value: encryptedValue,
    env_name: payload.env_name,
    description: payload.description || null,
    tags: payload.tags ? JSON.stringify(payload.tags) : null,
    website: payload.website || null,
    expired_at: payload.expired_at ? new Date(payload.expired_at) : null,
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
  payload: UpdateToken,
): Promise<TokenType> {
  const tokenRepo = AppDataSource.getRepository(Token);
  const updateData: any = {};

  if (payload.name !== undefined) updateData.name = payload.name;
  if (payload.value !== undefined)
    updateData.value = EncryptionService.encrypt(payload.value);
  if (payload.env_name !== undefined) updateData.env_name = payload.env_name;
  if (payload.description !== undefined)
    updateData.description = payload.description;
  if (payload.tags !== undefined)
    updateData.tags = JSON.stringify(payload.tags);
  if (payload.website !== undefined) updateData.website = payload.website;
  if (payload.expired_at !== undefined)
    updateData.expired_at = payload.expired_at
      ? new Date(payload.expired_at)
      : null;

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
    const group = await getGroup(groupId);
    const gt = gtRepo.create({
      group_id: groupId,
      group_uuid: group?.uuid || null,
      token_id: tokenId,
    });
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
