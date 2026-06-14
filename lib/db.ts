/**
 * db.ts — Upstash Redis + local JSON fallback
 * Production (Vercel): pakai @upstash/redis via KV_REST_API_URL + KV_REST_API_TOKEN
 * Local dev: pakai JSON file
 */

import fs from "fs";
import path from "path";

export type Member = { id: number; phone: string; name: string; points: number; created_at: string; };
export type Reward = { id: number; name: string; description: string; points_required: number; active: number; };
export type Transaction = { id: number; member_id: number; type: "earn" | "redeem"; amount: number; points_delta: number; reward_name: string | null; note: string | null; created_at: string; };
type DB = { settings: { key: string; value: string }[]; members: Member[]; rewards: Reward[]; transactions: Transaction[]; _seq: { members: number; rewards: number; transactions: number }; };

function now() { return new Date().toISOString().replace("T", " ").substring(0, 19); }

const IS_VERCEL = !!process.env.KV_REST_API_URL;
const REDIS_KEY = "otoko:db";

function defaultDB(): DB {
  return {
    settings: [
      { key: "points_per_idr", value: "10000" },
      { key: "shop_name", value: "Otoko Coffee Shop" },
    ],
    rewards: [
      { id: 1, name: "Upsize Gratis", description: "Upgrade ukuran minuman apa saja, gratis", points_required: 15, active: 1 },
      { id: 2, name: "Free Americano (Reg)", description: "Tukar 1 cup Americano regular gratis", points_required: 30, active: 1 },
      { id: 3, name: "Free Pastry", description: "Tukar 1 pastry pilihan (croissant/donut)", points_required: 50, active: 1 },
      { id: 4, name: "Diskon 20% Bill", description: "Potongan 20% untuk total transaksi", points_required: 80, active: 1 },
      { id: 5, name: "Free Signature Drink", description: "Tukar 1 signature drink pilihan toko", points_required: 120, active: 1 },
    ],
    members: [
      { id: 1, phone: "081234567890", name: "Dewi Anggraini", points: 42, created_at: now() },
      { id: 2, phone: "081298765432", name: "Rian Pratama", points: 18, created_at: now() },
      { id: 3, phone: "082211223344", name: "Siti Nurhaliza", points: 95, created_at: now() },
      { id: 4, phone: "085677889900", name: "Budi Santoso", points: 130, created_at: now() },
      { id: 5, phone: "087712340099", name: "Ayu Lestari", points: 5, created_at: now() },
    ],
    transactions: [
      { id: 1, member_id: 1, type: "earn", amount: 45000, points_delta: 4, reward_name: null, note: "Seed", created_at: now() },
      { id: 2, member_id: 1, type: "earn", amount: 38000, points_delta: 3, reward_name: null, note: "Seed", created_at: now() },
      { id: 3, member_id: 2, type: "earn", amount: 28000, points_delta: 2, reward_name: null, note: "Seed", created_at: now() },
      { id: 4, member_id: 3, type: "earn", amount: 50000, points_delta: 5, reward_name: null, note: "Seed", created_at: now() },
      { id: 5, member_id: 4, type: "earn", amount: 75000, points_delta: 7, reward_name: null, note: "Seed", created_at: now() },
      { id: 6, member_id: 5, type: "earn", amount: 50000, points_delta: 5, reward_name: null, note: "Seed", created_at: now() },
    ],
    _seq: { members: 5, rewards: 5, transactions: 6 },
  };
}

// ---- Local JSON ----
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

function localLoad(): DB {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) { const d = defaultDB(); fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2)); return d; }
  return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
}
function localSave(db: DB) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }

