"use client";

import Image from "next/image";
import { useState } from "react";

type QrCodeViewerProps = {
  src: string;
  alt: string;
  ticketNumber: string;
  previewSize?: number;
};

export function QrCodeViewer(props: QrCodeViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const previewSize = props.previewSize ?? 112;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex rounded-lg bg-white p-2 transition-transform hover:scale-[1.02]"
        aria-label="QR kodu tam ekranda ac"
      >
        <Image
          src={props.src}
          alt={props.alt}
          width={previewSize}
          height={previewSize}
          className="h-28 w-28"
          unoptimized
        />
      </button>

      {isOpen ? (
        <div
          className="fixed inset-0 z-80 flex items-center justify-center bg-black/90 px-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
          >
            Kapat
          </button>
          <div className="flex w-full max-w-xl flex-col items-center rounded-2xl border border-white/20 bg-[#0c0e17] p-5">
            <p className="mb-1 text-xs font-bold tracking-widest text-[#83aeff] uppercase">
              Giris Dogrulama Kodu
            </p>
            <p className="mb-4 font-mono text-sm text-[#f0f0fd]">
              {props.ticketNumber}
            </p>
            <div className="rounded-xl bg-white p-4">
              <Image
                src={props.src}
                alt={props.alt}
                width={520}
                height={520}
                className="h-auto w-full max-w-[80vw] sm:max-w-[70vw]"
                unoptimized
                priority
              />
            </div>
            <p className="mt-4 text-center text-xs text-[#aaaab7]">
              Telefonu yaklastirip tam ekran QR kodu okutabilirsin.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
