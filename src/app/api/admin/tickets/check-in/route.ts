/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json(
      { ok: false, message: "Yetkisiz istek." },
      { status: 401 },
    );
  }

  let body: { ticketNumber?: string };
  try {
    body = (await request.json()) as { ticketNumber?: string };
  } catch {
    return NextResponse.json(
      { ok: false, message: "Gecersiz istek govdesi." },
      { status: 400 },
    );
  }

  const ticketNumber = body.ticketNumber?.trim();

  if (!ticketNumber) {
    return NextResponse.json(
      { ok: false, message: "Bilet numarasi gerekli." },
      { status: 400 },
    );
  }

  const ticket = await db.ticket.findUnique({
    where: { ticketNumber },
    include: {
      user: {
        select: {
          name: true,
          phone: true,
        },
      },
      purchase: {
        select: {
          buyerPhone: true,
        },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json(
      { ok: false, message: "Bu bilet bulunamadi." },
      { status: 404 },
    );
  }

  if (ticket.status !== "APPROVED") {
    return NextResponse.json(
      { ok: false, message: "Bu bilet henuz onayli degil." },
      { status: 400 },
    );
  }

  if (ticket.checkedInAt) {
    return NextResponse.json({
      ok: true,
      status: "already-checked-in",
      message: "Bu bilet daha once giris yapmis.",
      ticketNumber: ticket.ticketNumber,
      checkedInAt: ticket.checkedInAt.toISOString(),
      attendeeName: ticket.user.name,
      attendeePhone: ticket.user.phone,
      buyerPhone: ticket.purchase.buyerPhone,
    });
  }

  const checkedInAt = new Date();

  const updatedTicket = await db.ticket.update({
    where: { id: ticket.id },
    data: {
      checkedInAt,
      checkedInBy: session.user.id,
    },
  });

  return NextResponse.json({
    ok: true,
    status: "checked-in",
    message: "Giris dogrulandi. Kullanici etkinlige alindi.",
    ticketNumber: updatedTicket.ticketNumber,
    checkedInAt: checkedInAt.toISOString(),
    attendeeName: ticket.user.name,
    attendeePhone: ticket.user.phone,
    buyerPhone: ticket.purchase.buyerPhone,
  });
}
