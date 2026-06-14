import { NextRequest, NextResponse } from "next/server";
import { getMemberByPhone, getRewardById, updateMemberPoints, createTransaction } from "@/lib/db";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const phone = String(body.phone || "").trim();
  const rewardId = Number(body.rewardId);

  if (!phone || !rewardId) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });

  const member = getMemberByPhone(phone);
  if (!member) return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });

  const reward = getRewardById(rewardId);
  if (!reward || !reward.active) return NextResponse.json({ error: "Reward tidak tersedia" }, { status: 404 });

  if (member.points < reward.points_required) return NextResponse.json({ error: "Poin tidak cukup untuk reward ini" }, { status: 400 });

  const code = generateCode();
  const updated = updateMemberPoints(member.id, -reward.points_required);
  createTransaction(member.id, "redeem", 0, -reward.points_required, reward.name, `Kode verifikasi: ${code}`);

  return NextResponse.json({ member: updated, reward: reward.name, code });
}
