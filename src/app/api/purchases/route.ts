/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "~/server/auth";
import { generateTicketNumber } from "~/server/lib/ticket-number";
import { buildWhatsappPaymentLink } from "~/server/lib/whatsapp";
import { db } from "~/server/db";

const UNIT_PRICE_KURUS = 12500;

const createPurchaseSchema = z.object({
  quantity: z.number().int().min(1).max(10),
  phone: z.string().min(8),
  email: z.string().email().optional(),
  eventSlug: z.string().min(1).optional(),
});

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const purchases = await db.purchase.findMany({
    where: { userId: session.user.id },
    include: { tickets: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ purchases });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });
  }

  const json = (await request.json().catch(() => null)) as unknown;
  const parsed = createPurchaseSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Gecersiz satin alma verisi." },
      { status: 400 },
    );
  }

  const quantity = parsed.data.quantity;

  const event = parsed.data.eventSlug
    ? await db.event.findUnique({
        where: { slug: parsed.data.eventSlug },
        select: { priceKurus: true },
      })
    : await db.event.findFirst({
        orderBy: [{ isFeatured: "desc" }, { startAt: "asc" }],
        select: { priceKurus: true },
      });

  const unitPriceKurus = event?.priceKurus ?? UNIT_PRICE_KURUS;
  const totalKurus = unitPriceKurus * quantity;
  const ticketData = Array.from({ length: quantity }).map(() => ({
    userId: session.user.id,
    ticketNumber: generateTicketNumber(),
  }));

  const purchase = await db.$transaction(async (tx) => {
    const created = await tx.purchase.create({
      data: {
        userId: session.user.id,
        quantity,
        unitPriceKurus,
        totalKurus,
        buyerPhone: parsed.data.phone,
        buyerEmail: parsed.data.email ?? session.user.email ?? "iletisim@bakircayvibe.com",
        whatsappLink: "",
        status: "PENDING_APPROVAL",
      },
    });

    const whatsappLink = buildWhatsappPaymentLink({
      purchaseId: created.id,
      quantity,
      totalKurus,
      ticketNumbers: ticketData.map((ticket) => ticket.ticketNumber),
    });

    const ticketRows = ticketData.map((ticket) => ({
      ...ticket,
      purchaseId: created.id,
    }));

    await tx.ticket.createMany({ data: ticketRows });

    const updated = await tx.purchase.update({
      where: { id: created.id },
      data: { whatsappLink },
      include: { tickets: true },
    });

    return updated;
  });

  return NextResponse.json({ purchase });
}
