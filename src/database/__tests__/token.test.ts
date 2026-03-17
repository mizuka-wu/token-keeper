import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { DataSource } from "typeorm";
import path from "path";
import fs from "fs";
import { Group } from "../entities/Group";
import { Token } from "../entities/Token";
import { GroupToken } from "../entities/GroupToken";

let testDb: DataSource;
const testDbPath = path.join(__dirname, "test-tokens.db");

beforeAll(async () => {
  testDb = new DataSource({
    type: "better-sqlite3",
    database: testDbPath,
    entities: [Group, Token, GroupToken],
    synchronize: true,
    logging: false,
  });

  await testDb.initialize();
});

afterAll(async () => {
  if (testDb.isInitialized) {
    await testDb.destroy();
  }
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }
});

describe("Token Operations", () => {
  it("should create a token", async () => {
    const tokenRepo = testDb.getRepository(Token);
    const token = tokenRepo.create({
      name: "API Key",
      value: "sk-1234567890",
      env_name: "API_KEY",
      description: "Production API key",
      website: "https://api.example.com",
    });
    const saved = await tokenRepo.save(token);

    expect(saved.id).toBeDefined();
    expect(saved.name).toBe("API Key");
    expect(saved.value).toBe("sk-1234567890");
    expect(saved.env_name).toBe("API_KEY");
    expect(saved.description).toBe("Production API key");
  });

  it("should create token with tags", async () => {
    const tokenRepo = testDb.getRepository(Token);
    const tags = JSON.stringify(["production", "api"]);
    const token = tokenRepo.create({
      name: "Database Token",
      value: "db-token-123",
      tags,
    });
    const saved = await tokenRepo.save(token);

    expect(saved.tags).toBe(tags);
    const parsedTags = JSON.parse(saved.tags);
    expect(parsedTags).toEqual(["production", "api"]);
  });

  it("should create token with expiration date", async () => {
    const tokenRepo = testDb.getRepository(Token);
    const expirationDate = new Date("2025-12-31");
    const token = tokenRepo.create({
      name: "Temporary Token",
      value: "temp-token-456",
      expired_at: expirationDate,
    });
    const saved = await tokenRepo.save(token);

    expect(saved.expired_at).toBeDefined();
    expect(new Date(saved.expired_at).getTime()).toBe(expirationDate.getTime());
  });

  it("should get all tokens", async () => {
    const tokenRepo = testDb.getRepository(Token);
    const tokens = await tokenRepo.find();

    expect(Array.isArray(tokens)).toBe(true);
    expect(tokens.length).toBeGreaterThan(0);
  });

  it("should get token by id", async () => {
    const tokenRepo = testDb.getRepository(Token);
    const token = await tokenRepo.findOne({ where: { name: "API Key" } });

    expect(token).toBeDefined();
    expect(token?.name).toBe("API Key");
    expect(token?.value).toBe("sk-1234567890");
  });

  it("should search tokens by name", async () => {
    const tokenRepo = testDb.getRepository(Token);
    const tokens = await tokenRepo
      .createQueryBuilder("token")
      .where("token.name LIKE :query", { query: "%API%" })
      .getMany();

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0].name).toContain("API");
  });

  it("should search tokens by description", async () => {
    const tokenRepo = testDb.getRepository(Token);
    const tokens = await tokenRepo
      .createQueryBuilder("token")
      .where("token.description LIKE :query", { query: "%Production%" })
      .getMany();

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0].description).toContain("Production");
  });

  it("should search tokens by website", async () => {
    const tokenRepo = testDb.getRepository(Token);
    const tokens = await tokenRepo
      .createQueryBuilder("token")
      .where("token.website LIKE :query", { query: "%example%" })
      .getMany();

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0].website).toContain("example");
  });

  it("should search tokens by env_name", async () => {
    const tokenRepo = testDb.getRepository(Token);
    const tokens = await tokenRepo
      .createQueryBuilder("token")
      .where("token.env_name LIKE :query", { query: "%API%" })
      .getMany();

    expect(tokens.length).toBeGreaterThan(0);
    expect(tokens[0].env_name).toContain("API");
  });

  it("should update token", async () => {
    const tokenRepo = testDb.getRepository(Token);
    const token = await tokenRepo.findOne({ where: { name: "API Key" } });

    if (token) {
      token.description = "Updated description";
      token.website = "https://updated.example.com";
      const updated = await tokenRepo.save(token);

      expect(updated.description).toBe("Updated description");
      expect(updated.website).toBe("https://updated.example.com");
    }
  });

  it("should update token value", async () => {
    const tokenRepo = testDb.getRepository(Token);
    const token = await tokenRepo.findOne({ where: { name: "API Key" } });

    if (token) {
      token.value = "sk-new-value-789";
      const updated = await tokenRepo.save(token);

      expect(updated.value).toBe("sk-new-value-789");
    }
  });

  it("should update token order_index", async () => {
    const tokenRepo = testDb.getRepository(Token);
    const token = await tokenRepo.findOne({ where: { name: "API Key" } });

    if (token) {
      token.order_index = 5;
      const updated = await tokenRepo.save(token);

      expect(updated.order_index).toBe(5);
    }
  });

  it("should delete token", async () => {
    const tokenRepo = testDb.getRepository(Token);
    const token = await tokenRepo.findOne({
      where: { name: "Temporary Token" },
    });

    if (token) {
      await tokenRepo.delete(token.id);
      const deleted = await tokenRepo.findOne({ where: { id: token.id } });

      expect(deleted).toBeNull();
    }
  });

  it("should sort tokens by expiration date", async () => {
    const tokenRepo = testDb.getRepository(Token);
    const tokens = await tokenRepo.find({
      order: { expired_at: "ASC", order_index: "ASC", created_at: "DESC" },
    });

    expect(Array.isArray(tokens)).toBe(true);
    // Verify sorting: tokens with expired_at should come first
    let lastExpiredAt: Date | null = null;
    for (const token of tokens) {
      if (token.expired_at && lastExpiredAt) {
        expect(new Date(token.expired_at).getTime()).toBeGreaterThanOrEqual(
          lastExpiredAt.getTime(),
        );
      }
      lastExpiredAt = token.expired_at;
    }
  });

  it("should handle token with null optional fields", async () => {
    const tokenRepo = testDb.getRepository(Token);
    const token = tokenRepo.create({
      name: "Minimal Token",
      value: "minimal-value",
      env_name: null,
      description: null,
      tags: null,
      website: null,
      expired_at: null,
    });
    const saved = await tokenRepo.save(token);

    expect(saved.id).toBeDefined();
    expect(saved.name).toBe("Minimal Token");
    expect(saved.env_name).toBeNull();
    expect(saved.description).toBeNull();
    expect(saved.website).toBeNull();
  });

  it("should create multiple tokens and retrieve them", async () => {
    const tokenRepo = testDb.getRepository(Token);
    const initialCount = await tokenRepo.count();

    const token1 = tokenRepo.create({
      name: "Token 1",
      value: "value-1",
    });
    const token2 = tokenRepo.create({
      name: "Token 2",
      value: "value-2",
    });

    await tokenRepo.save([token1, token2]);
    const finalCount = await tokenRepo.count();

    expect(finalCount).toBe(initialCount + 2);
  });
});
