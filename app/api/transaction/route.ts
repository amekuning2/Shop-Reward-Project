import { NextRequest, NextResponse } from "next/server";
import {
  getMemberByPhone,
  updateMember,
  addTransaction,
  getSettings,
} from "@/lib/db";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const phone = String(body.phone || "").trim();
  const amount = Number(body.amount);

  if (!phone) {
    return NextResponse.json(
      { error: "Nomor HP member wajib diisi" },
      { status: 400 }
    );
  }

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: "Nominal transaksi tidak valid" },
      { status: 400 }
    );
  }

  const member = await getMemberByPhone(phone);

  console.log("MEMBER FOUND =", member);
  console.log("MEMBER ID =", member?.id);
  console.log("TYPEOF ID =", typeof member?.id);
  console.log("MEMBER POINTS =", member?.points);
  console.log("MEMBER STAMP =", member?.stampCount);

  if (!member) {
    return NextResponse.json(
      {
        error:
          "Member tidak ditemukan. Daftarkan member baru terlebih dahulu.",
      },
      { status: 404 }
    );
  }

  const settings = await getSettings();

  console.log("SETTINGS =", settings);

  const pointsEarned = Math.floor(
    amount / settings.pointsPerRupiah
  );

  console.log("POINTS EARNED =", pointsEarned);

  const newStamp =
    ((member.stampCount || 0) + pointsEarned) %
    settings.stampPerCycle;

  console.log("NEW STAMP =", newStamp);

  const updated = await updateMember(member.id, {
    points: (member.points || 0) + pointsEarned,
    stampCount: newStamp,
  });

  console.log("UPDATED MEMBER =", updated);

  await addTransaction({
    memberId: member.id,
    memberPhone: member.phone,
    memberName: member.name,
    type: "earn",
    amount,
    points: pointsEarned,
    staffNote: "Transaksi POS",
  });

  return NextResponse.json({
    member: updated,
    pointsEarned,
  });
}