// ---- Upstash Redis ----
async function redisGet(): Promise<DB> {
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({ url: process.env.KV_REST_API_URL!, token: process.env.KV_REST_API_TOKEN! });
  const data = await redis.get<DB>(REDIS_KEY);
if (!data) {
  const d = defaultDB();
  await redis.set(REDIS_KEY, d);
  return d;
}
// Pastikan semua array tetap array
const db = data as DB;
if (!Array.isArray(db.members)) db.members = [];
if (!Array.isArray(db.rewards)) db.rewards = [];
if (!Array.isArray(db.transactions)) db.transactions = [];
if (!Array.isArray(db.settings)) db.settings = [];
return db;
}
async function redisSet(db: DB) {
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({ url: process.env.KV_REST_API_URL!, token: process.env.KV_REST_API_TOKEN! });
  await redis.set(REDIS_KEY, db);
}

async function load(): Promise<DB> { return IS_VERCEL ? redisGet() : localLoad(); }
async function save(db: DB) { IS_VERCEL ? await redisSet(db) : localSave(db); }

// ---- Public API ----
export async function getSetting(key: string, fallback = ""): Promise<string> {
  const db = await load();
  return db.settings.find(s => s.key === key)?.value ?? fallback;
}

export async function getMemberByPhone(phone: string): Promise<Member | undefined> {
  return (await load()).members.find(m => m.phone === phone);
}

export async function createMember(phone: string, name: string): Promise<Member> {
  const db = await load();
  db._seq.members += 1;
  const member: Member = { id: db._seq.members, phone, name, points: 0, created_at: now() };
  db.members.push(member);
  await save(db);
  return member;
}

export async function updateMemberPoints(id: number, delta: number): Promise<Member> {
  const db = await load();
  const m = db.members.find(m => m.id === id)!;
  m.points += delta;
  await save(db);
  return m;
}

export async function searchMembers(q: string): Promise<Member[]> {
  const db = await load();
  if (!q) return [...db.members].sort((a, b) => b.id - a.id).slice(0, 25);
  const lower = q.toLowerCase();
  return db.members.filter(m => m.phone.includes(q) || m.name.toLowerCase().includes(lower)).slice(0, 25);
}

export async function getMemberTransactions(memberId: number): Promise<Transaction[]> {
  return (await load()).transactions.filter(t => t.member_id === memberId).sort((a, b) => b.id - a.id).slice(0, 20);
}

export async function createTransaction(memberId: number, type: "earn" | "redeem", amount: number, pointsDelta: number, rewardName: string | null, note: string | null): Promise<Transaction> {
  const db = await load();
  db._seq.transactions += 1;
  const tx: Transaction = { id: db._seq.transactions, member_id: memberId, type, amount, points_delta: pointsDelta, reward_name: rewardName, note, created_at: now() };
  db.transactions.push(tx);
  await save(db);
  return tx;
}

export async function findRedemptionByCode(code: string) {
  const db = await load();
  const tx = db.transactions.find(t => t.type === "redeem" && t.note && t.note.includes(code));
  if (!tx) return undefined;
  const member = db.members.find(m => m.id === tx.member_id);
  return { ...tx, member_name: member?.name ?? "-", phone: member?.phone ?? "-" };
}

export async function getRewards(includeInactive = false): Promise<Reward[]> {
  const db = await load();
  return db.rewards.filter(r => includeInactive || r.active === 1).sort((a, b) => a.points_required - b.points_required);
}

export async function getRewardById(id: number): Promise<Reward | undefined> {
  return (await load()).rewards.find(r => r.id === id);
}

export async function createReward(name: string, description: string, pointsRequired: number): Promise<Reward> {
  const db = await load();
  db._seq.rewards += 1;
  const reward: Reward = { id: db._seq.rewards, name, description, points_required: pointsRequired, active: 1 };
  db.rewards.push(reward);
  await save(db);
  return reward;
}

export async function updateReward(id: number, fields: Partial<Omit<Reward, "id">>): Promise<Reward> {
  const db = await load();
  const idx = db.rewards.findIndex(r => r.id === id);
  if (idx < 0) throw new Error("Reward tidak ditemukan");
  db.rewards[idx] = { ...db.rewards[idx], ...fields };
  await save(db);
  return db.rewards[idx];
}
