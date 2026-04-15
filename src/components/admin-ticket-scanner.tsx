"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type DetectedBarcode = {
  rawValue?: string;
};

type BarcodeDetectorInstance = {
  detect: (source: CanvasImageSource) => Promise<DetectedBarcode[]>;
};

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[];
}) => BarcodeDetectorInstance;

type CheckInSuccess = {
  ok: true;
  status: "checked-in" | "already-checked-in";
  message: string;
  ticketNumber: string;
  checkedInAt: string | null;
  attendeeName: string | null;
  attendeePhone: string | null;
  buyerPhone: string;
};

type CheckInError = {
  ok: false;
  message: string;
};

type CheckInResponse = CheckInSuccess | CheckInError;

export function AdminTicketScanner() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const detectorRef = useRef<BarcodeDetectorInstance | null>(null);
  const rafRef = useRef<number | null>(null);
  const submittingRef = useRef(false);

  const [lastScannedCode, setLastScannedCode] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [result, setResult] = useState<CheckInResponse | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const statusClass = useMemo(() => {
    if (!result) return "text-[#aaaab7]";
    if (result.ok && result.status === "checked-in") return "text-[#00fdc6]";
    if (result.ok && result.status === "already-checked-in") {
      return "text-[#ffd271]";
    }
    return "text-[#ffb2aa]";
  }, [result]);

  useEffect(() => {
    let active = true;
    const videoElement = videoRef.current;
    const Detector = (
      window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor }
    ).BarcodeDetector;

    async function startScanner() {
      if (!videoElement) return;
      if (!Detector) {
        setCameraError(
          "Bu cihazda otomatik QR algilama desteklenmiyor. Kodu elle girebilirsin.",
        );
        return;
      }

      try {
        detectorRef.current = new Detector({ formats: ["qr_code"] });
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
          },
          audio: false,
        });

        streamRef.current = stream;
        videoElement.srcObject = stream;
        await videoElement.play();

        const scanFrame = async () => {
          if (!active) return;

          if (!detectorRef.current || submittingRef.current) {
            rafRef.current = window.requestAnimationFrame(() => {
              void scanFrame();
            });
            return;
          }

          try {
            const barcodes = await detectorRef.current.detect(videoElement);
            const rawValue = barcodes[0]?.rawValue?.trim();

            if (rawValue && rawValue !== lastScannedCode) {
              setLastScannedCode(rawValue);
              void submitCode(rawValue);
            }
          } catch {
            // Karede kod bulunamazsa döngü devam eder.
          }

          rafRef.current = window.requestAnimationFrame(() => {
            void scanFrame();
          });
        };

        void scanFrame();
      } catch {
        setCameraError(
          "Kamera acilamadi. Kamera izni verip tekrar dene veya kodu elle gir.",
        );
      }
    }

    void startScanner();

    return () => {
      active = false;
      if (rafRef.current) {
        window.cancelAnimationFrame(rafRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [lastScannedCode]);

  async function submitCode(rawCode: string) {
    const ticketNumber = rawCode.trim();
    if (!ticketNumber) return;

    submittingRef.current = true;
    setResult(null);

    try {
      const response = await fetch("/api/admin/tickets/check-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ticketNumber }),
      });

      const payload: CheckInResponse =
        (await response.json()) as CheckInResponse;
      setResult(payload);
    } catch {
      setResult({
        ok: false,
        message: "Sunucuya ulasilamadi. Baglantiyi kontrol et.",
      });
    } finally {
      submittingRef.current = false;
    }
  }

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <article className="rounded-2xl border border-[#464752]/15 bg-[#11131d] p-5">
        <p className="text-xs font-bold tracking-widest text-[#83aeff] uppercase">
          Kamera ile Tara
        </p>
        <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#f0f0fd]">
          Giris Dogrulama
        </h2>
        <p className="mt-2 text-sm text-[#aaaab7]">
          Kullanici kapiya geldiginde QR kodu kameraya okut.
        </p>

        <div className="mt-4 overflow-hidden rounded-xl border border-[#464752]/20 bg-black">
          <video
            ref={videoRef}
            className="aspect-video w-full object-cover"
            muted
          />
        </div>

        {cameraError ? (
          <p className="mt-3 rounded-lg border border-[#ff8578]/30 bg-[#430d12] px-3 py-2 text-xs font-semibold text-[#ffb2aa]">
            {cameraError}
          </p>
        ) : (
          <p className="mt-3 text-xs text-[#aaaab7]">
            Arka kamera otomatik kullanilir. Isik dusukse ekrandaki kodu
            yaklastir.
          </p>
        )}
      </article>

      <article className="rounded-2xl border border-[#464752]/15 bg-[#11131d] p-5">
        <p className="text-xs font-bold tracking-widest text-[#83aeff] uppercase">
          Manuel Dogrulama
        </p>
        <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#f0f0fd]">
          Bilet Numarasi Gir
        </h2>

        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submitCode(manualCode);
          }}
        >
          <input
            value={manualCode}
            onChange={(event) => setManualCode(event.target.value)}
            placeholder="BV-XXXXX"
            className="w-full rounded-xl bg-[#0c0e17] px-4 py-3 text-[#f0f0fd] ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-[#83aeff]/60"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl border border-[#83aeff]/40 bg-[#83aeff]/20 px-4 py-3 text-sm font-bold text-[#dbe7ff] transition-colors hover:bg-[#83aeff]/30"
          >
            Dogrula
          </button>
        </form>

        <div className="mt-5 rounded-xl border border-[#464752]/20 bg-[#0c0e17] p-4">
          <p className={`text-sm font-semibold ${statusClass}`}>
            {result ? result.message : "Tarama sonucu burada gorunecek."}
          </p>
          {result?.ok ? (
            <div className="mt-3 space-y-1 text-xs text-[#d3d8e8]">
              <p>
                Bilet: <span className="font-mono">{result.ticketNumber}</span>
              </p>
              <p>Katilimci: {result.attendeeName ?? "Isimsiz"}</p>
              <p>Telefon: {result.attendeePhone ?? result.buyerPhone}</p>
              <p>
                Giris saati:{" "}
                {result.checkedInAt
                  ? new Date(result.checkedInAt).toLocaleString("tr-TR")
                  : "Henuz islenmedi"}
              </p>
            </div>
          ) : null}
        </div>
      </article>
    </section>
  );
}
