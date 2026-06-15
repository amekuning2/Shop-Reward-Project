// lib/db.ts
import { Redis } from "@upstash/redis";

const REDIS_KEY = "otoko:db";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Member {
  id: string;
  phone: string;
  name: string;
  points: number;
  stampCount: number;
  createdAt: string;
}

export interface Reward {
  id: string;
  name: string;
  pointsCost: number;
  description: string;
  active: boolean;
}

export interface Transaction {
  id: string;
  memberId: string;
  memberPhone: string;
  memberName: string;
  type: "earn" | "redeem";
  amount: number;      // Rp amount (for earn), 0 for redeem
  points: number;      // points earned or spent
  rewardId?: string;
  rewardName?: string;
  redeemCode?: string;
  staffNote?: string;
  createdAt: string;
}

export interface RedeemCode {
  code: string;
  memberId: string;
  rewardId: string;
  rewardName: string;
  pointsCost: number;
  used: boolean;
  createdAt: string;
  usedAt?: string;
}

export interface Settings {
  pointsPerRupiah: number;   // e.g. 10000 → 1 point per Rp10.000
  stampPerCycle: number;     // stamps needed for one cycle (default 10)
  pointsPerStamp: number;    // points per stamp (default 1)
}

export interface DB {
  settings: Settings;
  members: Member[];
  rewards: Reward[];
  transactions: Transaction[];
  redeemCodes: RedeemCode[];
  _seq: number;
}

// ─── Default data ─────────────────────────────────────────────────────────────

const DEFAULT_DB: DB = {
  settings: {
    pointsPerRupiah: 10000,
    stampPerCycle: 10,
    pointsPerStamp: 1,
  },
  members: [],
  rewards: [
    { id: "r1", name: "Upsize Gratis", pointsCost: 15, description: "Upgrade ukuran minuman kamu gratis!", active: true },
    { id: "r2", name: "Free Americano", pointsCost: 30, description: "Segelas Americano dingin atau panas.", active: true },
    { id: "r3", name: "Free Pastry", pointsCost: 50, description: "Pilih pastry favorit kamu.", active: true },
    { id: "r4", name: "Diskon 20%", pointsCost: 80, description: "Diskon 20% untuk total pembelian.", active: true },
    { id: "r5", name: "Free Signature Drink", pointsCost: 120, description: "Minuman signature Otoko Coffee pilihanmu.", active: true },
  ],
  transactions: [],
  redeemCodes: [],
  _seq: 0,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ensureArrays(db: any): DB {
  return {
    settings: db.settings ?? DEFAULT_DB.settings,
    members: Array.isArray(db.members) ? db.members : [],
    rewards: Array.isArray(db.rewards) ? db.rewards : DEFAULT_DB.rewards,
    transactions: Array.isArray(db.transactions) ? db.transactions : [],
    redeemCodes: Array.isArray(db.redeemCodes) ? db.redeemCodes : [],
    _seq: typeof db._seq === "number" ? db._seq : 0,
  };
}

function nextId(db: DB, prefix: string): string {
  db._seq = (db._seq || 0) + 1;
  return `${prefix}${db._seq}`;
}

// ─── Storage layer ────────────────────────────────────────────────────────────

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (redis) return redis;
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    return redis;
  }
  return null;
}

// JSON file fallback for local dev
async function localRead(): Promise<DB> {
  try {
    const fs = await import("fs/promises");
    const path = await import("path");
    const filePath = path.join(process.cwd(), "data", "db.json");
    const raw = await fs.readFile(filePath, "utf-8");
    return ensureArrays(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_DB };
  }
}

async function localWrite(db: DB): Promise<void> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const dir = path.join(process.cwd(), "data");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "db.json"), JSON.stringify(db, null, 2));
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function readDB(): Promise<DB> {
  const r = getRedis();
  if (r) {
    try {
      const raw = await r.get(REDIS_KEY);
      if (!raw) return { ...DEFAULT_DB };

      // Redis might return string or already-parsed object
      let parsed: any;
      if (typeof raw === "string") {
        parsed = JSON.parse(raw);
      } else {
        parsed = raw;
      }
      return ensureArrays(parsed);
    } catch (e) {
      console.error("[db] Redis read error:", e);
      return { ...DEFAULT_DB };
    }
  }
  return localRead();
}

export async function writeDB(db: DB): Promise<void> {
  const r = getRedis();
  if (r) {
    try {
      await r.set(REDIS_KEY, JSON.stringify(db));
    } catch (e) {
      console.error("[db] Redis write error:", e);
    }
    return;
  }
  await localWrite(db);
}

// ─── Member operations ────────────────────────────────────────────────────────

export async function getMemberByPhone(phone: string): Promise<Member | null> {
  const db = await readDB();
  return db.members.find((m) => m.phone === phone) ?? null;
}

export async function createMember(phone: string, name: string): Promise<Member> {
  const db = await readDB();
  const id = nextId(db, "m");
  const member: Member = {
    id,
    phone,
    name,
    points: 0,
    stampCount: 0,
    createdAt: new Date().toISOString(),
  };
  db.members.push(member);
  await writeDB(db);
  return member;
}

export async function updateMember(id: string, updates: Partial<Member>): Promise<Member | null> {
  const db = await readDB();
  const idx = db.members.findIndex((m) => m.id === id);
  if (idx === -1) return null;
  db.members[idx] = { ...db.members[idx], ...updates };
  await writeDB(db);
  return db.members[idx];
}

// ─── Transaction operations ───────────────────────────────────────────────────

export async function addTransaction(tx: Omit<Transaction, "id" | "createdAt">): Promise<Transaction> {
  const db = await readDB();
  const transaction: Transaction = {
    ...tx,
    id: nextId(db, "tx"),
    createdAt: new Date().toISOString(),
  };
  db.transactions.push(transaction);
  await writeDB(db);
  return transaction;
}

export async function getMemberTransactions(memberId: string): Promise<Transaction[]> {
  const db = await readDB();
  return db.transactions
    .filter((t) => t.memberId === memberId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

// ─── Reward operations ────────────────────────────────────────────────────────

export async function getActiveRewards(): Promise<Reward[]> {
  const db = await readDB();
  return db.rewards.filter((r) => r.active);
}

export async function getRewardById(id: string): Promise<Reward | null> {
  const db = await readDB();
  return db.rewards.find((r) => r.id === id) ?? null;
}

// ─── Redeem code operations ───────────────────────────────────────────────────

export async function createRedeemCode(
  memberId: string,
  rewardId: string,
  rewardName: string,
  pointsCost: number
): Promise<RedeemCode> {
  const db = await readDB();
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const redeemCode: RedeemCode = {
    code,
    memberId,
    rewardId,
    rewardName,
    pointsCost,
    used: false,
    createdAt: new Date().toISOString(),
  };
  db.redeemCodes.push(redeemCode);
  await writeDB(db);
  return redeemCode;
}

export async function getRedeemCode(code: string): Promise<RedeemCode | null> {
  const db = await readDB();
  return db.redeemCodes.find((rc) => rc.code === code) ?? null;
}

export async function markRedeemCodeUsed(code: string): Promise<void> {
  const db = await readDB();
  const idx = db.redeemCodes.findIndex((rc) => rc.code === code);
  if (idx !== -1) {
    db.redeemCodes[idx].used = true;
    db.redeemCodes[idx].usedAt = new Date().toISOString();
    await writeDB(db);
  }
}

export async function getAllMembers(): Promise<Member[]> {
  const db = await readDB();
  return db.members;
}

export async function getSettings(): Promise<Settings> {
  const db = await readDB();
  return db.settings;
}