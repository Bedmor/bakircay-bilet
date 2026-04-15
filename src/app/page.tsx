import Image from "next/image";
import Link from "next/link";

import { AppIcon } from "~/components/app-icon";
import { UserMenu } from "~/components/user-menu";
import { auth } from "~/server/auth";
import { getEvents } from "~/server/lib/events";

function formatPrice(kurus: number) {
  return `TL ${(kurus / 100).toLocaleString("tr-TR")}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export default async function HomePage() {
  const session = await auth();
  const events = await getEvents();
  const featuredEvent = events.find((event) => event.isFeatured) ?? events[0];
  const trendingEvents = events.slice(0, 3);

  return (
    <main className="min-h-screen bg-[#0c0e17] text-[#f0f0fd]">
      <nav className="fixed top-0 z-50 w-full bg-slate-950/70 shadow-[0_0_20px_rgba(131,174,255,0.1)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 font-['Space_Grotesk',sans-serif] tracking-tight">
          <div className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent">
            BAKIRCAY VIBE
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <Link
              className="border-b-2 border-blue-400 pb-1 text-blue-400 transition-colors hover:text-blue-300"
              href="/"
            >
              Events
            </Link>
            <Link
              className="font-medium text-slate-400 transition-colors hover:text-blue-300"
              href="/satin-alimlarim"
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
          <div className="flex items-center gap-4">
            <button
              aria-label="Notifications"
              className="scale-95 text-slate-400 transition-colors hover:text-blue-300 active:duration-100"
            >
              <AppIcon name="notifications" className="h-5 w-5" />
            </button>
            {session?.user ? (
              <UserMenu name={session.user.name} image={session.user.image} />
            ) : (
              <Link
                href="/giris"
                aria-label="Profile"
                className="scale-95 text-slate-400 transition-colors hover:text-blue-300 active:duration-100"
              >
                <AppIcon name="person" className="h-5 w-5" />
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div className="flex min-h-screen pt-20">
        <aside className="sticky top-20 hidden h-[calc(100vh-5rem)] w-64 flex-col gap-4 border-r border-slate-800/50 bg-slate-900 p-4 font-['Plus_Jakarta_Sans',sans-serif] md:flex">
          <div className="mb-6 px-2">
            <h2 className="text-xl font-black text-blue-400">Welcome Back</h2>
            <p className="text-sm font-normal text-slate-500">
              Ready for the night?
            </p>
          </div>
          <nav className="flex flex-col gap-2">
            <Link
              className="flex items-center gap-3 rounded-lg bg-blue-900/30 px-4 py-3 text-blue-400 transition-all"
              href="/"
            >
              <AppIcon name="home" className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-4 py-3 text-slate-500 transition-all hover:bg-slate-800 hover:text-white"
              href="/"
            >
              <AppIcon name="explore" className="h-4 w-4" />
              <span>Explore</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-4 py-3 text-slate-500 transition-all hover:bg-slate-800 hover:text-white"
              href="/"
            >
              <AppIcon name="calendar_month" className="h-4 w-4" />
              <span>Calendar</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-4 py-3 text-slate-500 transition-all hover:bg-slate-800 hover:text-white"
              href="/satin-alimlarim"
            >
              <AppIcon name="favorite" className="h-4 w-4" />
              <span>Saved</span>
            </Link>
            <Link
              className="flex items-center gap-3 px-4 py-3 text-slate-500 transition-all hover:bg-slate-800 hover:text-white"
              href="/giris"
            >
              <AppIcon name="help" className="h-4 w-4" />
              <span>Support</span>
            </Link>
          </nav>
          <div className="mt-auto">
            <Link
              href={
                featuredEvent
                  ? `/biletler?event=${featuredEvent.slug}`
                  : "/biletler"
              }
              className="block w-full rounded-xl bg-linear-to-br from-[#83aeff] to-[#6aa0ff] px-4 py-3 text-center font-bold text-[#000000] shadow-[0_0_32px_rgba(131,174,255,0.08)] transition-transform active:scale-95"
            >
              Buy VIP Pass
            </Link>
          </div>
        </aside>

        <div className="mx-auto w-full max-w-6xl flex-1 px-6 pb-24 md:pb-12">
          <section className="group relative my-8 flex min-h-125 items-center justify-start overflow-hidden rounded-2xl bg-[#11131d] p-8 md:p-16">
            <div className="absolute inset-0 z-0">
              <Image
                className="h-full w-full scale-105 object-cover opacity-60 transition-transform duration-700 group-hover:scale-100"
                alt={featuredEvent?.title ?? "Techno club crowd"}
                src={
                  featuredEvent?.imageUrl ??
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuBzllyTwGwrXERTONzraD8NB7bdgdHkspuBVXQcG_R-nPUQIwo3ordAkr16RZdwhkfahl1NSVPXpwSyv872TFLCoZRf0ySQvutxXmhQ2CQC-dfLnVKpXp-2G81v5Nnf3mVG4x5bQH9ThR-w9Ik6S2MQKphINOroAOsIOOmm6dhuJRB886MCBZya7OXMXbA1CkoD_KdR2MGNJgIovSiO3NoIk3hbF0KhQdqLmePdB9GKUfXpdp7e-kjWkDvpjQKEwnKpxJSfwuahjxZ1"
                }
                fill
                sizes="(max-width: 768px) 100vw, 70vw"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-r from-[#0c0e17] via-[#0c0e17]/60 to-transparent" />
            </div>
            <div className="relative z-10 max-w-2xl">
              <span className="mb-6 inline-block rounded-full border border-[#00fdc6]/20 bg-[#00fdc6]/10 px-3 py-1 font-['Plus_Jakarta_Sans',sans-serif] text-sm font-bold tracking-wider text-[#00fdc6]">
                CAMPUS NIGHTLIFE
              </span>
              <h1 className="mb-4 font-['Space_Grotesk',sans-serif] text-6xl leading-[0.9] font-bold -tracking-[0.04em] text-[#f0f0fd] md:text-8xl">
                FIND YOUR <br />{" "}
                <span className="text-[#83aeff] italic">NEXT NIGHT</span> OUT
              </h1>
              {featuredEvent ? (
                <p className="mb-8 max-w-lg font-['Plus_Jakarta_Sans',sans-serif] text-[#c7ccdd]">
                  {featuredEvent.title} | {formatDate(featuredEvent.startAt)} |{" "}
                  {featuredEvent.venue}
                </p>
              ) : null}
              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <Link
                  href={
                    featuredEvent
                      ? `/biletler?event=${featuredEvent.slug}`
                      : "/biletler"
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#83aeff] to-[#6aa0ff] px-8 py-4 text-lg font-bold text-[#000000] transition-all hover:brightness-110 sm:w-auto"
                >
                  Explore Events{" "}
                  <AppIcon name="arrow_forward" className="h-4 w-4" />
                </Link>
                <Link
                  className="w-full rounded-xl border border-[#464752]/15 bg-[#222532]/40 px-8 py-4 text-center text-lg font-bold text-[#f0f0fd] backdrop-blur-md transition-all hover:bg-[#282b3a] sm:w-auto"
                  href="/biletler"
                >
                  View Calendar
                </Link>
              </div>
            </div>
          </section>

          <section className="mb-16">
            <div className="mb-8 flex items-end justify-between px-2">
              <div>
                <h2 className="font-['Space_Grotesk',sans-serif] text-4xl font-bold tracking-tight text-[#f0f0fd]">
                  Trending Events
                </h2>
                <p className="font-['Plus_Jakarta_Sans',sans-serif] text-[#aaaab7]">
                  The hottest spots this weekend
                </p>
              </div>
              <Link
                className="flex items-center gap-1 font-bold text-[#83aeff] hover:underline"
                href="/biletler"
              >
                View All <AppIcon name="open_in_new" className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {trendingEvents.map((event, index) => (
                <Link
                  key={event.id}
                  href={`/biletler?event=${event.slug}`}
                  className="group overflow-hidden rounded-lg border border-[#464752]/10 bg-[#1c1f2b]"
                >
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      alt={event.title}
                      src={event.imageUrl}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                    {index === 0 ? (
                      <div className="absolute top-3 right-3 rounded-full bg-[#ff51fa] px-3 py-1 text-xs font-bold tracking-widest text-[#400040] uppercase">
                        Selling Fast
                      </div>
                    ) : null}
                  </div>
                  <div className="p-5 font-['Plus_Jakarta_Sans',sans-serif]">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <h3 className="font-['Space_Grotesk',sans-serif] text-xl font-bold text-[#f0f0fd]">
                        {event.title}
                      </h3>
                      <span className="text-lg font-black text-[#00fdc6]">
                        {formatPrice(event.priceKurus)}
                      </span>
                    </div>
                    <p className="mb-4 text-sm text-[#aaaab7]">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-medium text-[#aaaab7]">
                      <span className="flex items-center gap-1">
                        <AppIcon name="calendar_today" className="h-4 w-4" />{" "}
                        {formatDate(event.startAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <AppIcon name="location_on" className="h-4 w-4" />{" "}
                        {event.venue}, {event.city}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl bg-slate-950/80 px-4 pt-2 pb-6 shadow-[0_-4px_24px_rgba(0,0,0,0.5)] backdrop-blur-2xl md:hidden">
        <Link
          className="flex flex-col items-center justify-center rounded-2xl bg-blue-500/20 px-6 py-2 text-blue-400 transition-transform duration-150 active:scale-90"
          href="/"
        >
          <AppIcon name="local_activity" className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-bold tracking-widest uppercase">
            Feed
          </span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center px-6 py-2 text-slate-500 transition-transform duration-150 active:scale-90"
          href="/"
        >
          <AppIcon name="search" className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-bold tracking-widest uppercase">
            Search
          </span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center px-6 py-2 text-slate-500 transition-transform duration-150 active:scale-90"
          href="/satin-alimlarim"
        >
          <AppIcon name="confirmation_number" className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-bold tracking-widest uppercase">
            Tickets
          </span>
        </Link>
        <Link
          className="flex flex-col items-center justify-center px-6 py-2 text-slate-500 transition-transform duration-150 active:scale-90"
          href="/giris"
        >
          <AppIcon name="account_circle" className="h-5 w-5" />
          <span className="mt-1 text-[10px] font-bold tracking-widest uppercase">
            Profile
          </span>
        </Link>
      </nav>

      <div className="fixed right-6 bottom-24 z-40 md:right-8 md:bottom-8">
        <Link
          href={
            featuredEvent
              ? `/biletler?event=${featuredEvent.slug}`
              : "/biletler"
          }
          className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-[#83aeff] to-[#6aa0ff] text-[#000000] shadow-[0_0_32px_rgba(131,174,255,0.2)] transition-all hover:scale-110 active:scale-90"
        >
          <AppIcon name="add" className="h-8 w-8" />
        </Link>
      </div>
    </main>
  );
}
