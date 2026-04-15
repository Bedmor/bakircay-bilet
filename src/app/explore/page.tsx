import Link from "next/link";

import { ExploreEvents } from "~/components/explore-events";
import { MainNavLinks } from "~/components/main-nav-links";
import { UserMenu } from "~/components/user-menu";
import { auth } from "~/server/auth";
import { getEvents } from "~/server/lib/events";

export default async function ExplorePage() {
  const session = await auth();
  const events = await getEvents();

  const serialized = events.map((event) => ({
    id: event.id,
    slug: event.slug,
    title: event.title,
    description: event.description,
    venue: event.venue,
    city: event.city,
    category: event.category,
    imageUrl: event.imageUrl,
    startAt: event.startAt.toISOString(),
    priceKurus: event.priceKurus,
  }));

  return (
    <main className="min-h-screen bg-[#0c0e17] text-[#f0f0fd]">
      <nav className="fixed top-0 z-50 w-full bg-slate-950/70 shadow-[0_0_20px_rgba(131,174,255,0.1)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 font-['Space_Grotesk',sans-serif] tracking-tight">
          <Link
            href="/"
            className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent"
          >
            BAKIRCAY X KATIP CELEBI
          </Link>

          <MainNavLinks className="hidden items-center gap-8 md:flex" />

          {session?.user ? (
            <UserMenu name={session.user.name} image={session.user.image} />
          ) : (
            <Link
              href="/giris"
              className="text-slate-400 transition-colors hover:text-blue-300"
            >
              Giris
            </Link>
          )}
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 pt-28 pb-20 md:px-8">
        <header className="mb-6">
          <p className="text-xs font-bold tracking-widest text-[#83aeff] uppercase">
            Kesfet
          </p>
          <h1 className="mt-2 font-['Space_Grotesk',sans-serif] text-5xl font-bold tracking-tight">
            Tum Etkinlikler
          </h1>
          <p className="mt-2 text-sm text-[#aaaab7]">
            Bakircay ve Katip Celebi ogrencileri icin 2000&apos;ler temali
            geceleri filtreleyip hizlica bul.
          </p>
        </header>

        <ExploreEvents events={serialized} />
      </section>
    </main>
  );
}
