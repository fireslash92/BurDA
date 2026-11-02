// functions/service.ts
import { database } from "./transaction.mjs";
import { z } from "zod";

// functions/domain.ts
var DEFAULT_AXES = [
  { label: "\u0627\u0644\u062A\u0648\u0639\u064A\u0629 \u0648\u0627\u0644\u062A\u062F\u0631\u064A\u0628", description: "\u0648\u0631\u0634 \u0648\u062C\u0644\u0633\u0627\u062A \u0645\u0643\u062A\u0645\u0644\u0629 \u0644\u0644\u062A\u0648\u0639\u064A\u0629 \u0628\u0627\u0644\u062A\u062D\u0648\u0644 \u0627\u0644\u0631\u0642\u0645\u064A\u060C \u0645\u0648\u062B\u0642\u0629 \u0628\u062D\u0636\u0648\u0631 \u0648\u0645\u062D\u062A\u0648\u0649 \u0648\u0627\u0636\u062D.", unit: "\u062C\u0644\u0633\u0629", weight: 25, default_target: 4 },
  { label: "\u0627\u0644\u0645\u0628\u0627\u062F\u0631\u0627\u062A \u0627\u0644\u0631\u0642\u0645\u064A\u0629", description: "\u0645\u0628\u0627\u062F\u0631\u0627\u062A \u0623\u0648 \u062A\u062D\u0633\u064A\u0646\u0627\u062A \u0631\u0642\u0645\u064A\u0629 \u0645\u0646\u0641\u0630\u0629\u060C \u0645\u0648\u062B\u0642\u0629 \u0628\u0645\u062E\u0631\u062C\u0627\u062A \u0648\u0623\u062B\u0631 \u0642\u0627\u0628\u0644 \u0644\u0644\u0642\u064A\u0627\u0633.", unit: "\u0645\u0628\u0627\u062F\u0631\u0629", weight: 30, default_target: 2 },
  { label: "\u0627\u0644\u062F\u0639\u0645 \u0648\u0646\u0642\u0644 \u0627\u0644\u0645\u0639\u0631\u0641\u0629", description: "\u062D\u0627\u0644\u0627\u062A \u062F\u0639\u0645 \u0645\u0643\u062A\u0645\u0644\u0629 \u0623\u0648 \u0645\u0648\u0627\u062F \u0645\u0639\u0631\u0641\u064A\u0629 \u062A\u0645\u062A \u0645\u0634\u0627\u0631\u0643\u062A\u0647\u0627 \u0648\u062A\u0648\u062B\u064A\u0642 \u0627\u0644\u0627\u0633\u062A\u0641\u0627\u062F\u0629 \u0645\u0646\u0647\u0627.", unit: "\u0645\u0633\u0627\u0647\u0645\u0629", weight: 20, default_target: 8 },
  { label: "\u0627\u0644\u062A\u0642\u0627\u0631\u064A\u0631 \u0648\u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629", description: "\u062A\u0642\u0627\u0631\u064A\u0631 \u062F\u0648\u0631\u064A\u0629 \u0645\u0643\u062A\u0645\u0644\u0629 \u0648\u0645\u0631\u0641\u0648\u0639\u0629 \u0641\u064A \u0627\u0644\u0645\u0648\u0627\u0639\u064A\u062F \u0627\u0644\u0645\u062D\u062F\u062F\u0629 \u0645\u0639 \u062A\u0648\u062B\u064A\u0642 \u0627\u0644\u0645\u062A\u0627\u0628\u0639\u0629.", unit: "\u062A\u0642\u0631\u064A\u0631", weight: 15, default_target: 3 },
  { label: "\u0627\u0644\u0634\u0631\u0627\u0643\u0627\u062A \u0648\u0627\u0644\u062A\u0639\u0627\u0648\u0646", description: "\u0623\u0646\u0634\u0637\u0629 \u062A\u0639\u0627\u0648\u0646 \u0645\u0646\u0641\u0630\u0629 \u0645\u0639 \u062C\u0647\u0627\u062A \u0623\u062E\u0631\u0649 \u0644\u062F\u0639\u0645 \u0627\u0644\u062A\u062D\u0648\u0644 \u0627\u0644\u0631\u0642\u0645\u064A.", unit: "\u0646\u0634\u0627\u0637", weight: 10, default_target: 2 }
];
function canReview(role) {
  return role === "admin" || role === "reviewer";
}
function canWriteFor(member, id2) {
  return member.role === "admin" || member.role === "ambassador" && member.ambassador_id === id2;
}
function quarterPeriod(year, quarter) {
  const month = (quarter - 1) * 3 + 1;
  const end = new Date(Date.UTC(year, month + 2, 0)).toISOString().slice(0, 10);
  return { id: `${year}-Q${quarter}`, label: `\u0627\u0644\u0631\u0628\u0639 ${["\u0627\u0644\u0623\u0648\u0644", "\u0627\u0644\u062B\u0627\u0646\u064A", "\u0627\u0644\u062B\u0627\u0644\u062B", "\u0627\u0644\u0631\u0627\u0628\u0639"][quarter - 1]} ${year}`, starts_on: `${year}-${String(month).padStart(2, "0")}-01`, ends_on: end, locked: 0 };
}

