"use client";

import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";

import { AppIcon } from "~/components/app-icon";

export default function GirisPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loginWithEmail = async () => {
    setLoading(true);
    setStatus(null);

    const result = await signIn("resend", {
      email,
      redirect: false,
      redirectTo: "/biletler",
    });

    if (result?.error) {
      setStatus("Mail gonderimi basarisiz.");
      setLoading(false);
      return;
    }

    setStatus(
      "Magic link e-posta adresine gonderildi. Gelen kutunu kontrol et.",
    );
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#0c0e17] text-[#f0f0fd]">
      <nav className="fixed top-0 z-50 w-full bg-slate-950/70 shadow-[0_0_20px_rgba(131,174,255,0.1)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 font-['Space_Grotesk',sans-serif] tracking-tight">
          <Link
            href="/"
            className="bg-linear-to-r from-blue-400 to-cyan-400 bg-clip-text text-2xl font-bold text-transparent"
          >
            BAKIRCAY VIBE
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-slate-400 transition-colors hover:text-blue-300"
          >
            <AppIcon name="arrow_back" className="h-4 w-4" />
            Geri Don
          </Link>
        </div>
      </nav>

      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-6 pt-24 pb-10 md:grid-cols-2">
        <section className="space-y-6">
          <span className="inline-block rounded-full border border-[#00fdc6]/20 bg-[#00fdc6]/10 px-3 py-1 font-['Plus_Jakarta_Sans',sans-serif] text-xs font-bold tracking-wider text-[#00fdc6]">
            PASSWORDLESS ACCESS
          </span>
          <h1 className="font-['Space_Grotesk',sans-serif] text-5xl leading-[0.95] font-bold tracking-tight md:text-6xl">
            MAGIC LINK ILE
            <br />
            <span className="text-[#83aeff] italic">GUVENLI GIRIS</span>
          </h1>
          <p className="max-w-md font-['Plus_Jakarta_Sans',sans-serif] text-[#aaaab7]">
            Sifresiz giris icin sadece e-posta adresini yaz. Linke tikladiginda
            hesabina otomatik giris yaparsin.
          </p>
          <div className="relative h-56 overflow-hidden rounded-2xl border border-[#464752]/20 bg-[#11131d]">
            <Image
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8DrdrUoFQNzSAeM2SW4fyuMqRjSBfIWw9Mo4-mFuYjDVSk_c41nSWI6Iw1xt7Z8dkh343t2215Aqhkxk226wlkF7IJKHQdksYPf1mM1dBaCfSrrlhXn_Zqluwe__3_Y7s3tMnRPYw0R-L6anmiqVLsF8PnbvWGCnRapZMm6JRLgnnXEcQMBayMeNWlgFiIGnyT9RrGKBv8SqYGLQZerDQh3XpJLGrZeuBOq0fsKJepOhhuIkt8T-n6KxwjRXw_bJPqhOcMxEEeX91"
              alt="Bakircay Vibe login"
              fill
              sizes="(max-width: 768px) 100vw, 45vw"
              className="h-full w-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-linear-to-t from-[#11131d] to-transparent" />
          </div>
        </section>

        <section className="rounded-2xl border border-[#464752]/20 bg-[#11131d] p-6 shadow-[0_0_32px_rgba(131,174,255,0.08)] md:p-8">
          <h2 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold">
            E-posta ile Giris
          </h2>
          <p className="mt-2 font-['Plus_Jakarta_Sans',sans-serif] text-sm text-[#aaaab7]">
            Sadece magic link aktiftir.
          </p>

          <label className="mt-6 block text-[10px] font-bold tracking-widest text-[#737580] uppercase">
            E-posta
          </label>
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="ad.soyad@ornek.com"
            className="mt-2 w-full rounded-xl bg-black/30 px-4 py-3 text-sm text-[#f0f0fd] outline-none placeholder:text-[#737580]/50 focus:ring-2 focus:ring-[#83aeff]/50"
          />

          <button
            type="button"
            onClick={loginWithEmail}
            disabled={loading || !email.includes("@")}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#83aeff] to-[#6aa0ff] px-4 py-3 font-['Space_Grotesk',sans-serif] font-bold text-[#000000] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Gonderiliyor..." : "Magic Link Gonder"}
            <AppIcon name="arrow_forward" className="h-4 w-4" />
          </button>

          {status ? (
            <p className="mt-4 rounded-xl border border-[#464752]/30 bg-[#0c0e17] px-4 py-3 text-sm font-semibold text-[#c7ccdd]">
              {status}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
