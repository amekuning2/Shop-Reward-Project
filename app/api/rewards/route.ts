import { NextRequest, NextResponse } from "next/server";
import { getActiveRewards, getRewardById, readDB, writeDB } from "@/lib/db";

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all") === "1";
  if (all) {
    const db = await readDB();
    return NextResponse.json({ rewards: db.rewards });
  }
  const rewards = await getActiveRewards();
  return NextResponse.json({ rewards });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();
  const pointsCost = Number(body.points_required || body.pointsCost);

  if (!name || !pointsCost || pointsCost <= 0)
    return NextResponse.json({ error: "Nama dan poin reward wajib diisi" }, { status: 400 });

  const db = await readDB();
  db._seq = (db._seq || 0) + 1;
  const reward = {
    id: `r${db._seq}`,
    name,
    description,
    pointsCost,
    active: true,
  };
  db.rewards.push(reward);
  await writeDB(db);
  return NextResponse.json({ reward });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const id = String(body.id || "").trim();
  if (!id) return NextResponse.json({ error: "ID reward wajib diisi" }, { status: 400 });

  const db = await readDB();
  const idx = db.rewards.findIndex((r) => r.id === id);
  if (idx === -1) return NextResponse.json({ error: "Reward tidak ditemukan" }, { status: 404 });

  db.rewards[idx] = {
    ...db.rewards[idx],
    name: body.name ?? db.rewards[idx].name,
    description: body.description ?? db.rewards[idx].description,
    pointsCost: body.points_required ?? body.pointsCost ?? db.rewards[idx].pointsCost,
    active: body.active !== undefined ? Boolean(body.active) : db.rewards[idx].active,
  };
  await writeDB(db);
  return NextResponse.json({ reward: db.rewards[idx] });
}