import { NextRequest, NextResponse } from "next/server";
import { getMemberByPhone, updateMemberPoints, createTransaction, getSetting } from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const phone = String(body.phone || "").trim();
  const amount = Number(body.amount);

  if (!phone) return NextResponse.json({ error: "Nomor HP member wajib diisi" }, { status: 400 });
  if (!amount || amount <= 0) return NextResponse.json({ error: "Nominal transaksi tidak valid" }, { status: 400 });

  const member = getMemberByPhone(phone);
  if (!member) return NextResponse.json({ error: "Member tidak ditemukan. Daftarkan member baru terlebih dahulu." }, { status: 404 });

  const pointsPerIdr = Number(getSetting("points_per_idr", "10000"));
  const pointsEarned = Math.floor(amount / pointsPerIdr);

  const updated = updateMemberPoints(member.id, pointsEarned);
  createTransaction(member.id, "earn", amount, pointsEarned, null, "Transaksi POS");

  return NextResponse.json({ member: updated, pointsEarned });
}
