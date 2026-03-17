import { getPrismaClient } from "./prisma";
import type { Group, Token } from "../types/database";

const prisma = getPrismaClient();

// ============ Group Operations ============

export async function createGroup(
  name: string,
  description?: string,
): Promise<Group> {
  return prisma.group.create({
    data: {
      name,
      description: description || null,
    },
  }) as any;
}

export async function getGroups(): Promise<Group[]> {
  return prisma.group.findMany({
    orderBy: [{ order_index: "asc" }, { created_at: "desc" }],
  }) as any;
}

export async function getGroup(id: number): Promise<Group | null> {
  return prisma.group.findUnique({
    where: { id },
  }) as any;
}

export async function updateGroup(
  id: number,
  name?: string,
  description?: string,
): Promise<Group> {
  return prisma.group.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    },
  }) as any;
}

export async function deleteGroup(id: number): Promise<void> {
  await prisma.group.delete({
    where: { id },
  });
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
): Promise<Token> {
  return prisma.token
    .create({
      data: {
        name,
        value,
        env_name: env_name || null,
        description: description || null,
        tags: tags ? JSON.stringify(tags) : null,
        website: website || null,
        expired_at: expired_at ? new Date(expired_at) : null,
      },
    })
    .then((t) => parseToken(t as any));
}

export async function getToken(id: number): Promise<Token | null> {
  const token = await prisma.token.findUnique({
    where: { id },
  });
  return token ? parseToken(token as any) : null;
}

export async function getTokens(): Promise<Token[]> {
  const tokens = await prisma.token.findMany({
    orderBy: [
      { expired_at: "asc" },
      { order_index: "asc" },
      { created_at: "desc" },
    ],
  });
  return (tokens as any[]).map(parseToken);
}

export async function updateToken(
  id: number,
  updates: Partial<Omit<Token, "id" | "created_at" | "updated_at">>,
): Promise<Token> {
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

  const token = await prisma.token.update({
    where: { id },
    data: updateData,
  });

  return parseToken(token as any);
}

export async function deleteToken(id: number): Promise<void> {
  await prisma.token.delete({
    where: { id },
  });
}

export async function searchTokens(query: string): Promise<Token[]> {
  const tokens = await prisma.token.findMany({
    where: {
      OR: [
        { name: { contains: query } },
        { description: { contains: query } },
        { website: { contains: query } },
        { env_name: { contains: query } },
      ],
    },
    orderBy: [
      { expired_at: "asc" },
      { order_index: "asc" },
      { created_at: "desc" },
    ],
  });

  return (tokens as any[]).map(parseToken);
}

// ============ Order/Drag Operations ============

export async function updateGroupOrder(
  id: number,
  orderIndex: number,
): Promise<Group> {
  return prisma.group.update({
    where: { id },
    data: { order_index: orderIndex },
  }) as any;
}

export async function updateTokenOrder(
  id: number,
  orderIndex: number,
): Promise<Token> {
  const token = await prisma.token.update({
    where: { id },
    data: { order_index: orderIndex },
  });
  return parseToken(token as any);
}

export async function reorderGroups(groupIds: number[]): Promise<void> {
  for (let i = 0; i < groupIds.length; i++) {
    await prisma.group.update({
      where: { id: groupIds[i] },
      data: { order_index: i },
    });
  }
}

export async function reorderTokens(tokenIds: number[]): Promise<void> {
  for (let i = 0; i < tokenIds.length; i++) {
    await prisma.token.update({
      where: { id: tokenIds[i] },
      data: { order_index: i },
    });
  }
}

// ============ Group-Token Association ============

export async function addTokenToGroup(
  groupId: number,
  tokenId: number,
): Promise<void> {
  const existing = await prisma.groupToken.findUnique({
    where: {
      group_id_token_id: {
        group_id: groupId,
        token_id: tokenId,
      },
    },
  });

  if (!existing) {
    await prisma.groupToken.create({
      data: {
        group_id: groupId,
        token_id: tokenId,
      },
    });
  }
}

export async function removeTokenFromGroup(
  groupId: number,
  tokenId: number,
): Promise<void> {
  await prisma.groupToken.deleteMany({
    where: {
      group_id: groupId,
      token_id: tokenId,
    },
  });
}

export async function getGroupTokens(groupId: number): Promise<Token[]> {
  const groupTokens = await prisma.groupToken.findMany({
    where: { group_id: groupId },
    include: { token: true },
  });

  return groupTokens.map((gt) => parseToken(gt.token as any));
}

export async function getTokenGroups(tokenId: number): Promise<Group[]> {
  const tokenGroups = await prisma.groupToken.findMany({
    where: { token_id: tokenId },
    include: { group: true },
  });

  return tokenGroups.map((tg) => tg.group as any);
}

export async function getGroupWithTokens(groupId: number): Promise<any> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      groupTokens: {
        include: { token: true },
      },
    },
  });

  if (!group) return null;

  return {
    ...group,
    tokens: group.groupTokens.map((gt) => parseToken(gt.token as any)),
  };
}

export async function getTokenWithGroups(tokenId: number): Promise<any> {
  const token = await prisma.token.findUnique({
    where: { id: tokenId },
    include: {
      groupTokens: {
        include: { group: true },
      },
    },
  });

  if (!token) return null;

  return {
    ...parseToken(token as any),
    groups: token.groupTokens.map((tg) => tg.group),
  };
}

// ============ Helper Functions ============

function parseToken(token: any): Token {
  return {
    ...token,
    tags: token.tags ? JSON.parse(token.tags) : undefined,
  };
}