// functions/service.ts
var AppError = class extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
  status;
};
function now() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function id() {
  return crypto.randomUUID();
}
var label = z.string().trim().min(2, "\u0623\u062F\u062E\u0644 \u0646\u0635\u0627\u064B \u0648\u0627\u0636\u062D\u0627\u064B.").max(150);
var email = z.string().trim().email("\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A \u063A\u064A\u0631 \u0635\u062D\u064A\u062D.").transform((v) => v.toLowerCase());
var optionalEmail = z.union([email, z.literal("")]);
var key = z.string().min(1).max(100);
var count = z.number().int().min(1).max(1e5);
var optionalUrl = z.string().trim().max(1500).refine((v) => {
  if (!v) return true;
  try {
    const u = new URL(v);
    return u.protocol === "https:" && !u.username && !u.password;
  } catch {
    return false;
  }
}, "\u0631\u0627\u0628\u0637 \u0627\u0644\u062F\u0644\u064A\u0644 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0628\u062F\u0623 \u0628\u0640 https://");
function logStatement(actor, action, entity, detail) {
  return database().prepare("INSERT INTO audit (id,actor,action,entity_id,detail,created_at) VALUES (?,?,?,?,?,?)").bind(id(), actor, action, entity, JSON.stringify(detail), now());
}
async function getMember(user) {
  const db = database(), mail = user.email.toLowerCase(), time = now();
  if (user.userId === process.env.BURDA_OWNER_UID && process.env.BURDA_OWNER_UID) {
    await db.batch([
      db.prepare("INSERT OR IGNORE INTO settings (key,value) VALUES ('owner_user_id',?)").bind(user.userId),
      db.prepare("INSERT OR IGNORE INTO members (email,user_id,name,role,ambassador_id,created_at) VALUES (?,?,?,'admin',NULL,?)").bind(mail, user.userId, user.displayName, time)
    ]);
  }
  const member = await db.prepare("SELECT * FROM members WHERE user_id=? OR email=? LIMIT 1").bind(user.userId, mail).first();
  if (!member) throw new AppError("\u0644\u064A\u0633 \u0644\u062D\u0633\u0627\u0628\u0643 \u0635\u0644\u0627\u062D\u064A\u0629 \u062F\u062E\u0648\u0644. \u0627\u0637\u0644\u0628 \u0645\u0646 \u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0646\u0635\u0629 \u0625\u0636\u0627\u0641\u0629 \u0628\u0631\u064A\u062F\u0643 \u0625\u0644\u0649 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645\u064A\u0646.", 403);
  if (member.user_id && member.user_id !== user.userId) throw new AppError("\u0647\u0648\u064A\u0629 \u0627\u0644\u062D\u0633\u0627\u0628 \u0644\u0627 \u062A\u0637\u0627\u0628\u0642 \u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0645\u0633\u062C\u0644.", 403);
  if (!member.user_id) await db.prepare("UPDATE members SET user_id=? WHERE email=? AND user_id IS NULL").bind(user.userId, mail).run();
  member.user_id = user.userId;
  await initialize();
  return member;
}
async function initialize() {
  const db = database(), p = quarterPeriod(2026, 4);
  if (await db.prepare("SELECT value FROM settings WHERE key='initialized'").first()) return;
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO periods (id,label,starts_on,ends_on,locked) VALUES (?,?,?,?,0)").bind(p.id, p.label, p.starts_on, p.ends_on),
    ...DEFAULT_AXES.map((a, i) => db.prepare("INSERT OR IGNORE INTO indicators (id,period_id,label,description,unit,weight,default_target,position) VALUES (?,?,?,?,?,?,?,?)").bind(p.id + "-i" + i, p.id, a.label, a.description, a.unit, a.weight, a.default_target, i)),
    db.prepare("INSERT OR IGNORE INTO settings (key,value) VALUES ('initialized','1')")
  ]);
}
async function all(sql, ...values) {
  return (await database().prepare(sql).bind(...values).all()).results;
}
async function getState(me) {
  const own = me.role === "ambassador", ownId = me.ambassador_id ?? "unassigned";
  const res = await Promise.all([
    own ? all("SELECT * FROM ambassadors WHERE id=?", ownId) : all("SELECT * FROM ambassadors ORDER BY active DESC,name"),
    all("SELECT * FROM periods ORDER BY starts_on DESC"),
    all("SELECT * FROM indicators ORDER BY period_id,position"),
    own ? all("SELECT * FROM targets WHERE ambassador_id=?", ownId) : all("SELECT * FROM targets"),
    own ? all("SELECT * FROM achievements WHERE ambassador_id=? ORDER BY date DESC", ownId) : all("SELECT * FROM achievements ORDER BY date DESC"),
    own ? all("SELECT files.id,files.achievement_id,files.name,files.mime,files.size,files.created_at FROM files JOIN achievements ON files.achievement_id=achievements.id WHERE achievements.ambassador_id=?", ownId) : all("SELECT id,achievement_id,name,mime,size,created_at FROM files"),
    me.role === "admin" ? all("SELECT * FROM members ORDER BY role,name") : Promise.resolve([]),
    canReview(me.role) ? all("SELECT * FROM audit ORDER BY created_at DESC LIMIT 100") : Promise.resolve([])
  ]);
  return { me, ambassadors: res[0], periods: res[1], indicators: res[2], targets: res[3], achievements: res[4], files: res[5], members: res[6], audit: res[7] };
}
function admin(me) {
  if (me.role !== "admin") throw new AppError("\u0647\u0630\u0647 \u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u0644\u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0646\u0635\u0629 \u0641\u0642\u0637.", 403);
}
async function openPeriod(periodId) {
  const p = await database().prepare("SELECT * FROM periods WHERE id=?").bind(periodId).first();
  if (!p) throw new AppError("\u0641\u062A\u0631\u0629 \u0627\u0644\u0631\u0635\u062F \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629.", 404);
  if (p.locked) throw new AppError("\u0647\u0630\u0647 \u0627\u0644\u0641\u062A\u0631\u0629 \u0645\u063A\u0644\u0642\u0629. \u064A\u062C\u0628 \u0623\u0646 \u064A\u0639\u064A\u062F \u0645\u062F\u064A\u0631 \u0627\u0644\u0645\u0646\u0635\u0629 \u0641\u062A\u062D\u0647\u0627 \u0642\u0628\u0644 \u0627\u0644\u062A\u0639\u062F\u064A\u0644.", 409);
  return p;
}
async function editableAchievement(me, achievementId) {
  const a = await database().prepare("SELECT * FROM achievements WHERE id=?").bind(achievementId).first();
  if (!a) throw new AppError("\u0627\u0644\u0625\u0646\u062C\u0627\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", 404);
  if (!canWriteFor(me, a.ambassador_id)) throw new AppError("\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u062A\u0639\u062F\u064A\u0644 \u0633\u062C\u0644 \u0633\u0641\u064A\u0631 \u0622\u062E\u0631.", 403);
  if (a.status !== "draft" && a.status !== "returned") throw new AppError("\u064A\u0645\u0643\u0646 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0633\u0648\u062F\u0627\u062A \u0648\u0627\u0644\u0625\u0646\u062C\u0627\u0632\u0627\u062A \u0627\u0644\u0645\u0639\u0627\u062F\u0629 \u0641\u0642\u0637.", 409);
  await openPeriod(a.period_id);
  return a;
}
async function mutate(me, input) {
  const base = z.object({ action: z.string() }).parse(input), db = database();
  if (base.action === "ambassador") {
    admin(me);
    const v = z.object({ id: key.optional(), name: label, organization: label, wilaya: z.enum(["\u0627\u0644\u0628\u0631\u064A\u0645\u064A", "\u0645\u062D\u0636\u0629", "\u0627\u0644\u0633\u0646\u064A\u0646\u0629"]), email: optionalEmail, active: z.number().int().min(0).max(1).default(1) }).parse(input), aid = v.id ?? id();
    if (v.id) {
      const old = await db.prepare("SELECT * FROM ambassadors WHERE id=?").bind(aid).first();
      if (!old) throw new AppError("\u0627\u0644\u0633\u0641\u064A\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", 404);
      await db.batch([db.prepare("UPDATE ambassadors SET name=?,organization=?,wilaya=?,email=?,active=? WHERE id=?").bind(v.name, v.organization, v.wilaya, v.email, v.active, aid), logStatement(me.email, "\u062A\u0639\u062F\u064A\u0644 \u0645\u0644\u0641 \u0633\u0641\u064A\u0631", aid, { before: old, after: v })]);
    } else {
      const axes = await all("SELECT indicators.* FROM indicators JOIN periods ON indicators.period_id=periods.id WHERE periods.locked=0");
      await db.batch([db.prepare("INSERT INTO ambassadors (id,name,organization,wilaya,email,active,created_at) VALUES (?,?,?,?,?,?,?)").bind(aid, v.name, v.organization, v.wilaya, v.email, 1, now()), ...axes.map((a) => db.prepare("INSERT INTO targets (ambassador_id,indicator_id,value) VALUES (?,?,?)").bind(aid, a.id, a.default_target)), logStatement(me.email, "\u0625\u0636\u0627\u0641\u0629 \u0633\u0641\u064A\u0631", aid, v)]);
    }
    return { id: aid };
  }
  if (base.action === "period") {
    admin(me);
    const v = z.object({ year: z.number().int().min(2020).max(2100), quarter: z.number().int().min(1).max(4), source: key }).parse(input), p = quarterPeriod(v.year, v.quarter);
    if (await db.prepare("SELECT id FROM periods WHERE id=?").bind(p.id).first()) throw new AppError("\u0647\u0630\u0647 \u0627\u0644\u0641\u062A\u0631\u0629 \u0645\u0636\u0627\u0641\u0629 \u0628\u0627\u0644\u0641\u0639\u0644.", 409);
    const axes = await all("SELECT * FROM indicators WHERE period_id=? ORDER BY position", v.source);
    if (!axes.length) throw new AppError("\u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u0645\u0635\u062F\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629.");
    const people = await all("SELECT * FROM ambassadors WHERE active=1"), copies = axes.map((a, i) => ({ ...a, id: p.id + "-i" + i, period_id: p.id }));
    await db.batch([db.prepare("INSERT INTO periods (id,label,starts_on,ends_on,locked) VALUES (?,?,?,?,0)").bind(p.id, p.label, p.starts_on, p.ends_on), ...copies.map((a) => db.prepare("INSERT INTO indicators (id,period_id,label,description,unit,weight,default_target,position) VALUES (?,?,?,?,?,?,?,?)").bind(a.id, p.id, a.label, a.description, a.unit, a.weight, a.default_target, a.position)), ...people.flatMap((a) => copies.map((i) => db.prepare("INSERT INTO targets (ambassador_id,indicator_id,value) VALUES (?,?,?)").bind(a.id, i.id, i.default_target))), logStatement(me.email, "\u0625\u0636\u0627\u0641\u0629 \u0641\u062A\u0631\u0629 \u0631\u0635\u062F", p.id, p)]);
    return { id: p.id };
  }
  if (base.action === "lock") {
    admin(me);
    const v = z.object({ period_id: key, locked: z.boolean() }).parse(input);
    if (!await db.prepare("SELECT id FROM periods WHERE id=?").bind(v.period_id).first()) throw new AppError("\u0627\u0644\u0641\u062A\u0631\u0629 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F\u0629.", 404);
    if (v.locked && await db.prepare("SELECT id FROM achievements WHERE period_id=? AND status='submitted' LIMIT 1").bind(v.period_id).first()) throw new AppError("\u0623\u0643\u0645\u0644 \u0645\u0631\u0627\u062C\u0639\u0629 \u0627\u0644\u0625\u0646\u062C\u0627\u0632\u0627\u062A \u0627\u0644\u0645\u0639\u0644\u0642\u0629 \u0642\u0628\u0644 \u0625\u063A\u0644\u0627\u0642 \u0627\u0644\u0641\u062A\u0631\u0629.");
    await db.batch([db.prepare("UPDATE periods SET locked=? WHERE id=?").bind(v.locked ? 1 : 0, v.period_id), logStatement(me.email, v.locked ? "\u0625\u063A\u0644\u0627\u0642 \u0641\u062A\u0631\u0629" : "\u0625\u0639\u0627\u062F\u0629 \u0641\u062A\u062D \u0641\u062A\u0631\u0629", v.period_id, v)]);
    return {};
  }
  if (base.action === "indicators") {
    admin(me);
    const v = z.object({ period_id: key, items: z.array(z.object({ id: key, label, description: z.string().trim().min(5).max(1e3), unit: z.string().trim().min(1).max(30), weight: z.number().min(1).max(100), default_target: count })).min(1).max(20) }).parse(input);
    await openPeriod(v.period_id);
    if (Math.abs(v.items.reduce((n, a) => n + a.weight, 0) - 100) > 1e-3) throw new AppError("\u0645\u062C\u0645\u0648\u0639 \u0623\u0648\u0632\u0627\u0646 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A \u064A\u062C\u0628 \u0623\u0646 \u064A\u0633\u0627\u0648\u064A 100%.");
    const old = await all("SELECT * FROM indicators WHERE period_id=?", v.period_id);
    if (v.items.length !== old.length || new Set(v.items.map((a) => a.id)).size !== old.length || v.items.some((a) => !old.find((i) => i.id === a.id))) throw new AppError("\u0642\u0627\u0626\u0645\u0629 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A \u063A\u064A\u0631 \u0645\u062A\u0637\u0627\u0628\u0642\u0629.");
    await db.batch([...v.items.map((a) => db.prepare("UPDATE indicators SET label=?,description=?,unit=?,weight=?,default_target=? WHERE id=? AND period_id=?").bind(a.label, a.description, a.unit, a.weight, a.default_target, a.id, v.period_id)), logStatement(me.email, "\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0624\u0634\u0631\u0627\u062A \u0648\u0627\u0644\u0623\u0648\u0632\u0627\u0646", v.period_id, { before: old, after: v.items })]);
    return {};
  }
  if (base.action === "targets") {
    admin(me);
    const v = z.object({ period_id: key, ambassador_id: key, items: z.array(z.object({ indicator_id: key, value: count })).min(1).max(20) }).parse(input);
    await openPeriod(v.period_id);
    if (!await db.prepare("SELECT id FROM ambassadors WHERE id=?").bind(v.ambassador_id).first()) throw new AppError("\u0627\u0644\u0633\u0641\u064A\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", 404);
    const axes = await all("SELECT * FROM indicators WHERE period_id=?", v.period_id);
    if (v.items.length !== axes.length || new Set(v.items.map((a) => a.indicator_id)).size !== axes.length || v.items.some((a) => !axes.find((i) => i.id === a.indicator_id))) throw new AppError("\u0627\u0644\u0645\u0633\u062A\u0647\u062F\u0641\u0627\u062A \u0644\u0627 \u062A\u0637\u0627\u0628\u0642 \u0645\u0624\u0634\u0631\u0627\u062A \u0627\u0644\u0641\u062A\u0631\u0629.");
    const old = await all("SELECT targets.* FROM targets JOIN indicators ON targets.indicator_id=indicators.id WHERE targets.ambassador_id=? AND indicators.period_id=?", v.ambassador_id, v.period_id);
    await db.batch([...v.items.map((a) => db.prepare("INSERT INTO targets (ambassador_id,indicator_id,value) VALUES (?,?,?) ON CONFLICT(ambassador_id,indicator_id) DO UPDATE SET value=excluded.value").bind(v.ambassador_id, a.indicator_id, a.value)), logStatement(me.email, "\u062A\u0639\u062F\u064A\u0644 \u0645\u0633\u062A\u0647\u062F\u0641\u0627\u062A \u0633\u0641\u064A\u0631", v.ambassador_id, { period: v.period_id, before: old, after: v.items })]);
    return {};
  }
  if (base.action === "achievement") {
    const v = z.object({ id: key.optional(), ambassador_id: key, indicator_id: key, period_id: key, title: label, description: z.string().trim().min(10, "\u0627\u0643\u062A\u0628 \u0648\u0635\u0641\u0627\u064B \u0644\u0644\u0625\u0646\u062C\u0627\u0632 \u0644\u0627 \u064A\u0642\u0644 \u0639\u0646 10 \u0623\u062D\u0631\u0641.").max(5e3), quantity: count, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), beneficiaries: z.number().int().min(0).max(1e6), evidence_url: optionalUrl }).parse(input);
    if (!canWriteFor(me, v.ambassador_id)) throw new AppError("\u0644\u0627 \u064A\u0645\u0643\u0646\u0643 \u0625\u0636\u0627\u0641\u0629 \u0625\u0646\u062C\u0627\u0632 \u0644\u0633\u0641\u064A\u0631 \u0622\u062E\u0631.", 403);
    const p = await openPeriod(v.period_id);
    if (v.date < p.starts_on || v.date > p.ends_on || Number.isNaN(Date.parse(v.date)) || new Date(v.date).toISOString().slice(0, 10) !== v.date) throw new AppError("\u062A\u0627\u0631\u064A\u062E \u0627\u0644\u0625\u0646\u062C\u0627\u0632 \u064A\u062C\u0628 \u0623\u0646 \u064A\u0643\u0648\u0646 \u0635\u062D\u064A\u062D\u0627\u064B \u0648\u0636\u0645\u0646 \u0641\u062A\u0631\u0629 \u0627\u0644\u0631\u0635\u062F.");
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Muscat", year: "numeric", month: "2-digit", day: "2-digit" }).format(/* @__PURE__ */ new Date());
    if (v.date > today) throw new AppError("\u0633\u062C\u0651\u0644 \u0625\u0646\u062C\u0627\u0632\u0627\u064B \u062A\u0645 \u062A\u0646\u0641\u064A\u0630\u0647 \u0628\u0627\u0644\u0641\u0639\u0644\u060C \u062F\u0648\u0646 \u062A\u0627\u0631\u064A\u062E \u0645\u0633\u062A\u0642\u0628\u0644\u064A.");
    if (!await db.prepare("SELECT id FROM indicators WHERE id=? AND period_id=?").bind(v.indicator_id, v.period_id).first()) throw new AppError("\u0627\u0644\u0645\u0624\u0634\u0631 \u0644\u0627 \u064A\u062A\u0628\u0639 \u0627\u0644\u0641\u062A\u0631\u0629 \u0627\u0644\u0645\u062D\u062F\u062F\u0629.");
    if (!await db.prepare("SELECT id FROM ambassadors WHERE id=? AND active=1").bind(v.ambassador_id).first()) throw new AppError("\u0627\u0644\u0633\u0641\u064A\u0631 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F \u0623\u0648 \u0645\u0644\u0641\u0647 \u0645\u0624\u0631\u0634\u0641.");
    const aid = v.id ?? id(), time = now();
    if (v.id) {
      const old = await editableAchievement(me, v.id);
      if (old.ambassador_id !== v.ambassador_id || old.period_id !== v.period_id) throw new AppError("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0646\u0642\u0644 \u0627\u0644\u0625\u0646\u062C\u0627\u0632 \u0625\u0644\u0649 \u0633\u0641\u064A\u0631 \u0623\u0648 \u0641\u062A\u0631\u0629 \u0623\u062E\u0631\u0649.");
      await db.batch([db.prepare("UPDATE achievements SET indicator_id=?,title=?,description=?,quantity=?,date=?,beneficiaries=?,evidence_url=?,status='draft',reviewer='',review_comment='',reviewed_at=NULL,updated_at=? WHERE id=? AND status IN ('draft','returned')").bind(v.indicator_id, v.title, v.description, v.quantity, v.date, v.beneficiaries, v.evidence_url, time, aid), logStatement(me.email, "\u062A\u0639\u062F\u064A\u0644 \u0645\u0633\u0648\u062F\u0629 \u0625\u0646\u062C\u0627\u0632", aid, { before: old, after: v })]);
    } else await db.batch([db.prepare("INSERT INTO achievements (id,ambassador_id,indicator_id,period_id,title,description,quantity,date,beneficiaries,evidence_url,status,created_by,created_at,updated_at,reviewer,review_comment) VALUES (?,?,?,?,?,?,?,?,?,?,'draft',?,?,?,'','')").bind(aid, v.ambassador_id, v.indicator_id, v.period_id, v.title, v.description, v.quantity, v.date, v.beneficiaries, v.evidence_url, me.email, time, time), logStatement(me.email, "\u0625\u0636\u0627\u0641\u0629 \u0645\u0633\u0648\u062F\u0629 \u0625\u0646\u062C\u0627\u0632", aid, v)]);
    return { id: aid };
  }
  if (base.action === "submit") {
    const v = z.object({ id: key }).parse(input), a = await editableAchievement(me, v.id);
    if (!await db.prepare("SELECT id FROM files WHERE achievement_id=? LIMIT 1").bind(a.id).first() && !a.evidence_url) throw new AppError("\u0623\u0631\u0641\u0642 \u0645\u0644\u0641\u0627\u064B \u0623\u0648 \u0631\u0627\u0628\u0637 \u062F\u0644\u064A\u0644 \u0642\u0628\u0644 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0625\u0646\u062C\u0627\u0632 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629.");
    await db.batch([db.prepare("UPDATE achievements SET status='submitted',updated_at=? WHERE id=? AND status IN ('draft','returned')").bind(now(), a.id), logStatement(me.email, "\u0625\u0631\u0633\u0627\u0644 \u0625\u0646\u062C\u0627\u0632 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629", a.id, { title: a.title })]);
    return {};
  }
  if (base.action === "review") {
    if (!canReview(me.role)) throw new AppError("\u0627\u0639\u062A\u0645\u0627\u062F \u0627\u0644\u0625\u0646\u062C\u0627\u0632\u0627\u062A \u0645\u062A\u0627\u062D \u0644\u0645\u0643\u062A\u0628 \u0627\u0644\u0645\u062D\u0627\u0641\u0638 \u0641\u0642\u0637.", 403);
    const v = z.object({ id: key, status: z.enum(["approved", "returned"]), comment: z.string().trim().max(2e3) }).parse(input), a = await db.prepare("SELECT * FROM achievements WHERE id=?").bind(v.id).first();
    if (!a) throw new AppError("\u0627\u0644\u0625\u0646\u062C\u0627\u0632 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.", 404);
    await openPeriod(a.period_id);
    if (a.status !== "submitted") throw new AppError("\u062A\u0645\u062A \u0645\u0639\u0627\u0644\u062C\u0629 \u0627\u0644\u0625\u0646\u062C\u0627\u0632 \u0623\u0648 \u0644\u0645 \u064A\u0631\u0633\u0644 \u0644\u0644\u0645\u0631\u0627\u062C\u0639\u0629.", 409);
    if (v.status === "returned" && v.comment.length < 3) throw new AppError("\u0627\u0643\u062A\u0628 \u0633\u0628\u0628 \u0627\u0644\u0625\u0639\u0627\u062F\u0629 \u0644\u064A\u062A\u0633\u0646\u0649 \u0644\u0644\u0633\u0641\u064A\u0631 \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0625\u0646\u062C\u0627\u0632.");
    const result = await db.batch([db.prepare("UPDATE achievements SET status=?,reviewer=?,review_comment=?,reviewed_at=?,updated_at=? WHERE id=? AND status='submitted'").bind(v.status, me.email, v.comment, now(), now(), a.id), logStatement(me.email, v.status === "approved" ? "\u0627\u0639\u062A\u0645\u0627\u062F \u0625\u0646\u062C\u0627\u0632" : "\u0625\u0639\u0627\u062F\u0629 \u0625\u0646\u062C\u0627\u0632 \u0644\u0644\u062A\u0639\u062F\u064A\u0644", a.id, { title: a.title, comment: v.comment })]);
    if (!result[0].meta.changes) throw new AppError("\u0631\u0627\u062C\u0639 \u0634\u062E\u0635 \u0622\u062E\u0631 \u0647\u0630\u0627 \u0627\u0644\u0625\u0646\u062C\u0627\u0632 \u0628\u0627\u0644\u0641\u0639\u0644. \u062D\u062F\u0651\u062B \u0627\u0644\u0635\u0641\u062D\u0629.", 409);
    return {};
  }
  if (base.action === "member") {
    admin(me);
    const v = z.object({ email, name: label, role: z.enum(["admin", "reviewer", "viewer", "ambassador"]), ambassador_id: key.nullable() }).parse(input), owner = await db.prepare("SELECT value FROM settings WHERE key='owner_user_id'").first(), existing = await db.prepare("SELECT * FROM members WHERE email=?").bind(v.email).first();
    if (existing?.user_id === owner?.value) throw new AppError("\u0644\u0627 \u064A\u0645\u0643\u0646 \u062A\u063A\u064A\u064A\u0631 \u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0635\u0629.");
    if (v.role === "ambassador" && (!v.ambassador_id || !await db.prepare("SELECT id FROM ambassadors WHERE id=? AND active=1").bind(v.ambassador_id).first())) throw new AppError("\u0627\u0631\u0628\u0637 \u062D\u0633\u0627\u0628 \u0627\u0644\u0633\u0641\u064A\u0631 \u0628\u0645\u0644\u0641 \u0633\u0641\u064A\u0631 \u0646\u0634\u0637.");
    await db.batch([db.prepare("INSERT INTO members (email,name,role,ambassador_id,created_at) VALUES (?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET name=excluded.name,role=excluded.role,ambassador_id=excluded.ambassador_id").bind(v.email, v.name, v.role, v.role === "ambassador" ? v.ambassador_id : null, now()), logStatement(me.email, "\u062A\u062D\u062F\u064A\u062B \u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u0633\u062A\u062E\u062F\u0645", v.email, { before: existing, after: v })]);
    return {};
  }
  if (base.action === "removeMember") {
    admin(me);
    const v = z.object({ email }).parse(input), old = await db.prepare("SELECT * FROM members WHERE email=?").bind(v.email).first(), owner = await db.prepare("SELECT value FROM settings WHERE key='owner_user_id'").first();
    if (!old) throw new AppError("\u0627\u0644\u0645\u0633\u062A\u062E\u062F\u0645 \u063A\u064A\u0631 \u0645\u0648\u062C\u0648\u062F.");
    if (old.user_id === owner?.value) throw new AppError("\u0644\u0627 \u064A\u0645\u0643\u0646 \u0625\u0632\u0627\u0644\u0629 \u0645\u0627\u0644\u0643 \u0627\u0644\u0645\u0646\u0635\u0629.");
    await db.batch([db.prepare("DELETE FROM members WHERE email=?").bind(v.email), logStatement(me.email, "\u0625\u0632\u0627\u0644\u0629 \u0635\u0644\u0627\u062D\u064A\u0629 \u0645\u0633\u062A\u062E\u062F\u0645", v.email, old)]);
    return {};
  }
  throw new AppError("\u0627\u0644\u0639\u0645\u0644\u064A\u0629 \u063A\u064A\u0631 \u0645\u0639\u0631\u0648\u0641\u0629.");
}
export {
  AppError,
  editableAchievement,
  getMember,
  getState,
  logStatement,
  mutate,
  openPeriod
};
