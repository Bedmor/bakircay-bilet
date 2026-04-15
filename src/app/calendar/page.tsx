import Link from "next/link";

import { MainNavLinks } from "~/components/main-nav-links";
import { UserMenu } from "~/components/user-menu";
import { auth } from "~/server/auth";
import { getEvents } from "~/server/lib/events";

function formatDay(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    weekday: "long",
  }).format(date);
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function CalendarPage() {
  const session = await auth();
  const events = await getEvents();

  const grouped = events.reduce<Record<string, typeof events>>((acc, event) => {
    const key = new Intl.DateTimeFormat("tr-TR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(event.startAt);

    acc[key] ??= [];
    acc[key].push(event);
    return acc;
  }, {});

  const days = Object.entries(grouped).sort((a, b) => {
    const aDate = a[1][0]?.startAt.getTime() ?? 0;
    const bDate = b[1][0]?.startAt.getTime() ?? 0;
    return aDate - bDate;
  });

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
        <header className="mb-8">
          <p className="text-xs font-bold tracking-widest text-[#83aeff] uppercase">
            Takvim
          </p>
          <h1 className="mt-2 font-['Space_Grotesk',sans-serif] text-5xl font-bold tracking-tight">
            Etkinlik Takvimi
          </h1>
          <p className="mt-2 text-sm text-[#aaaab7]">
            2000&apos;ler temasindaki tum geceleri tarih sirasinda takip et.
          </p>
        </header>

        <div className="space-y-6">
          {days.length === 0 ? (
            <article className="rounded-2xl border border-[#464752]/15 bg-[#11131d] p-8 text-sm text-[#aaaab7]">
              Takvimde gosterilecek etkinlik bulunamadi.
            </article>
          ) : (
            days.map(([dayKey, dayEvents]) => (
              <article
                key={dayKey}
                className="rounded-2xl border border-[#464752]/15 bg-[#11131d] p-5"
              >
                <h2 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#83aeff]">
                  {formatDay(dayEvents[0]?.startAt ?? new Date())}
                </h2>

                <div className="mt-4 space-y-3">
                  {dayEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/biletler?event=${event.slug}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#464752]/20 bg-[#0c0e17] px-4 py-3 transition-colors hover:border-[#83aeff]/30"
                    >
                      <div>
                        <p className="font-semibold text-[#f0f0fd]">
                          {event.title}
                        </p>
                        <p className="text-xs text-[#aaaab7]">
                          {event.venue}, {event.city}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#00fdc6]">
                          {formatTime(event.startAt)}
                        </p>
                        <p className="text-xs text-[#aaaab7]">
                          {event.category}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
