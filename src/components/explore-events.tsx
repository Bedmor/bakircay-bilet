"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

import { AppIcon } from "~/components/app-icon";

type ExploreEvent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  venue: string;
  city: string;
  category: string;
  imageUrl: string;
  startAt: string;
  priceKurus: number;
};

function formatPrice(tl: number) {
  return `TL ${tl.toLocaleString("tr-TR")}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ExploreEvents(props: { events: ExploreEvent[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("tr-TR");
    if (!normalized) return props.events;

    return props.events.filter((event) => {
      const haystack = [
        event.title,
        event.description,
        event.venue,
        event.city,
        event.category,
      ]
        .join(" ")
        .toLocaleLowerCase("tr-TR");

      return haystack.includes(normalized);
    });
  }, [props.events, query]);

  return (
    <>
      <div className="rounded-2xl border border-[#464752]/15 bg-[#11131d] p-5">
        <label className="mb-2 block text-xs font-bold tracking-widest text-[#83aeff] uppercase">
          Etkinlik Ara
        </label>
        <div className="flex items-center gap-2 rounded-xl bg-[#0c0e17] px-3 py-2 ring-1 ring-white/10 focus-within:ring-2 focus-within:ring-[#83aeff]/50">
          <AppIcon name="search" className="h-4 w-4 text-[#83aeff]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Sanatci, mekan, sehir, kategori..."
            className="w-full bg-transparent py-1 text-sm text-[#f0f0fd] outline-none placeholder:text-[#737580]"
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 ? (
          <article className="rounded-xl border border-[#464752]/15 bg-[#11131d] p-8 text-center text-sm text-[#aaaab7] md:col-span-2 xl:col-span-3">
            Aramana uygun etkinlik bulunamadi.
          </article>
        ) : (
          filtered.map((event) => (
            <Link
              key={event.id}
              href={`/biletler?event=${event.slug}`}
              className="group overflow-hidden rounded-2xl border border-[#464752]/15 bg-[#11131d]"
            >
              <div className="relative h-48">
                <Image
                  src={event.imageUrl}
                  alt={event.title}
                  fill
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="space-y-2 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-[#83aeff]/30 bg-[#83aeff]/10 px-2 py-1 text-[10px] font-bold text-[#dbe7ff] uppercase">
                    {event.category}
                  </span>
                  <span className="font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#00fdc6]">
                    {formatPrice(event.priceKurus)}
                  </span>
                </div>

                <h3 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#f0f0fd]">
                  {event.title}
                </h3>
                <p className="line-clamp-2 text-sm text-[#aaaab7]">
                  {event.description}
                </p>
                <p className="text-xs text-[#ced3e5]">
                  {formatDate(event.startAt)} | {event.venue}, {event.city}
                </p>
              </div>
            </Link>
          ))
        )}
      </div>
    </>
  );
}
