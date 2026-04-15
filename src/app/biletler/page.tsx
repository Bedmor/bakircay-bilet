import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AppIcon } from "~/components/app-icon";
import { PurchaseForm } from "~/components/purchase-form";
import { UserMenu } from "~/components/user-menu";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import { getEvents } from "~/server/lib/events";

function formatPrice(kurus: number) {
  return `TL ${(kurus / 100).toLocaleString("tr-TR")}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function BiletlerPage(props: {
  searchParams?: Promise<{ event?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/giris");
  }

  const params = props.searchParams ? await props.searchParams : undefined;
  const events = await getEvents();
  const currentUser: { phone: string | null } | null = await db.user.findUnique(
    {
      where: { id: session.user.id },
      select: { phone: true },
    },
  );
  const selectedEvent =
    events.find((event) => event.slug === params?.event) ?? events[0];

  if (!selectedEvent) {
    redirect("/");
  }

  const quantityExample = 2;
  const subtotalKurus = selectedEvent.priceKurus * quantityExample;

  return (
    <main className="min-h-screen bg-[#0c0e17] text-[#f0f0fd]">
      <nav className="fixed top-0 z-50 w-full bg-slate-950/70 shadow-[0_0_20px_rgba(131,174,255,0.1)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <span className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text font-['Space_Grotesk',sans-serif] text-2xl font-bold tracking-tight text-transparent">
            BAKIRCAY VIBE
          </span>
          <div className="hidden items-center gap-8 font-['Space_Grotesk',sans-serif] tracking-tight md:flex">
            <Link
              className="font-medium text-slate-400 transition-colors hover:text-blue-300"
              href="/"
            >
              Events
            </Link>
            <Link
              href="/satin-alimlarim"
              className="border-b-2 border-blue-400 pb-1 text-blue-400 transition-colors hover:text-blue-300"
            >
              My Tickets
            </Link>
            <Link
              className="font-medium text-slate-400 transition-colors hover:text-blue-300"
              href="/"
            >
              Community
            </Link>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              aria-label="Notifications"
              className="scale-95 p-2 transition-colors hover:text-blue-300 active:duration-100"
            >
              <AppIcon name="notifications" className="h-5 w-5" />
            </button>
            <UserMenu name={session.user.name} image={session.user.image} />
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 pt-28 pb-20 md:px-8">
        <Link
          href="/"
          className="mb-8 flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif] font-medium text-[#aaaab7]"
        >
          <AppIcon name="arrow_back" className="h-4 w-4" />
          <span className="text-[10px] font-bold tracking-widest uppercase">
            Return to Event Gallery
          </span>
        </Link>

        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <header className="space-y-2">
              <h1 className="font-['Space_Grotesk',sans-serif] text-5xl leading-none font-bold tracking-tight text-[#f0f0fd] md:text-6xl">
                WHATSAPP
                <br />
                <span className="text-[#83aeff] italic">IBAN ODEME</span>
              </h1>
              <p className="max-w-md font-['Plus_Jakarta_Sans',sans-serif] text-[#aaaab7]">
                {selectedEvent.title} icin odeme sureci yalnizca WhatsApp
                uzerinden IBAN transferi ile tamamlanir.
              </p>
            </header>

            <section className="rounded-xl border border-[#464752]/15 bg-[#11131d] p-6">
              <h2 className="font-['Space_Grotesk',sans-serif] text-xl font-semibold tracking-wide">
                ODEME ADIMLARI
              </h2>
              <ol className="mt-4 space-y-3 font-['Plus_Jakarta_Sans',sans-serif] text-sm text-[#d3d8e8]">
                <li className="rounded-lg bg-black/25 px-4 py-3">
                  1. Asagidan bilet adedi ve telefon numarani gir.
                </li>
                <li className="rounded-lg bg-black/25 px-4 py-3">
                  2. WhatsApp uzerinden sana IBAN ve aciklama kodu gonderilir.
                </li>
                <li className="rounded-lg bg-black/25 px-4 py-3">
                  3. Havale/EFT sonrasinda odemen manuel onaylanir ve biletlerin
                  aktif olur.
                </li>
              </ol>
            </section>

            <section className="rounded-xl border border-[#464752]/15 bg-[#11131d] p-6">
              <div className="mb-4 flex items-center gap-2">
                <AppIcon
                  name="account_balance_wallet"
                  className="h-5 w-5 text-[#00fdc6]"
                />
                <h2 className="font-['Space_Grotesk',sans-serif] text-xl font-semibold">
                  Sadece WhatsApp + IBAN
                </h2>
              </div>
              <p className="font-['Plus_Jakarta_Sans',sans-serif] text-sm text-[#aaaab7]">
                Kredi karti, sanal pos veya cuzdan odemesi yoktur. Tum odemeler
                WhatsApp yonlendirmesi ile IBAN transferidir.
              </p>
            </section>
          </div>

          <aside className="sticky top-28 lg:col-span-5">
            <div className="glass-card overflow-hidden rounded-2xl shadow-2xl">
              <div className="relative h-48">
                <Image
                  alt={selectedEvent.title}
                  className="h-full w-full object-cover"
                  src={selectedEvent.imageUrl}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                />
                <div className="absolute inset-0 bg-linear-to-t from-[#1c1f2b] to-transparent" />
                <div className="absolute bottom-4 left-6">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#00fdc6]" />
                    <span className="text-[10px] font-bold tracking-widest text-[#00fdc6] uppercase">
                      Upcoming Vibe
                    </span>
                  </div>
                  <h3 className="font-['Space_Grotesk',sans-serif] text-2xl leading-tight font-bold uppercase">
                    {selectedEvent.title}
                  </h3>
                  <p className="mt-1 text-xs text-[#ced3e5]">
                    {formatDate(selectedEvent.startAt)} | {selectedEvent.venue},{" "}
                    {selectedEvent.city}
                  </p>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-[#f0f0fd]">
                        Bilet Birim Fiyati
                      </div>
                      <div className="text-xs text-[#aaaab7]">
                        {selectedEvent.category}
                      </div>
                    </div>
                    <div className="font-['Space_Grotesk',sans-serif] font-bold text-[#f0f0fd]">
                      {formatPrice(selectedEvent.priceKurus)}
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-[#f0f0fd]">
                        Ornek Toplam (2 Adet)
                      </div>
                      <div className="text-xs text-[#aaaab7]">
                        Gercek tutar sipariste hesaplanir
                      </div>
                    </div>
                    <div className="font-['Space_Grotesk',sans-serif] font-bold text-[#83aeff]">
                      {formatPrice(subtotalKurus)}
                    </div>
                  </div>
                </div>

                <PurchaseForm
                  defaultPhone={currentUser?.phone ?? session.user.phone}
                  eventSlug={selectedEvent.slug}
                />
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-[#464752]/10 bg-[#11131d] p-4 font-['Plus_Jakarta_Sans',sans-serif]">
              <div className="flex items-center gap-2 text-sm font-bold text-[#f0f0fd]">
                <AppIcon
                  name="confirmation_number"
                  className="h-5 w-5 text-[#ff51fa]"
                />
                Manuel onayli guvenli biletleme
              </div>
              <p className="mt-2 text-[12px] text-[#aaaab7]">
                Transfer kontrolunden sonra biletler onaylanir ve hesabina
                tanimlanir.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl bg-slate-950/80 px-4 pt-2 pb-6 shadow-[0_-4px_24px_rgba(0,0,0,0.5)] backdrop-blur-2xl md:hidden">
        <Link
          href="/"
          className="flex flex-col items-center justify-center px-6 py-2 text-slate-500 transition-transform duration-150 active:scale-90"
        >
          <AppIcon name="local_activity" className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-bold tracking-widest uppercase">
            Feed
          </span>
        </Link>
        <Link
          href="/"
          className="flex flex-col items-center justify-center px-6 py-2 text-slate-500 transition-transform duration-150 active:scale-90"
        >
          <AppIcon name="search" className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-bold tracking-widest uppercase">
            Search
          </span>
        </Link>
        <Link
          href="/satin-alimlarim"
          className="flex flex-col items-center justify-center rounded-2xl bg-blue-500/20 px-6 py-2 text-blue-400 transition-transform duration-150 active:scale-90"
        >
          <AppIcon name="confirmation_number" className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-bold tracking-widest uppercase">
            Tickets
          </span>
        </Link>
        <Link
          href="/giris"
          className="flex flex-col items-center justify-center px-6 py-2 text-slate-500 transition-transform duration-150 active:scale-90"
        >
          <AppIcon name="account_circle" className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-bold tracking-widest uppercase">
            Profile
          </span>
        </Link>
      </nav>
    </main>
  );
}
