// kb.js — tiny FTS5 knowledge base (ESM)
import Database from "better-sqlite3";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, "salon.db")); // same DB as rest

// Ensure FTS5 virtual table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS kb_docs(
    id INTEGER PRIMARY KEY,
    title TEXT,
    section TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS kb_fts
  USING fts5(content, doc_id UNINDEXED, tokenize='unicode61');
`);

// Simple helpers
const upsertDoc = db.prepare(`
  INSERT INTO kb_docs(id, title, section, updated_at)
  VALUES(?, ?, ?, datetime('now'))
  ON CONFLICT(id) DO UPDATE SET
    title=excluded.title,
    section=excluded.section,
    updated_at=datetime('now')
`);
const insertFts = db.prepare(`
  INSERT INTO kb_fts(rowid, content, doc_id) VALUES (?, ?, ?)
`);
const deleteFts = db.prepare(`DELETE FROM kb_fts WHERE doc_id=?`);

/**
 * Upsert a KB entry
 * @param {object} doc {id, title, section, content}
 */
export function upsertKb(doc) {
  const { id, title, section, content } = doc;
  if (!id || !content) return;
  const tx = db.transaction(() => {
    upsertDoc.run(id, title || null, section || null);
    deleteFts.run(id);
    insertFts.run(id, String(content), id);
  });
  tx();
}

/**
 * Build a safe FTS5 MATCH string:
 * - keep only letters/digits/space
 * - split to tokens, require AND between terms
 * - add prefix * so “colour” matches “colouring”, etc.
 */
function buildFtsQuery(nl) {
  const cleaned = String(nl || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const terms = cleaned.split(" ").filter(t => t.length > 1).slice(0, 6);
  if (!terms.length) return null;

  // e.g. "haircut tomorrow" -> "haircut* AND tomorrow*"
  return terms.map(t => `${t}*`).join(" AND ");
}

/**
 * Search knowledge base
 * @param {string} query
 * @param {number} limit
 * @returns [{doc_id, snippet, score}]
 */
export function searchKb(query, limit = 3) {
  try {
    const match = buildFtsQuery(query);
    if (!match) return [];

    // DO NOT use MATCH ? — inline the sanitized string
    const sql = `
      SELECT doc_id,
             snippet(kb_fts, -1, '[', ']', ' … ', 8) AS snippet,
             bm25(kb_fts) AS score
      FROM kb_fts
      WHERE kb_fts MATCH ${quoteForSql(match)}
      ORDER BY score ASC
      LIMIT ${Number(limit) || 3}
    `;
    return db.prepare(sql).all();
  } catch (e) {
    console.error("kbSearch error:", e);
    return [];
  }
}

// Quote a value for SQL (single quotes escaped)
function quoteForSql(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}
