import { NextRequest, NextResponse } from "next/server";
import { getMemberByPhone, getRewardById, updateMember, addTransaction, createRedeemCode } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const phone = String(body.phone || "").trim();
  const rewardId = String(body.rewardId || "").trim();

  if (!phone || !rewardId) return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });

  const member = await getMemberByPhone(phone);
  if (!member) return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });

  const reward = await getRewardById(rewardId);
  if (!reward || !reward.active) return NextResponse.json({ error: "Reward tidak tersedia" }, { status: 404 });

  if (member.points < reward.pointsCost)
    return NextResponse.json({ error: "Poin tidak cukup untuk reward ini" }, { status: 400 });

  const updated = await updateMember(member.id, {
    points: member.points - reward.pointsCost,
  });

  const redeemCode = await createRedeemCode(member.id, reward.id, reward.name, reward.pointsCost);

  await addTransaction({
    memberId: member.id,
    memberPhone: member.phone,
    memberName: member.name,
    type: "redeem",
    amount: 0,
    points: -reward.pointsCost,
    rewardId: reward.id,
    rewardName: reward.name,
    redeemCode: redeemCode.code,
  });

  return NextResponse.json({ member: updated, reward: reward.name, code: redeemCode.code });
}