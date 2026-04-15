"use client";

import { useEffect, useState } from "react";

import { AppIcon } from "~/components/app-icon";

type Ticket = {
  id: string;
  ticketNumber: string;
  status: string;
};

type PurchaseResponse = {
  purchase: {
    id: string;
    whatsappLink: string;
    status: string;
    tickets: Ticket[];
  };
};

export function PurchaseForm(props: {
  defaultPhone?: string | null;
  eventSlug?: string;
}) {
  const [quantity, setQuantity] = useState(1);
  const [phone, setPhone] = useState(props.defaultPhone ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<PurchaseResponse["purchase"] | null>(
    null,
  );

  useEffect(() => {
    if (props.defaultPhone) {
      setPhone(props.defaultPhone);
    }
  }, [props.defaultPhone]);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/purchases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quantity,
        phone,
        eventSlug: props.eventSlug,
      }),
    });

    const data = (await response.json().catch(() => null)) as
      | PurchaseResponse
      | { error?: string }
      | null;

    if (!response.ok || !data || !("purchase" in data)) {
      setError(
        (data as { error?: string } | null)?.error ??
          "Satin alma olusturulamadi.",
      );
      setLoading(false);
      return;
    }

    setPurchase(data.purchase);
    setLoading(false);
  };

  return (
    <div className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[10px] font-bold tracking-widest text-[#737580] uppercase">
              Ticket Qty
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="w-full rounded-xl bg-[#11131d] px-4 py-3 text-sm text-[#f0f0fd] outline-none focus:ring-2 focus:ring-[#83aeff]/50"
            />
          </div>
          <div>
            <label className="mb-2 block text-[10px] font-bold tracking-widest text-[#737580] uppercase">
              Phone
            </label>
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="w-full rounded-xl bg-[#11131d] px-4 py-3 text-sm text-[#f0f0fd] outline-none placeholder:text-[#737580]/50 focus:ring-2 focus:ring-[#83aeff]/50"
              placeholder="05xx xxx xx xx"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-2xl bg-linear-to-r from-[#83aeff] to-[#6aa0ff] px-4 py-5 font-['Space_Grotesk',sans-serif] text-lg font-bold text-[#000000] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          <span>
            {loading
              ? "Talep olusturuluyor..."
              : "WhatsApp Odeme Talebi Olustur"}
          </span>
          <AppIcon name="lock" className="h-4 w-4" />
        </button>
      </form>

      <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest text-[#aaaab7]/60 uppercase">
        <AppIcon name="security" className="h-3.5 w-3.5" />
        Odeme yonlendirmesi sifreli baglanti ile yapilir
      </div>

      {error ? (
        <p className="rounded-xl border border-[#9f0519] bg-[#2b0a12] px-4 py-3 text-sm font-semibold text-[#ffa8a3]">
          {error}
        </p>
      ) : null}

      {purchase ? (
        <section className="rounded-xl border border-[#464752]/30 bg-[#11131d] p-5">
          <h3 className="text-lg font-black text-[#f0f0fd]">
            Satin alma kaydi olustu
          </h3>
          <p className="mt-2 text-sm text-[#aaaab7]">
            Durum:{" "}
            <span className="font-bold text-[#00fdc6]">
              WhatsApp odeme bekleniyor
            </span>
          </p>
          <p className="mt-3 text-sm font-semibold text-[#f0f0fd]">
            Bilet numaralari:
          </p>
          <ul className="mt-2 space-y-2 text-sm text-[#f0f0fd]">
            {purchase.tickets.map((ticket) => (
              <li
                key={ticket.id}
                className="rounded-lg border border-[#464752] bg-[#0c0e17] px-3 py-2 font-mono"
              >
                {ticket.ticketNumber}
              </li>
            ))}
          </ul>

          <a
            href={purchase.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-block rounded-xl bg-[#00fdc6] px-4 py-2 text-sm font-bold text-[#005b46] transition-colors hover:bg-[#00edba]"
          >
            WhatsApp&apos;ta IBAN odeme adimina git
          </a>
        </section>
      ) : null}
    </div>
  );
}
