/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { NextResponse } from "next/server";

import { auth } from "~/server/auth";
import { db } from "~/server/db";

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ purchaseId: string }> },
) {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { purchaseId } = await params;

  const result = await db.$transaction(async (tx) => {
    const purchase = await tx.purchase.findUnique({
      where: { id: purchaseId },
      include: { tickets: true },
    });

    if (!purchase) {
      return null;
    }

    if (purchase.status === "APPROVED") {
      return purchase;
    }

    await tx.purchase.update({
      where: { id: purchaseId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    await tx.ticket.updateMany({
      where: { purchaseId },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
      },
    });

    return tx.purchase.findUnique({
      where: { id: purchaseId },
      include: { tickets: true },
    });
  });

  if (!result) {
    return NextResponse.json({ error: "Satin alma bulunamadi." }, { status: 404 });
  }

  return NextResponse.json({ purchase: result });
}
