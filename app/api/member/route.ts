import { NextRequest, NextResponse } from "next/server";
import { getMemberByPhone, getRewardById, updateMemberPoints, createTransaction } from "@/lib/db";

function generateCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const phone = String(body.phone || "").trim();
  const rewardId = Number(body.rewardId);
  if (!phone || !rewardId) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  const [member, reward] = await Promise.all([getMemberByPhone(phone), getRewardById(rewardId)]);
  if (!member) return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
  if (!reward || !reward.active) return NextResponse.json({ error: "Reward tidak tersedia" }, { status: 404 });
  if (member.points < reward.points_required) return NextResponse.json({ error: "Poin tidak cukup untuk reward ini" }, { status: 400 });
  const code = generateCode();
  const updated = await updateMemberPoints(member.id, -reward.points_required);
  await createTransaction(member.id, "redeem", 0, -reward.points_required, reward.name, `Kode verifikasi: ${code}`);
  return NextResponse.json({ member: updated, reward: reward.name, code });
}