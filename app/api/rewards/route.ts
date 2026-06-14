import { NextRequest, NextResponse } from "next/server";
import { getRewards, createReward, updateReward, getRewardById } from "@/lib/db";

export async function GET(req: NextRequest) {
  const all = req.nextUrl.searchParams.get("all") === "1";
  return NextResponse.json({ rewards: getRewards(all) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = String(body.name || "").trim();
  const description = String(body.description || "").trim();
  const pointsRequired = Number(body.points_required);

  if (!name || !pointsRequired || pointsRequired <= 0) return NextResponse.json({ error: "Nama dan poin reward wajib diisi" }, { status: 400 });

  const reward = createReward(name, description, pointsRequired);
  return NextResponse.json({ reward });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "ID reward wajib diisi" }, { status: 400 });

  const existing = getRewardById(id);
  if (!existing) return NextResponse.json({ error: "Reward tidak ditemukan" }, { status: 404 });

  const reward = updateReward(id, {
    name: body.name ?? existing.name,
    description: body.description ?? existing.description,
    points_required: body.points_required ?? existing.points_required,
    active: body.active !== undefined ? (body.active ? 1 : 0) : existing.active,
  });
  return NextResponse.json({ reward });
}
