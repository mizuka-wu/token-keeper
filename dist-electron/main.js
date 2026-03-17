import { app as c, ipcMain as s, BrowserWindow as L } from "electron";
import { fileURLToPath as b } from "node:url";
import T from "node:path";
import S from "path";
import I from "fs";
let p, u = null;
function f() {
  if (!p) {
    const t = c.getPath("userData");
    p = S.join(t, "tokens.db");
    const e = S.dirname(p);
    I.existsSync(e) || I.mkdirSync(e, { recursive: !0 });
  }
  return p;
}
async function U() {
  const t = f(), e = (await import("./index-C947seUx.js").then((r) => r.i)).default;
  return u = new e(t), u.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `), u.prepare(
    "SELECT COUNT(*) as count FROM groups WHERE name = ?"
  ).get(["Default"]).count === 0 && u.exec(
    "INSERT INTO groups (name, description, active) VALUES (?, ?, ?)",
    ["Default", "Default group for tokens", 1]
  ), u.exec(`
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
  `), u.exec(`
    CREATE TABLE IF NOT EXISTS group_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      token_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
      UNIQUE(group_id, token_id)
    )
  `), u;
}
function v() {
  if (!u) {
    const t = f(), e = require("libsql");
    u = new e(t);
  }
  return u;
}
function E() {
  return v();
}
function M(t, e, n = 1) {
  const o = E();
  o.exec("INSERT INTO groups (name, description, active) VALUES (?, ?, ?)", [
    t,
    e || null,
    n
  ]);
  const i = o.prepare("SELECT last_insert_rowid() as id").get().id;
  return l(i);
}
function x() {
  return E().prepare("SELECT * FROM groups ORDER BY created_at DESC").all();
}
function l(t) {
  return E().prepare("SELECT * FROM groups WHERE id = ?").get([t]) || null;
}
function P(t, e, n, o) {
  const r = E(), i = [], d = [];
  return e !== void 0 && (i.push("name = ?"), d.push(e)), n !== void 0 && (i.push("description = ?"), d.push(n)), o !== void 0 && (i.push("active = ?"), d.push(o)), i.push("updated_at = CURRENT_TIMESTAMP"), d.push(t), r.exec(`UPDATE groups SET ${i.join(", ")} WHERE id = ?`, d), l(t);
}
function F(t) {
  E().exec("DELETE FROM groups WHERE id = ?", [t]);
}
function w(t, e, n, o, r, i, d) {
  const g = E(), k = r ? JSON.stringify(r) : null;
  g.exec(
    "INSERT INTO tokens (name, value, env_name, description, tags, website, expired_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      t,
      e,
      n || null,
      o || null,
      k,
      i || null,
      d || null
    ]
  );
  const C = g.prepare("SELECT last_insert_rowid() as id").get().id;
  return R(C);
}
function R(t) {
  const o = E().prepare("SELECT * FROM tokens WHERE id = ?").get([t]);
  return o ? _(o) : null;
}
function G() {
  return E().prepare(`
    SELECT * FROM tokens 
    ORDER BY 
      CASE WHEN expired_at IS NULL THEN 0 ELSE 1 END,
      CASE WHEN expired_at IS NULL THEN created_at ELSE expired_at END DESC
  `).all().map(_);
}
function m(t) {
  return E().prepare(`
    SELECT t.* FROM tokens t
    INNER JOIN group_tokens gt ON t.id = gt.token_id
    WHERE gt.group_id = ?
    ORDER BY 
      CASE WHEN t.expired_at IS NULL THEN 0 ELSE 1 END,
      CASE WHEN t.expired_at IS NULL THEN t.created_at ELSE t.expired_at END DESC
  `).all([t]).map(_);
}
function H(t, e) {
  const n = E(), o = [], r = [];
  if (e.name !== void 0 && (o.push("name = ?"), r.push(e.name)), e.value !== void 0 && (o.push("value = ?"), r.push(e.value)), e.env_name !== void 0 && (o.push("env_name = ?"), r.push(e.env_name)), e.description !== void 0 && (o.push("description = ?"), r.push(e.description)), e.tags !== void 0) {
    const i = Array.isArray(e.tags) ? JSON.stringify(e.tags) : e.tags;
    o.push("tags = ?"), r.push(i);
  }
  return e.website !== void 0 && (o.push("website = ?"), r.push(e.website)), e.expired_at !== void 0 && (o.push("expired_at = ?"), r.push(e.expired_at)), o.push("updated_at = CURRENT_TIMESTAMP"), r.push(t), n.exec(`UPDATE tokens SET ${o.join(", ")} WHERE id = ?`, r), R(t);
}
function W(t) {
  E().exec("DELETE FROM tokens WHERE id = ?", [t]);
}
function Y(t) {
  const e = E(), n = `%${t}%`;
  return e.prepare(`
    SELECT * FROM tokens 
    WHERE name LIKE ? OR description LIKE ? OR website LIKE ? OR env_name LIKE ?
    ORDER BY 
      CASE WHEN expired_at IS NULL THEN 0 ELSE 1 END,
      CASE WHEN expired_at IS NULL THEN created_at ELSE expired_at END DESC
  `).all([
    n,
    n,
    n,
    n
  ]).map(_);
}
function V(t, e) {
  E().exec(
    "INSERT OR IGNORE INTO group_tokens (group_id, token_id) VALUES (?, ?)",
    [t, e]
  );
}
function j(t, e) {
  E().exec("DELETE FROM group_tokens WHERE group_id = ? AND token_id = ?", [
    t,
    e
  ]);
}
function h(t) {
  return E().prepare(`
    SELECT g.* FROM groups g
    INNER JOIN group_tokens gt ON g.id = gt.group_id
    WHERE gt.token_id = ?
    ORDER BY g.created_at DESC
  `).all([t]);
}
function B(t) {
  const e = l(t);
  if (!e) return null;
  const n = m(t);
  return { ...e, tokens: n };
}
function X(t) {
  const e = R(t);
  if (!e) return null;
  const n = h(t);
  return { ...e, groups: n };
}
function _(t) {
  return {
    ...t,
    tags: t.tags ? JSON.parse(t.tags) : void 0
  };
}
function K() {
  s.handle("group:list", () => x()), s.handle(
    "group:create",
    (t, e, n, o) => M(e, n, o)
  ), s.handle(
    "group:update",
    (t, e, n, o, r) => P(e, n, o, r)
  ), s.handle("group:delete", (t, e) => {
    F(e);
  }), s.handle("group:get", (t, e) => l(e)), s.handle("group:withTokens", (t, e) => B(e)), s.handle("token:list", () => G()), s.handle(
    "token:create",
    (t, e) => w(
      e.name,
      e.value,
      e.env_name,
      e.description,
      e.tags,
      e.website,
      e.expired_at
    )
  ), s.handle("token:update", (t, e, n) => H(e, n)), s.handle("token:delete", (t, e) => {
    W(e);
  }), s.handle("token:get", (t, e) => R(e)), s.handle("token:search", (t, e) => Y(e)), s.handle("token:withGroups", (t, e) => X(e)), s.handle("groupToken:add", (t, e, n) => {
    V(e, n);
  }), s.handle("groupToken:remove", (t, e, n) => {
    j(e, n);
  }), s.handle("groupToken:getGroupTokens", (t, e) => m(e)), s.handle("groupToken:getTokenGroups", (t, e) => h(e));
}
const A = T.dirname(b(import.meta.url));
process.env.APP_ROOT = T.join(A, "..");
const N = process.env.VITE_DEV_SERVER_URL, Z = T.join(process.env.APP_ROOT, "dist-electron"), O = T.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = N ? T.join(process.env.APP_ROOT, "public") : O;
let a;
function D() {
  a = new L({
    icon: T.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: T.join(A, "preload.mjs")
    }
  }), a.webContents.on("did-finish-load", () => {
    a == null || a.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), N ? a.loadURL(N) : a.loadFile(T.join(O, "index.html"));
}
c.on("window-all-closed", () => {
  process.platform !== "darwin" && (c.quit(), a = null);
});
c.on("activate", () => {
  L.getAllWindows().length === 0 && D();
});
c.whenReady().then(async () => {
  await U(), K(), D();
});
export {
  Z as MAIN_DIST,
  O as RENDERER_DIST,
  N as VITE_DEV_SERVER_URL
};
