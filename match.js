// match.js — services/staff matching with synonyms JSON + service_aliases table (ESM)
import { db } from "./db.js";

/* -------------------- text utils -------------------- */
function norm(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
function tokens(s) {
  return norm(s).split(/\s+/).filter(Boolean);
}
function jaccard(a, b) {
  const sa = new Set(a), sb = new Set(b);
  const inter = [...sa].filter(x => sb.has(x)).length;
  const uni = new Set([...sa, ...sb]).size || 1;
  return inter / uni; // 0..1
}
function levenshteinSim(a, b) {
  a = norm(a); b = norm(b);
  const m = a.length, n = b.length;
  if (!m && !n) return 1;
  if (!m || !n) return 0;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  const dist = dp[m][n];
  return 1 - dist / Math.max(m, n); // 0..1
}
function comboScore(q, cand) {
  // Combine token overlap + edit similarity; reward prefix/contains
  const qn = norm(q), cn = norm(cand);
  if (!qn || !cn) return 0;
  if (qn === cn) return 1.0;
  const tok = jaccard(tokens(qn), tokens(cn));
  const lev = levenshteinSim(qn, cn);
  let bonus = 0;
  if (cn.startsWith(qn)) bonus = Math.max(bonus, 0.12);
  if (cn.includes(qn))  bonus = Math.max(bonus, 0.06);
  return Math.max(tok, lev) + bonus; // cap later
}

/* -------------------- DB statements -------------------- */
const qAllServices = db.prepare(`SELECT id, name, duration_min, COALESCE(synonyms,'[]') AS synonyms FROM services`);
let qAliasesByService = null;
try {
  // Prepare only if table exists; if not, we'll ignore silently
  db.prepare(`SELECT 1 FROM service_aliases LIMIT 1`).get();
  qAliasesByService = db.prepare(`SELECT service_id, alias_lower FROM service_aliases`);
} catch { /* table not found — fine */ }

const qAllActiveStaff = db.prepare(`SELECT id, name, active, COALESCE(aliases,'[]') AS aliases, COALESCE(skills,'[]') AS skills FROM staff WHERE active=1`);

/* -------------------- Service candidate builder -------------------- */
function buildServiceCandidates() {
  const services = qAllServices.all();
  const byId = new Map();
  for (const s of services) {
    let syn = [];
    try { syn = JSON.parse(s.synonyms || "[]"); } catch { syn = []; }
    const labels = [s.name, ...syn.map(norm)];
    byId.set(s.id, { service: s, labels: new Set(labels.map(norm)) });
  }
  if (qAliasesByService) {
    for (const row of qAliasesByService.all()) {
      const entry = byId.get(row.service_id);
      if (entry) entry.labels.add(norm(row.alias_lower));
    }
  }
  // Convert label sets to arrays
  return [...byId.values()].map(v => ({ service: v.service, labels: [...v.labels] }));
}

/* -------------------- Matching: Services -------------------- */
export function matchServiceWithScore(name) {
  const q = norm(name || "");
  if (!q) return { service: null, score: 0, bestCandidate: null };

  const candidates = buildServiceCandidates();

  let best = { service: null, score: 0, label: null };
  for (const c of candidates) {
    let localBest = 0, localLabel = null;
    for (const lab of c.labels) {
      const sc = Math.min(1, comboScore(q, lab));
      if (sc > localBest) { localBest = sc; localLabel = lab; }
    }
    if (localBest > best.score) best = { service: c.service, score: localBest, label: localLabel };
  }

  return {
    service: best.score >= 0.75 ? best.service : null, // tolerate abbreviations/typos
    score: best.score,
    bestCandidate: best.service ? { name: best.service.name, matched: best.label } : null
  };
}

export function matchService(name) {
  const { service, score } = matchServiceWithScore(name);
  return score >= 0.75 ? service : null;
}

/* -------------------- Matching: Staff -------------------- */
export function matchStaffWithScore(nameOrAny, serviceId = null) {
  const q = norm(nameOrAny || "");
  const staff = qAllActiveStaff.all();

  // Optional: filter by skills if you start mapping serviceId -> staff.skills
  const qualified = staff.filter(st => {
    let skills = [];
    try { skills = JSON.parse(st.skills || "[]"); } catch { skills = []; }
    return !serviceId || !skills.length || skills.includes(serviceId);
  });

  if (!q || q === "any" || q === "anyone") {
    return { staff: null, score: 0.5, pool: qualified, bestCandidate: null };
  }

  let best = { st: null, score: 0, label: null };
  for (const st of qualified) {
    let aliases = [];
    try { aliases = JSON.parse(st.aliases || "[]"); } catch { aliases = []; }
    const labels = [st.name, ...aliases];
    let local = 0, lab = null;
    for (const lb of labels) {
      const sc = Math.min(1, comboScore(q, lb));
      if (sc > local) { local = sc; lab = lb; }
    }
    if (local > best.score) best = { st, score: local, label: lab };
  }

  return {
    staff: best.score >= 0.75 ? best.st : null,
    score: best.score,
    pool: qualified,
    bestCandidate: best.st ? { name: best.st.name, matched: best.label } : null
  };
}

export function matchStaff(nameOrAny, serviceId = null) {
  const { staff, score, pool } = matchStaffWithScore(nameOrAny, serviceId);
  return score >= 0.75 ? { staff, pool } : { staff: null, pool };
}
