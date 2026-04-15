/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import Image from "next/image";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AppIcon } from "~/components/app-icon";
import { InitialAvatar } from "~/components/initial-avatar";
import { UserMenu } from "~/components/user-menu";
import { auth } from "~/server/auth";
import { db } from "~/server/db";
import {
  deleteR2ObjectByUrl,
  uploadProfileImageToR2,
} from "~/server/lib/r2";

const profileSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().or(z.literal("")),
  phone: z.string().trim().min(8).max(20),
});

export default async function SatinAlimlarimPage(props: {
  searchParams?: Promise<{ updated?: string; error?: string }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/giris");
  }

  const params = props.searchParams ? await props.searchParams : undefined;

  const purchases = await db.purchase.findMany({
    where: { userId: session.user.id },
    include: { tickets: true },
    orderBy: { createdAt: "desc" },
  });

  const firstPurchase = purchases[0] ?? null;
  const firstTicket = firstPurchase?.tickets[0] ?? null;
  const userDisplayName = session.user.name ?? "Bakircay Member";
  const userRoleLabel =
    session.user.role === "ADMIN" ? "Admin" : "Community Member";
  const userEmail = session.user.email ?? "";
  const userPhone = session.user.phone ?? "";

  async function updateProfile(formData: FormData) {
    "use server";

    const currentSession = await auth();
    if (!currentSession?.user?.id) {
      redirect("/giris");
    }

    const parsed = profileSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
    });

    if (!parsed.success) {
      redirect("/satin-alimlarim?error=validation");
    }

    const imageFile = formData.get("image");
    let imageUrl: string | undefined;
    const oldImageUrl = currentSession.user.image ?? undefined;

    if (imageFile instanceof File && imageFile.size > 0) {
      imageUrl = await uploadProfileImageToR2(imageFile);
    }

    try {
      await db.user.update({
        where: { id: currentSession.user.id },
        data: {
          name: parsed.data.name,
          email: parsed.data.email === "" ? null : parsed.data.email,
          phone: parsed.data.phone,
          ...(imageUrl ? { image: imageUrl } : {}),
        },
      });

      if (imageUrl && oldImageUrl && oldImageUrl !== imageUrl) {
        try {
          await deleteR2ObjectByUrl(oldImageUrl);
        } catch {
          // Eski görsel silinemese bile yükleme ve güncelleme başarılı kabul edilir.
        }
      }
    } catch {
      redirect("/satin-alimlarim?error=duplicate");
    }

    revalidatePath("/satin-alimlarim");
    redirect("/satin-alimlarim?updated=1");
  }

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
              className="border-b-2 border-blue-400 pb-1 font-medium text-blue-400 transition-colors hover:text-blue-300"
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
            <button className="scale-95 text-slate-400 transition-colors hover:text-blue-300 active:duration-100">
              <AppIcon name="notifications" className="h-5 w-5" />
            </button>
            <UserMenu name={session.user.name} image={session.user.image} />
          </div>
        </div>
      </nav>

      <div className="flex min-h-screen pt-20">
        <aside className="sticky top-20 hidden h-[calc(100vh-80px)] w-64 flex-col gap-4 border-r border-slate-800/50 bg-slate-900 p-4 font-['Plus_Jakarta_Sans',sans-serif] font-semibold md:flex">
          <div className="flex items-center gap-3 px-2 py-4">
            <InitialAvatar
              name={userDisplayName}
              className="h-12 w-12 border-2 border-blue-400"
              textClassName="text-lg font-black text-[#0c0e17]"
            />
            <div>
              <h3 className="text-sm text-blue-400">Welcome Back</h3>
              <p className="text-xs text-slate-500">Ready for the night?</p>
            </div>
          </div>

          <nav className="flex grow flex-col gap-1">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-500 transition-all duration-200 ease-in-out hover:bg-slate-800 hover:text-white"
            >
              <AppIcon name="home" className="h-4 w-4" />
              <span>Home</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-500 transition-all duration-200 ease-in-out hover:bg-slate-800 hover:text-white"
            >
              <AppIcon name="explore" className="h-4 w-4" />
              <span>Explore</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-500 transition-all duration-200 ease-in-out hover:bg-slate-800 hover:text-white"
            >
              <AppIcon name="calendar_month" className="h-4 w-4" />
              <span>Calendar</span>
            </Link>
            <Link
              href="/satin-alimlarim"
              className="flex items-center gap-3 rounded-lg bg-slate-800 px-4 py-3 text-white transition-all duration-200 ease-in-out"
            >
              <AppIcon name="favorite" className="h-4 w-4" />
              <span>Saved</span>
            </Link>
            <Link
              href="/giris"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-slate-500 transition-all duration-200 ease-in-out hover:bg-slate-800 hover:text-white"
            >
              <AppIcon name="help" className="h-4 w-4" />
              <span>Support</span>
            </Link>
          </nav>

          <Link
            href="/biletler"
            className="mt-auto rounded-xl border border-blue-400/30 bg-blue-900/30 py-3 text-center font-bold text-blue-400 transition-all duration-300 hover:bg-blue-400 hover:text-slate-950"
          >
            Buy VIP Pass
          </Link>
        </aside>

        <main className="flex-1 bg-[#0c0e17] p-6 md:p-10">
          <header className="mb-12">
            <h1 className="mb-2 font-['Space_Grotesk',sans-serif] text-5xl font-bold tracking-tighter text-[#f0f0fd] md:text-7xl">
              My Tickets
            </h1>
            <p className="font-['Plus_Jakarta_Sans',sans-serif] text-lg text-[#aaaab7]">
              Your gateway to the next vibe.
            </p>
          </header>

          {params?.updated === "1" ? (
            <p className="mb-6 rounded-lg border border-[#00fdc6]/30 bg-[#00fdc6]/10 px-4 py-3 text-sm font-semibold text-[#77ffe3]">
              Profil bilgilerin basariyla guncellendi.
            </p>
          ) : null}
          {params?.error ? (
            <p className="mb-6 rounded-lg border border-[#ff8578]/30 bg-[#430d12] px-4 py-3 text-sm font-semibold text-[#ffb2aa]">
              Profil guncellenemedi. E-posta veya telefon zaten kullaniliyor
              olabilir.
            </p>
          ) : null}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
            <div className="space-y-8 lg:col-span-8">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 font-['Space_Grotesk',sans-serif] text-2xl font-semibold">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-[#00fdc6]" />
                  ACTIVE ACCESS
                </h2>
              </div>

              {firstPurchase ? (
                <article className="relative flex flex-col overflow-hidden rounded-xl border border-[#464752]/15 bg-[#1c1f2b] md:flex-row">
                  <div className="relative h-48 overflow-hidden md:h-auto md:w-1/3">
                    <Image
                      className="h-full w-full object-cover"
                      alt="Active ticket event"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDqf3mxXmRhTs6mfJKvjaTsUvBrMCpx1wHusjnz5SOrJpFb7Ehx1jw_HDCa4M345drCaIluJuyRsR_0YI032hSLprIfiJhG8VxFhfvh9AbZoLQAMixJqTsK54a7E3LPjnA7pA7kGEKogOP1LdEyobv-g19xDiS5gCIrPSWiPZbhE24ycjnxjLMobwgwRfCPLpjDvchqzL78PdgXF8WKi7w0uLzU5UBmmYhBvptUc2dgoSKY4rB5H4W1N-ISQAVOyKtEpOgUST5vwPlW"
                      fill
                      sizes="(max-width: 768px) 100vw, 30vw"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-[#1c1f2b] via-transparent to-transparent" />
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <h3 className="mb-2 font-['Space_Grotesk',sans-serif] text-3xl font-bold">
                        ACTIVE PURCHASE
                      </h3>
                      <div className="mb-4 flex gap-4 font-['Plus_Jakarta_Sans',sans-serif] text-sm text-[#aaaab7]">
                        <span className="flex items-center gap-1">
                          <AppIcon
                            name="calendar_today"
                            className="h-3.5 w-3.5"
                          />
                          {new Date(
                            String(firstPurchase.createdAt),
                          ).toLocaleDateString("tr-TR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <AppIcon name="location_on" className="h-3.5 w-3.5" />
                          Main Campus Plaza
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="rounded-lg bg-white p-3 shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                        <Image
                          alt="QR Code"
                          className="h-20 w-20 brightness-0 grayscale"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvsOrV3_YIZax83x7nfmHr_vnkw3JiZZZ8cGp3HXZiznK6SbS2nNpEE637e7jqUgUwF43u3sQZ2-x7f1rRfoR8sK6SJ8vKBkpBXV2TUAcnWDLF52xIljgV_zfYkbXuGTxd3W87PK2D4n42drSjvAN1dPQ_9ZLPodPVquEKt-oMMICNuQYOLEEvrSUmHwGMkE6xYOQbJcF0m-QRYBhEALo5glQQH8SdTMbsdRa6T1GiT_HQdTKdlKWs5dBcXFtoTymP2ZDgfa5bLdcC"
                          width={80}
                          height={80}
                        />
                      </div>
                      <div className="font-['Plus_Jakarta_Sans',sans-serif]">
                        <p className="mb-1 text-xs font-bold tracking-widest text-[#aaaab7] uppercase">
                          Scan for entry
                        </p>
                        <p className="font-['Space_Grotesk',sans-serif] font-bold text-[#83aeff]">
                          {firstTicket?.ticketNumber ?? "#BV-PENDING"}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              ) : (
                <article className="rounded-xl border border-[#464752]/15 bg-[#1c1f2b] p-8 text-center font-['Plus_Jakarta_Sans',sans-serif] text-sm font-semibold text-[#aaaab7]">
                  Henuz satin alma kaydin yok.
                </article>
              )}

              <section className="mt-16">
                <h2 className="mb-6 flex items-center gap-2 font-['Space_Grotesk',sans-serif] text-2xl font-semibold">
                  <AppIcon name="history" className="h-5 w-5 text-[#83aeff]" />
                  PAST VIBES
                </h2>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {purchases.slice(1).length > 0 ? (
                    purchases.slice(1).map((purchase) => (
                      <Link
                        key={purchase.id}
                        href={purchase.whatsappLink}
                        target="_blank"
                        rel="noreferrer"
                        className="group flex cursor-pointer items-center gap-4 rounded-lg bg-[#11131d] p-4 transition-colors hover:bg-[#1c1f2b]"
                      >
                        <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                          <Image
                            className="h-full w-full object-cover"
                            alt="Past event"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuApJL2STdFLTpEj_OeOEkuFUvNcuH-ckcVd917SjKdqxZJqg_gbRQSWBx9v9sD2JgkfIiTgPMKKChpLX53ijoOjCk_NAv_gDouBCQ9Dun50e2iskpMCkjFhf6kfqyxgsEyuX6NsiRGEGMcwkXuMEgB4HdL26k0DYdfaqYqQWL7S36AI2TtF5kmk0qGSh_ivOUD7dsAhsKDvNDkGT6346BswrV-COZ7vIIRSIjCVj4Qu4YsmS-unHSLpGEORBhLZy6K7cqC3CrkhxG6d"
                            width={64}
                            height={64}
                          />
                        </div>
                        <div>
                          <h4 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#f0f0fd] transition-colors group-hover:text-[#83aeff]">
                            Order {purchase.id.slice(0, 8)}
                          </h4>
                          <p className="text-xs text-[#aaaab7]">
                            {new Date(
                              String(purchase.createdAt),
                            ).toLocaleDateString("tr-TR")}
                          </p>
                        </div>
                        <AppIcon
                          name="chevron_right"
                          className="ml-auto h-4 w-4 text-[#aaaab7]"
                        />
                      </Link>
                    ))
                  ) : (
                    <div className="rounded-lg bg-[#11131d] p-4 text-sm text-[#aaaab7] sm:col-span-2">
                      Once you buy more tickets, your history appears here.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-6 lg:col-span-4">
              <div className="rounded-xl border border-[#464752]/10 bg-[#11131d] p-8">
                <div className="mb-8 text-center">
                  <div className="group relative mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-[#00fdc6]">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt="Profile"
                        fill
                        sizes="100%"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <InitialAvatar
                        name={userDisplayName}
                        className="h-24 w-24"
                        textClassName="text-4xl font-black text-[#0c0e17]"
                      />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-[#222532]/60 opacity-0 transition-opacity group-hover:opacity-100">
                      <AppIcon
                        name="photo_camera"
                        className="h-5 w-5 text-white"
                      />
                    </div>
                  </div>
                  <h3 className="font-['Space_Grotesk',sans-serif] text-2xl font-bold">
                    {userDisplayName}
                  </h3>
                  <p className="font-['Plus_Jakarta_Sans',sans-serif] text-sm font-bold tracking-widest text-[#00fdc6] uppercase">
                    {userRoleLabel}
                  </p>
                </div>

                <form
                  action={updateProfile}
                  encType="multipart/form-data"
                  className="space-y-4 font-['Plus_Jakarta_Sans',sans-serif]"
                >
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-[0.2em] text-[#aaaab7] uppercase">
                      Full Name
                    </label>
                    <input
                      name="name"
                      defaultValue={userDisplayName}
                      className="w-full rounded-lg border border-[#464752]/10 bg-black/30 p-3 text-[#f0f0fd] focus:ring-2 focus:ring-[#83aeff]/50 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-[0.2em] text-[#aaaab7] uppercase">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      defaultValue={userEmail}
                      className="w-full rounded-lg border border-[#464752]/10 bg-black/30 p-3 text-[#f0f0fd] focus:ring-2 focus:ring-[#83aeff]/50 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-[0.2em] text-[#aaaab7] uppercase">
                      Phone
                    </label>
                    <input
                      name="phone"
                      defaultValue={userPhone}
                      className="w-full rounded-lg border border-[#464752]/10 bg-black/30 p-3 text-[#f0f0fd] focus:ring-2 focus:ring-[#83aeff]/50 focus:outline-none"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold tracking-[0.2em] text-[#aaaab7] uppercase">
                      Profil Fotoğrafı
                    </label>
                    <input
                      type="file"
                      name="image"
                      accept="image/*"
                      className="w-full rounded-lg border border-[#464752]/10 bg-black/30 p-3 text-sm text-[#f0f0fd] file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#83aeff] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-[#000000] focus:outline-none"
                    />
                    <p className="text-xs text-[#aaaab7]">
                      Yeni bir fotoğraf seçersen profil resmin Cloudflare R2’ye
                      yüklenir.
                    </p>
                  </div>
                  <button
                    type="submit"
                    className="mt-6 block w-full rounded-xl bg-linear-to-br from-[#83aeff] to-[#6aa0ff] py-4 text-center font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#000000] shadow-[0_0_32px_rgba(131,174,255,0.2)] transition-all hover:scale-[1.02] active:scale-95"
                  >
                    Save Profile Updates
                  </button>
                </form>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-[#1c1f2b] p-4 transition-all hover:bg-[#282b3a]">
                  <AppIcon
                    name="settings"
                    className="h-5 w-5 text-[#ff51fa] transition-transform group-hover:scale-110"
                  />
                  <span className="text-[10px] font-bold tracking-widest uppercase">
                    Settings
                  </span>
                </button>
                <button className="group flex flex-col items-center justify-center gap-2 rounded-xl bg-[#1c1f2b] p-4 transition-all hover:bg-[#282b3a]">
                  <AppIcon
                    name="share"
                    className="h-5 w-5 text-[#00fdc6] transition-transform group-hover:scale-110"
                  />
                  <span className="text-[10px] font-bold tracking-widest uppercase">
                    Invite
                  </span>
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl bg-slate-950/80 px-4 pt-2 pb-6 shadow-[0_-4px_24px_rgba(0,0,0,0.5)] backdrop-blur-2xl md:hidden">
        <Link
          href="/"
          className="flex flex-col items-center justify-center px-6 py-2 text-slate-500 transition-transform duration-150 active:scale-90"
        >
          <AppIcon name="local_activity" className="h-5 w-5" />
          <span className="text-[10px] font-bold tracking-widest uppercase">
            Feed
          </span>
        </Link>
        <Link
          href="/"
          className="flex flex-col items-center justify-center px-6 py-2 text-slate-500 transition-transform duration-150 active:scale-90"
        >
          <AppIcon name="search" className="h-5 w-5" />
          <span className="text-[10px] font-bold tracking-widest uppercase">
            Search
          </span>
        </Link>
        <Link
          href="/satin-alimlarim"
          className="flex flex-col items-center justify-center rounded-2xl bg-blue-500/20 px-6 py-2 text-blue-400 transition-transform duration-150 active:scale-90"
        >
          <AppIcon name="confirmation_number" className="h-5 w-5" />
          <span className="text-[10px] font-bold tracking-widest uppercase">
            Tickets
          </span>
        </Link>
        <Link
          href="/giris"
          className="flex flex-col items-center justify-center px-6 py-2 text-slate-500 transition-transform duration-150 active:scale-90"
        >
          <AppIcon name="account_circle" className="h-5 w-5" />
          <span className="text-[10px] font-bold tracking-widest uppercase">
            Profile
          </span>
        </Link>
      </nav>

      <div className="h-24 md:hidden" />
    </main>
  );
}
