import { NextRequest, NextResponse } from "next/server";
import { getMemberByPhone, createMember, getMemberTransactions, getSetting } from "@/lib/db";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone")?.trim();
  if (!phone) return NextResponse.json({ error: "Nomor HP wajib diisi" }, { status: 400 });
  const member = await getMemberByPhone(phone);
  if (!member) return NextResponse.json({ error: "Member tidak ditemukan" }, { status: 404 });
  const [history, pointsPerIdr, shopName] = await Promise.all([
    getMemberTransactions(member.id),
    getSetting("points_per_idr", "10000"),
    getSetting("shop_name", "Otoko Coffee Shop"),
  ]);
  return NextResponse.json({ member, history, pointsPerIdr: Number(pointsPerIdr), shopName });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const phone = String(body.phone || "").trim();
  const name = String(body.name || "").trim();
  if (!phone || !name) return NextResponse.json({ error: "Nama dan nomor HP wajib diisi" }, { status: 400 });
  if (!/^[0-9]{8,15}$/.test(phone)) return NextResponse.json({ error: "Format nomor HP tidak valid" }, { status: 400 });
  const existing = await getMemberByPhone(phone);
  if (existing) return NextResponse.json({ error: "Nomor HP sudah terdaftar, silakan masuk." }, { status: 409 });
  const member = await createMember(phone, name);
  return NextResponse.json({ member });
}