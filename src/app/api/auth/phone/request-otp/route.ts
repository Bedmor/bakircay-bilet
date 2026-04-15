import { NextResponse } from "next/server";

export async function POST(request: Request) {
  void request;

  return NextResponse.json(
    {
      error:
        "Telefon ile giris gecici olarak kapatildi. Lutfen magic link kullanin.",
    },
    { status: 410 },
  );
}
