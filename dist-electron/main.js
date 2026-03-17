import { app as c, ipcMain as o, BrowserWindow as A } from "electron";
import { fileURLToPath as U } from "node:url";
import a from "node:path";
import S from "path";
import I from "fs";
let l, d = null;
function L() {
  if (!l) {
    const t = c.getPath("userData");
    l = S.join(t, "tokens.db");
    const e = S.dirname(l);
    I.existsSync(e) || I.mkdirSync(e, { recursive: !0 });
  }
  return l;
}
async function b() {
  const t = L(), e = (await import("./index-C947seUx.js").then((E) => E.i)).default;
  return d = new e(t), d.exec(`
    CREATE TABLE IF NOT EXISTS groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      active INTEGER DEFAULT 1,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `), d.prepare(
    "SELECT COUNT(*) as count FROM groups WHERE name = ?"
  ).get(["Default"]).count === 0 && d.exec(
    "INSERT INTO groups (name, description, active) VALUES (?, ?, ?)",
    ["Default", "Default group for tokens", 1]
  ), d.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      value TEXT NOT NULL,
      env_name TEXT,
      description TEXT,
      tags TEXT,
      website TEXT,
      expired_at DATETIME,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `), d.exec(`
    CREATE TABLE IF NOT EXISTS group_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER NOT NULL,
      token_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
      FOREIGN KEY (token_id) REFERENCES tokens(id) ON DELETE CASCADE,
      UNIQUE(group_id, token_id)
    )
  `), d;
}
function M() {
  if (!d) {
    const t = L(), e = require("libsql");
    d = new e(t);
  }
  return d;
}
function s() {
  return M();
}
function x(t, e, n = 1) {
  const r = s();
  r.exec("INSERT INTO groups (name, description, active) VALUES (?, ?, ?)", [
    t,
    e || null,
    n
  ]);
  const i = r.prepare("SELECT last_insert_rowid() as id").get().id;
  return p(i);
}
function v() {
  return s().prepare(
    "SELECT * FROM groups ORDER BY order_index ASC, created_at DESC"
  ).all();
}
function p(t) {
  return s().prepare("SELECT * FROM groups WHERE id = ?").get([t]) || null;
}
function P(t, e, n, r) {
  const E = s(), i = [], T = [];
  return e !== void 0 && (i.push("name = ?"), T.push(e)), n !== void 0 && (i.push("description = ?"), T.push(n)), r !== void 0 && (i.push("active = ?"), T.push(r)), i.push("updated_at = CURRENT_TIMESTAMP"), T.push(t), E.exec(`UPDATE groups SET ${i.join(", ")} WHERE id = ?`, T), p(t);
}
function F(t) {
  s().exec("DELETE FROM groups WHERE id = ?", [t]);
}
function G(t, e, n, r, E, i, T) {
  const g = s(), k = E ? JSON.stringify(E) : null;
  g.exec(
    "INSERT INTO tokens (name, value, env_name, description, tags, website, expired_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      t,
      e,
      n || null,
      r || null,
      k,
      i || null,
      T || null
    ]
  );
  const C = g.prepare("SELECT last_insert_rowid() as id").get().id;
  return _(C);
}
function _(t) {
  const r = s().prepare("SELECT * FROM tokens WHERE id = ?").get([t]);
  return r ? R(r) : null;
}
function H() {
  return s().prepare(`
    SELECT * FROM tokens 
    ORDER BY 
      CASE WHEN expired_at IS NULL THEN 0 ELSE 1 END,
      order_index ASC,
      CASE WHEN expired_at IS NULL THEN created_at ELSE expired_at END DESC
  `).all().map(R);
}
function f(t) {
  return s().prepare(`
    SELECT t.* FROM tokens t
    INNER JOIN group_tokens gt ON t.id = gt.token_id
    WHERE gt.group_id = ?
    ORDER BY 
      CASE WHEN t.expired_at IS NULL THEN 0 ELSE 1 END,
      t.order_index ASC,
      CASE WHEN t.expired_at IS NULL THEN t.created_at ELSE t.expired_at END DESC
  `).all([t]).map(R);
}
function W(t, e) {
  const n = s(), r = [], E = [];
  if (e.name !== void 0 && (r.push("name = ?"), E.push(e.name)), e.value !== void 0 && (r.push("value = ?"), E.push(e.value)), e.env_name !== void 0 && (r.push("env_name = ?"), E.push(e.env_name)), e.description !== void 0 && (r.push("description = ?"), E.push(e.description)), e.tags !== void 0) {
    const i = Array.isArray(e.tags) ? JSON.stringify(e.tags) : e.tags;
    r.push("tags = ?"), E.push(i);
  }
  return e.website !== void 0 && (r.push("website = ?"), E.push(e.website)), e.expired_at !== void 0 && (r.push("expired_at = ?"), E.push(e.expired_at)), r.push("updated_at = CURRENT_TIMESTAMP"), E.push(t), n.exec(`UPDATE tokens SET ${r.join(", ")} WHERE id = ?`, E), _(t);
}
function w(t) {
  s().exec("DELETE FROM tokens WHERE id = ?", [t]);
}
function Y(t) {
  const e = s(), n = `%${t}%`;
  return e.prepare(`
    SELECT * FROM tokens 
    WHERE name LIKE ? OR description LIKE ? OR website LIKE ? OR env_name LIKE ?
    ORDER BY 
      CASE WHEN expired_at IS NULL THEN 0 ELSE 1 END,
      order_index ASC,
      CASE WHEN expired_at IS NULL THEN created_at ELSE expired_at END DESC
  `).all([
    n,
    n,
    n,
    n
  ]).map(R);
}
function V(t, e) {
  return s().exec(
    "UPDATE groups SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [e, t]
  ), p(t);
}
function j(t, e) {
  return s().exec(
    "UPDATE tokens SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [e, t]
  ), _(t);
}
function B(t) {
  const e = s();
  t.forEach((n, r) => {
    e.exec(
      "UPDATE groups SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [r, n]
    );
  });
}
function X(t) {
  const e = s();
  t.forEach((n, r) => {
    e.exec(
      "UPDATE tokens SET order_index = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      [r, n]
    );
  });
}
function K(t, e) {
  s().exec(
    "INSERT OR IGNORE INTO group_tokens (group_id, token_id) VALUES (?, ?)",
    [t, e]
  );
}
function J(t, e) {
  s().exec("DELETE FROM group_tokens WHERE group_id = ? AND token_id = ?", [
    t,
    e
  ]);
}
function h(t) {
  return s().prepare(`
    SELECT g.* FROM groups g
    INNER JOIN group_tokens gt ON g.id = gt.group_id
    WHERE gt.token_id = ?
    ORDER BY g.created_at DESC
  `).all([t]);
}
function $(t) {
  const e = p(t);
  if (!e) return null;
  const n = f(t);
  return { ...e, tokens: n };
}
function y(t) {
  const e = _(t);
  if (!e) return null;
  const n = h(t);
  return { ...e, groups: n };
}
function R(t) {
  return {
    ...t,
    tags: t.tags ? JSON.parse(t.tags) : void 0
  };
}
function q() {
  o.handle("group:list", () => v()), o.handle(
    "group:create",
    (t, e, n, r) => x(e, n, r)
  ), o.handle(
    "group:update",
    (t, e, n, r, E) => P(e, n, r, E)
  ), o.handle("group:delete", (t, e) => {
    F(e);
  }), o.handle("group:get", (t, e) => p(e)), o.handle("group:withTokens", (t, e) => $(e)), o.handle("token:list", () => H()), o.handle(
    "token:create",
    (t, e) => G(
      e.name,
      e.value,
      e.env_name,
      e.description,
      e.tags,
      e.website,
      e.expired_at
    )
  ), o.handle("token:update", (t, e, n) => W(e, n)), o.handle("token:delete", (t, e) => {
    w(e);
  }), o.handle("token:get", (t, e) => _(e)), o.handle("token:search", (t, e) => Y(e)), o.handle("token:withGroups", (t, e) => y(e)), o.handle(
    "order:updateGroupOrder",
    (t, e, n) => V(e, n)
  ), o.handle(
    "order:updateTokenOrder",
    (t, e, n) => j(e, n)
  ), o.handle("order:reorderGroups", (t, e) => {
    B(e);
  }), o.handle("order:reorderTokens", (t, e) => {
    X(e);
  }), o.handle("groupToken:add", (t, e, n) => {
    K(e, n);
  }), o.handle("groupToken:remove", (t, e, n) => {
    J(e, n);
  }), o.handle("groupToken:getGroupTokens", (t, e) => f(e)), o.handle("groupToken:getTokenGroups", (t, e) => h(e));
}
const m = a.dirname(U(import.meta.url));
process.env.APP_ROOT = a.join(m, "..");
const N = process.env.VITE_DEV_SERVER_URL, re = a.join(process.env.APP_ROOT, "dist-electron"), D = a.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = N ? a.join(process.env.APP_ROOT, "public") : D;
let u;
function O() {
  u = new A({
    icon: a.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: a.join(m, "preload.mjs")
    }
  }), u.webContents.on("did-finish-load", () => {
    u == null || u.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), N ? u.loadURL(N) : u.loadFile(a.join(D, "index.html"));
}
c.on("window-all-closed", () => {
  process.platform !== "darwin" && (c.quit(), u = null);
});
c.on("activate", () => {
  A.getAllWindows().length === 0 && O();
});
c.whenReady().then(async () => {
  await b(), q(), O();
});
export {
  re as MAIN_DIST,
  D as RENDERER_DIST,
  N as VITE_DEV_SERVER_URL
};
