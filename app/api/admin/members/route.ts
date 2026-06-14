import { NextRequest, NextResponse } from "next/server";
import { searchMembers, getMemberByPhone, createMember } from "@/lib/db";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  return NextResponse.json({ members: searchMembers(q) });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const phone = String(body.phone || "").trim();
  const name = String(body.name || "").trim();

  if (!phone || !name) return NextResponse.json({ error: "Nama dan nomor HP wajib diisi" }, { status: 400 });
  if (!/^[0-9]{8,15}$/.test(phone)) return NextResponse.json({ error: "Format nomor HP tidak valid (8-15 digit)" }, { status: 400 });

  const existing = getMemberByPhone(phone);
  if (existing) return NextResponse.json({ error: "Nomor HP sudah terdaftar" }, { status: 409 });

  const member = createMember(phone, name);
  return NextResponse.json({ member });
}
