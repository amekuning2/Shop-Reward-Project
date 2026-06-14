import { NextRequest, NextResponse } from "next/server";
import { findRedemptionByCode } from "@/lib/db";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code")?.trim().toUpperCase();
  if (!code) return NextResponse.json({ error: "Kode wajib diisi" }, { status: 400 });

  const redemption = findRedemptionByCode(code);
  if (!redemption) return NextResponse.json({ error: "Kode tidak ditemukan" }, { status: 404 });

  return NextResponse.json({ redemption });
}
