import { NextRequest, NextResponse } from "next/server";
import { getRedeemCode, markRedeemCodeUsed, getAllMembers } from "@/lib/db";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Kode wajib diisi" }, { status: 400 });

  const redemption = await getRedeemCode(code);
  if (!redemption) return NextResponse.json({ error: "Kode tidak ditemukan" }, { status: 404 });

  // Cari nama member
  const members = await getAllMembers();
  const member = members.find((m) => m.id === redemption.memberId);

  return NextResponse.json({
    redemption: {
      ...redemption,
      memberName: member?.name ?? "-",
      memberPhone: member?.phone ?? "-",
    },
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const code = String(body.code || "").trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Kode wajib diisi" }, { status: 400 });

  const redemption = await getRedeemCode(code);
  if (!redemption) return NextResponse.json({ error: "Kode tidak ditemukan" }, { status: 404 });
  if (redemption.used) return NextResponse.json({ error: "Kode sudah pernah digunakan" }, { status: 400 });

  await markRedeemCodeUsed(code);
  return NextResponse.json({ success: true, message: "Kode berhasil diverifikasi" });
}