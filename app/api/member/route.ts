import { NextRequest, NextResponse } from "next/server";
import {
  getAllMembers,
  getMemberByPhone,
  createMember,
  getMemberTransactions,
} from "@/lib/db";

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get("phone")?.trim();

  // LOGIN MEMBER
  if (phone) {
    const member = await getMemberByPhone(phone);

    if (!member) {
      return NextResponse.json(
        { error: "Member tidak ditemukan" },
        { status: 404 }
      );
    }

    const history = await getMemberTransactions(member.id);

    return NextResponse.json({
      member,
      history,
      shopName: "Otoko Coffee",
    });
  }

  // ADMIN SEARCH MEMBER
  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase() || "";

  const members = await getAllMembers();

  const filtered = q
    ? members.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.phone.includes(q)
      )
    : members;

  return NextResponse.json({
    members: filtered,
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const phone = String(body.phone || "").trim();
  const name = String(body.name || "").trim();

  if (!phone || !name) {
    return NextResponse.json(
      { error: "Nama dan nomor HP wajib diisi" },
      { status: 400 }
    );
  }

  if (!/^[0-9]{8,15}$/.test(phone)) {
    return NextResponse.json(
      { error: "Format nomor HP tidak valid (8-15 digit)" },
      { status: 400 }
    );
  }

  const existing = await getMemberByPhone(phone);

  if (existing) {
    return NextResponse.json(
      { error: "Nomor HP sudah terdaftar" },
      { status: 409 }
    );
  }

  const member = await createMember(phone, name);

  return NextResponse.json({
    member,
  });
}