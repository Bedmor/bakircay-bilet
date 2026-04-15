/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { AppIcon } from "../../components/app-icon";
import { auth } from "../../server/auth";
import { db } from "../../server/db";
import { uploadEventImageToR2 } from "../../server/lib/r2";
import type { Prisma } from "../../../generated/prisma";

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

function slugify(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9ğüşöçıİĞÜŞÖÇ\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || `event-${Date.now()}`;
}

function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const eventSchema = z.object({
  eventId: z.string().optional(),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(500),
  venue: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80),
  startAt: z.string().min(1),
  imageUrl: z.string().url().optional(),
  priceKurus: z.coerce.number().int().min(0),
  category: z.string().trim().min(2).max(80),
  slug: z.string().trim().max(140).optional(),
  isFeatured: z.boolean().optional().default(false),
});

const roleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["USER", "ADMIN"]),
});

type EventRecord = Prisma.EventGetPayload<Prisma.EventDefaultArgs>;
type PurchaseRecord = Prisma.PurchaseGetPayload<{
  include: {
    user: {
      select: {
        name: true;
        email: true;
        phone: true;
      };
    };
    tickets: true;
  };
}>;
type TicketRecord = Prisma.TicketGetPayload<Prisma.TicketDefaultArgs>;
type UserRecord = Prisma.UserGetPayload<{
  include: {
    _count: {
      select: {
        purchases: true;
        tickets: true;
      };
    };
  };
}>;

export default async function AdminPage(props: {
  searchParams?: Promise<{
    tab?: string;
    edit?: string;
    created?: string;
    updated?: string;
    deleted?: string;
    roleUpdated?: string;
    error?: string;
  }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/giris");
  }

  if (session.user.role !== "ADMIN") {
    redirect("/biletler");
  }

  const params = props.searchParams ? await props.searchParams : undefined;
  const activeTab =
    params?.tab === "users" ||
    params?.tab === "tickets" ||
    params?.tab === "events"
      ? params.tab
      : "events";

  const events: EventRecord[] = await db.event.findMany({
    orderBy: [{ isFeatured: "desc" }, { startAt: "desc" }],
  });

  const editingEvent = params?.edit
    ? (events.find((event: EventRecord) => event.id === params.edit) ?? null)
    : null;

  const purchases: PurchaseRecord[] = await db.purchase.findMany({
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
        },
      },
      tickets: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const users: UserRecord[] = await db.user.findMany({
    include: {
      _count: {
        select: { purchases: true, tickets: true },
      },
    },
    orderBy: [{ role: "desc" }, { name: "asc" }],
  });

  async function saveEvent(formData: FormData) {
    "use server";

    const adminSession = await auth();
    if (!adminSession?.user?.id || adminSession.user.role !== "ADMIN") {
      return;
    }

    const eventIdRaw = formData.get("eventId");
    const eventId = typeof eventIdRaw === "string" ? eventIdRaw : undefined;
    const imageFile = formData.get("image");
    const imageUrlInput = formData.get("imageUrl");

    const imageUrlValue =
      typeof imageUrlInput === "string" && imageUrlInput.length > 0
        ? imageUrlInput
        : undefined;

    const parsed = eventSchema.safeParse({
      eventId,
      title: formData.get("title"),
      description: formData.get("description"),
      venue: formData.get("venue"),
      city: formData.get("city"),
      startAt: formData.get("startAt"),
      imageUrl: imageUrlValue,
      priceKurus: formData.get("priceKurus"),
      category: formData.get("category"),
      slug: formData.get("slug"),
      isFeatured: formData.get("isFeatured") === "on",
    });

    if (!parsed.success) {
      const editQuery =
        typeof eventId === "string" && eventId.length > 0
          ? `&edit=${eventId}`
          : "";
      redirect(`/admin?tab=events${editQuery}&error=validation`);
    }

    let uploadedImageUrl: string | undefined;
    if (imageFile instanceof File && imageFile.size > 0) {
      uploadedImageUrl = await uploadEventImageToR2(imageFile);
    }

    const customSlug = parsed.data.slug?.trim();
    const baseSlug =
      customSlug && customSlug.length > 0
        ? customSlug
        : slugify(parsed.data.title);

    if (parsed.data.eventId) {
      const currentEvent = await db.event.findUnique({
        where: { id: parsed.data.eventId },
        select: { imageUrl: true },
      });

      const finalImageUrl =
        uploadedImageUrl ?? parsed.data.imageUrl ?? currentEvent?.imageUrl;

      if (!finalImageUrl) {
        redirect(
          `/admin?tab=events&edit=${parsed.data.eventId}&error=validation`,
        );
      }

      await db.event.update({
        where: { id: parsed.data.eventId },
        data: {
          title: parsed.data.title,
          description: parsed.data.description,
          venue: parsed.data.venue,
          city: parsed.data.city,
          startAt: new Date(parsed.data.startAt),
          imageUrl: finalImageUrl,
          priceKurus: parsed.data.priceKurus,
          category: parsed.data.category,
          isFeatured: parsed.data.isFeatured,
          slug: baseSlug,
        },
      });

      revalidatePath("/");
      revalidatePath("/biletler");
      revalidatePath("/admin");
      redirect("/admin?tab=events&updated=1");
    }

    const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const finalImageUrl = uploadedImageUrl ?? parsed.data.imageUrl;
    if (!finalImageUrl) {
      redirect("/admin?tab=events&error=validation");
    }

    await db.event.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        venue: parsed.data.venue,
        city: parsed.data.city,
        startAt: new Date(parsed.data.startAt),
        imageUrl: finalImageUrl,
        priceKurus: parsed.data.priceKurus,
        category: parsed.data.category,
        isFeatured: parsed.data.isFeatured,
        slug: uniqueSlug,
      },
    });

    revalidatePath("/");
    revalidatePath("/biletler");
    revalidatePath("/admin");
    redirect("/admin?tab=events&created=1");
  }

  async function deleteEvent(formData: FormData) {
    "use server";

    const adminSession = await auth();
    if (!adminSession?.user?.id || adminSession.user.role !== "ADMIN") {
      return;
    }

    const eventId = formData.get("eventId");
    if (typeof eventId !== "string") {
      return;
    }

    await db.event.delete({ where: { id: eventId } });

    revalidatePath("/");
    revalidatePath("/biletler");
    revalidatePath("/admin");
    redirect("/admin?tab=events&deleted=1");
  }

  async function approvePurchase(formData: FormData) {
    "use server";

    const adminSession = await auth();
    if (!adminSession?.user?.id || adminSession.user.role !== "ADMIN") {
      return;
    }

    const purchaseId = formData.get("purchaseId");
    if (typeof purchaseId !== "string") {
      return;
    }

    await db.$transaction(async (tx) => {
      await tx.purchase.update({
        where: { id: purchaseId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });

      await tx.ticket.updateMany({
        where: { purchaseId },
        data: {
          status: "APPROVED",
          approvedAt: new Date(),
        },
      });
    });

    revalidatePath("/admin");
    revalidatePath("/satin-alimlarim");
  }

  async function updateUserRole(formData: FormData) {
    "use server";

    const adminSession = await auth();
    if (!adminSession?.user?.id || adminSession.user.role !== "ADMIN") {
      return;
    }

    const parsed = roleSchema.safeParse({
      userId: formData.get("userId"),
      role: formData.get("role"),
    });

    if (!parsed.success) {
      redirect("/admin?tab=users&error=validation");
    }

    if (
      adminSession.user.id === parsed.data.userId &&
      parsed.data.role !== "ADMIN"
    ) {
      redirect("/admin?tab=users&error=self_role");
    }

    await db.user.update({
      where: { id: parsed.data.userId },
      data: { role: parsed.data.role },
    });

    revalidatePath("/admin");
    redirect("/admin?tab=users&roleUpdated=1");
  }

  const pendingPurchases = purchases.filter(
    (purchase: PurchaseRecord) => purchase.status !== "APPROVED",
  );
  const approvedPurchases = purchases.length - pendingPurchases.length;
  const pendingRevenue = pendingPurchases.reduce(
    (sum: number, purchase: PurchaseRecord) => sum + purchase.totalKurus,
    0,
  );

  const eventFormLabel = editingEvent
    ? "Etkinlik güncelle"
    : "Etkinlik oluştur";

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
              className="font-medium text-slate-400 transition-colors hover:text-blue-300"
              href="/satin-alimlarim"
            >
              My Tickets
            </Link>
            <span className="border-b-2 border-blue-400 pb-1 text-blue-400">
              Admin
            </span>
          </div>
        </div>
      </nav>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 pt-28 pb-20 md:px-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="sticky top-28 h-fit rounded-2xl border border-[#464752]/15 bg-[#11131d] p-4 shadow-[0_0_40px_rgba(0,0,0,0.2)]">
          <div className="rounded-xl border border-[#464752]/15 bg-[#0c0e17] p-4">
            <p className="text-xs font-bold tracking-widest text-[#83aeff] uppercase">
              Admin Hub
            </p>
            <h2 className="mt-2 font-['Space_Grotesk',sans-serif] text-2xl font-bold">
              Yönetim Paneli
            </h2>
            <p className="mt-2 text-sm text-[#aaaab7]">
              Etkinlik, bilet ve kullanıcı görünümü tek panelde.
            </p>
          </div>

          <nav className="mt-4 space-y-2 font-['Plus_Jakarta_Sans',sans-serif] text-sm font-semibold">
            <Link
              href="/admin?tab=events"
              className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
                activeTab === "events"
                  ? "bg-[#83aeff]/15 text-[#dbe7ff]"
                  : "text-[#aaaab7] hover:bg-white/5 hover:text-[#f0f0fd]"
              }`}
            >
              <span className="flex items-center gap-3">
                <AppIcon name="add" className="h-4 w-4" />
                Etkinlikler
              </span>
              <span className="text-xs text-[#737580]">{events.length}</span>
            </Link>
            <Link
              href="/admin?tab=tickets"
              className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
                activeTab === "tickets"
                  ? "bg-[#83aeff]/15 text-[#dbe7ff]"
                  : "text-[#aaaab7] hover:bg-white/5 hover:text-[#f0f0fd]"
              }`}
            >
              <span className="flex items-center gap-3">
                <AppIcon name="confirmation_number" className="h-4 w-4" />
                Biletler
              </span>
              <span className="text-xs text-[#737580]">{purchases.length}</span>
            </Link>
            <Link
              href="/admin?tab=users"
              className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
                activeTab === "users"
                  ? "bg-[#83aeff]/15 text-[#dbe7ff]"
                  : "text-[#aaaab7] hover:bg-white/5 hover:text-[#f0f0fd]"
              }`}
            >
              <span className="flex items-center gap-3">
                <AppIcon name="account_circle" className="h-4 w-4" />
                Kullanıcılar
              </span>
              <span className="text-xs text-[#737580]">{users.length}</span>
            </Link>
          </nav>

          <div className="mt-4 grid grid-cols-1 gap-3">
            <div className="rounded-xl border border-[#464752]/15 bg-[#0c0e17] p-4">
              <p className="text-xs tracking-wider text-[#aaaab7] uppercase">
                Bekleyen Bilet
              </p>
              <p className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#f0f0fd]">
                {pendingPurchases.length}
              </p>
            </div>
            <div className="rounded-xl border border-[#464752]/15 bg-[#0c0e17] p-4">
              <p className="text-xs tracking-wider text-[#aaaab7] uppercase">
                Bekleyen Tutar
              </p>
              <p className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#83aeff]">
                {formatPrice(pendingRevenue)}
              </p>
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          {activeTab === "events" ? (
            <>
              {params?.created ? (
                <p className="rounded-xl border border-[#00fdc6]/30 bg-[#00fdc6]/10 px-4 py-3 text-sm font-semibold text-[#77ffe3]">
                  Etkinlik oluşturuldu.
                </p>
              ) : null}
              {params?.updated ? (
                <p className="rounded-xl border border-[#83aeff]/30 bg-[#83aeff]/10 px-4 py-3 text-sm font-semibold text-[#dbe7ff]">
                  Etkinlik güncellendi.
                </p>
              ) : null}
              {params?.deleted ? (
                <p className="rounded-xl border border-[#ff8578]/30 bg-[#430d12] px-4 py-3 text-sm font-semibold text-[#ffb2aa]">
                  Etkinlik silindi.
                </p>
              ) : null}
              {params?.error ? (
                <p className="rounded-xl border border-[#ff8578]/30 bg-[#430d12] px-4 py-3 text-sm font-semibold text-[#ffb2aa]">
                  Etkinlik kaydı işlenemedi. Form alanlarını kontrol et.
                </p>
              ) : null}

              <header className="glass-card rounded-2xl border border-[#464752]/15 p-6">
                <p className="text-xs font-bold tracking-widest text-[#83aeff] uppercase">
                  Etkinlik Yönetimi
                </p>
                <h1 className="mt-2 font-['Space_Grotesk',sans-serif] text-4xl font-bold tracking-tight md:text-5xl">
                  {eventFormLabel}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-[#aaaab7]">
                  Anasayfa ve bilet sayfası bu kayıtlardan beslenir.
                </p>
              </header>

              {editingEvent ? (
                <div className="rounded-xl border border-[#83aeff]/20 bg-[#83aeff]/10 px-4 py-3 text-sm text-[#dbe7ff]">
                  Düzenleniyor:{" "}
                  <span className="font-semibold">{editingEvent.title}</span>
                </div>
              ) : null}

              <form
                action={saveEvent}
                encType="multipart/form-data"
                className="rounded-2xl border border-[#464752]/15 bg-[#11131d] p-6"
              >
                {editingEvent ? (
                  <input type="hidden" name="eventId" value={editingEvent.id} />
                ) : null}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-2 text-sm">
                    <span className="block text-xs font-bold tracking-widest text-[#737580] uppercase">
                      Başlık
                    </span>
                    <input
                      name="title"
                      required
                      defaultValue={editingEvent?.title ?? ""}
                      className="w-full rounded-xl bg-[#0c0e17] px-4 py-3 text-[#f0f0fd] ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-[#83aeff]/60"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="block text-xs font-bold tracking-widest text-[#737580] uppercase">
                      Slug
                    </span>
                    <input
                      name="slug"
                      placeholder="opsiyonel"
                      defaultValue={editingEvent?.slug ?? ""}
                      className="w-full rounded-xl bg-[#0c0e17] px-4 py-3 text-[#f0f0fd] ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-[#83aeff]/60"
                    />
                  </label>
                  <label className="space-y-2 text-sm md:col-span-2">
                    <span className="block text-xs font-bold tracking-widest text-[#737580] uppercase">
                      Açıklama
                    </span>
                    <textarea
                      name="description"
                      required
                      rows={4}
                      defaultValue={editingEvent?.description ?? ""}
                      className="w-full rounded-xl bg-[#0c0e17] px-4 py-3 text-[#f0f0fd] ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-[#83aeff]/60"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="block text-xs font-bold tracking-widest text-[#737580] uppercase">
                      Mekan
                    </span>
                    <input
                      name="venue"
                      required
                      defaultValue={editingEvent?.venue ?? ""}
                      className="w-full rounded-xl bg-[#0c0e17] px-4 py-3 text-[#f0f0fd] ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-[#83aeff]/60"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="block text-xs font-bold tracking-widest text-[#737580] uppercase">
                      Şehir
                    </span>
                    <input
                      name="city"
                      required
                      defaultValue={editingEvent?.city ?? ""}
                      className="w-full rounded-xl bg-[#0c0e17] px-4 py-3 text-[#f0f0fd] ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-[#83aeff]/60"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="block text-xs font-bold tracking-widest text-[#737580] uppercase">
                      Tarih & Saat
                    </span>
                    <input
                      name="startAt"
                      type="datetime-local"
                      required
                      defaultValue={
                        editingEvent
                          ? toDateTimeLocalValue(editingEvent.startAt)
                          : ""
                      }
                      className="w-full rounded-xl bg-[#0c0e17] px-4 py-3 text-[#f0f0fd] ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-[#83aeff]/60"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="block text-xs font-bold tracking-widest text-[#737580] uppercase">
                      Fiyat (kuruş)
                    </span>
                    <input
                      name="priceKurus"
                      type="number"
                      min={0}
                      required
                      defaultValue={editingEvent?.priceKurus ?? 0}
                      className="w-full rounded-xl bg-[#0c0e17] px-4 py-3 text-[#f0f0fd] ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-[#83aeff]/60"
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="block text-xs font-bold tracking-widest text-[#737580] uppercase">
                      Kategori
                    </span>
                    <input
                      name="category"
                      required
                      defaultValue={editingEvent?.category ?? ""}
                      className="w-full rounded-xl bg-[#0c0e17] px-4 py-3 text-[#f0f0fd] ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-[#83aeff]/60"
                    />
                  </label>
                  <label className="space-y-2 text-sm md:col-span-2">
                    <span className="block text-xs font-bold tracking-widest text-[#737580] uppercase">
                      Etkinlik görseli
                    </span>
                    <input
                      name="image"
                      type="file"
                      accept="image/*"
                      className="w-full rounded-xl bg-[#0c0e17] px-4 py-3 text-[#f0f0fd] ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-[#83aeff]/60"
                    />
                    <input
                      type="hidden"
                      name="imageUrl"
                      value={editingEvent?.imageUrl ?? ""}
                    />
                    {editingEvent ? (
                      <p className="text-xs text-[#aaaab7]">
                        Yeni dosya seçmezsen mevcut görsel korunur.
                      </p>
                    ) : (
                      <p className="text-xs text-[#aaaab7]">
                        Yeni etkinlik için bir görsel yüklemen gerekir.
                      </p>
                    )}
                  </label>
                </div>

                <label className="mt-4 flex items-center gap-3 text-sm text-[#d3d8e8]">
                  <input
                    name="isFeatured"
                    type="checkbox"
                    defaultChecked={editingEvent?.isFeatured ?? false}
                    className="h-4 w-4 rounded border-white/20 bg-[#0c0e17]"
                  />
                  Öne çıkar
                </label>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-xl border border-[#83aeff]/40 bg-[#83aeff]/20 px-4 py-3 font-['Plus_Jakarta_Sans',sans-serif] text-sm font-bold text-[#dbe7ff] transition-colors hover:bg-[#83aeff]/30"
                  >
                    <AppIcon name="add" className="h-4 w-4" />
                    {editingEvent ? "Güncelle" : "Etkinlik oluştur"}
                  </button>
                  {editingEvent ? (
                    <Link
                      href="/admin?tab=events"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#464752]/20 bg-white/5 px-4 py-3 font-['Plus_Jakarta_Sans',sans-serif] text-sm font-bold text-[#f0f0fd] transition-colors hover:bg-white/10"
                    >
                      İptal
                    </Link>
                  ) : null}
                </div>
              </form>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {events.map((event: EventRecord) => (
                  <article
                    key={event.id}
                    className="overflow-hidden rounded-2xl border border-[#464752]/15 bg-[#11131d]"
                  >
                    <div className="border-b border-[#464752]/15 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-bold tracking-widest text-[#83aeff] uppercase">
                          {event.category}
                        </p>
                        {event.isFeatured ? (
                          <span className="rounded-full border border-[#00fdc6]/30 bg-[#00fdc6]/10 px-2 py-1 text-[10px] font-bold text-[#00fdc6]">
                            Featured
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold">
                        {event.title}
                      </h2>
                    </div>
                    <div className="space-y-2 p-4 text-sm text-[#ced3e5]">
                      <p>{event.description}</p>
                      <p>
                        {event.venue} • {event.city}
                      </p>
                      <p>{formatDate(event.startAt)}</p>
                      <p className="font-bold text-[#00fdc6]">
                        {formatPrice(event.priceKurus)}
                      </p>
                    </div>
                    <div className="flex gap-2 border-t border-[#464752]/15 p-4">
                      <Link
                        href={`/admin?tab=events&edit=${event.id}`}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-[#83aeff]/40 bg-[#83aeff]/10 px-3 py-2 text-sm font-bold text-[#dbe7ff] transition-colors hover:bg-[#83aeff]/20"
                      >
                        <AppIcon name="edit" className="h-4 w-4" />
                        Düzenle
                      </Link>
                      <form action={deleteEvent}>
                        <input type="hidden" name="eventId" value={event.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#ff8578]/40 bg-[#ff8578]/10 px-3 py-2 text-sm font-bold text-[#ffb2aa] transition-colors hover:bg-[#ff8578]/20"
                        >
                          <AppIcon name="trash" className="h-4 w-4" />
                          Sil
                        </button>
                      </form>
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {activeTab === "tickets" ? (
            <>
              <header className="glass-card rounded-2xl border border-[#464752]/15 p-6">
                <p className="text-xs font-bold tracking-widest text-[#83aeff] uppercase">
                  Bilet Yönetimi
                </p>
                <h1 className="mt-2 font-['Space_Grotesk',sans-serif] text-4xl font-bold tracking-tight md:text-5xl">
                  Sipariş ve biletler
                </h1>
              </header>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-[#464752]/15 bg-[#11131d] p-4">
                  <p className="text-xs tracking-wider text-[#aaaab7] uppercase">
                    Bekleyen
                  </p>
                  <p className="mt-1 font-['Space_Grotesk',sans-serif] text-3xl font-bold text-[#f0f0fd]">
                    {pendingPurchases.length}
                  </p>
                </div>
                <div className="rounded-xl border border-[#464752]/15 bg-[#11131d] p-4">
                  <p className="text-xs tracking-wider text-[#aaaab7] uppercase">
                    Onaylanan
                  </p>
                  <p className="mt-1 font-['Space_Grotesk',sans-serif] text-3xl font-bold text-[#00fdc6]">
                    {approvedPurchases}
                  </p>
                </div>
                <div className="rounded-xl border border-[#464752]/15 bg-[#11131d] p-4">
                  <p className="text-xs tracking-wider text-[#aaaab7] uppercase">
                    Bekleyen Tutar
                  </p>
                  <p className="mt-1 font-['Space_Grotesk',sans-serif] text-3xl font-bold text-[#83aeff]">
                    {formatPrice(pendingRevenue)}
                  </p>
                </div>
              </div>

              <section className="space-y-4">
                {purchases.length === 0 ? (
                  <article className="rounded-xl border border-[#464752]/15 bg-[#11131d] px-5 py-8 text-center text-sm text-[#aaaab7]">
                    Gosterilecek siparis bulunamadi.
                  </article>
                ) : (
                  purchases.map((purchase: PurchaseRecord) => (
                    <article
                      key={purchase.id}
                      className="rounded-xl border border-[#464752]/15 bg-[#11131d] p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold tracking-widest text-[#83aeff] uppercase">
                            Siparis {purchase.id.slice(0, 8)}
                          </p>
                          <h2 className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#f0f0fd]">
                            {purchase.quantity} Bilet •{" "}
                            {formatPrice(purchase.totalKurus)}
                          </h2>
                          <p className="mt-2 text-sm text-[#ced3e5]">
                            {purchase.user.name ?? "Isimsiz Kullanici"} |{" "}
                            {purchase.buyerPhone}
                          </p>
                          <p className="text-xs text-[#aaaab7]">
                            {formatDate(purchase.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${
                            purchase.status === "APPROVED"
                              ? "border-[#00fdc6]/40 bg-[#00fdc6]/10 text-[#00fdc6]"
                              : "border-[#ff51fa]/40 bg-[#ff51fa]/10 text-[#ffb6fb]"
                          }`}
                        >
                          {purchase.status}
                        </span>
                      </div>

                      <div className="mt-4 rounded-lg border border-[#464752]/15 bg-black/25 p-3">
                        <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#f0f0fd]">
                          <AppIcon
                            name="confirmation_number"
                            className="h-4 w-4 text-[#83aeff]"
                          />
                          Biletler
                        </div>
                        <div className="space-y-2">
                          {purchase.tickets.map((ticket: TicketRecord) => (
                            <p
                              key={ticket.id}
                              className="rounded-md border border-[#464752]/20 bg-[#11131d] px-3 py-2 font-mono text-xs text-[#d3d8e8]"
                            >
                              {ticket.ticketNumber} • {ticket.status}
                            </p>
                          ))}
                        </div>
                      </div>

                      {purchase.status !== "APPROVED" ? (
                        <form action={approvePurchase} className="mt-4">
                          <input
                            type="hidden"
                            name="purchaseId"
                            value={purchase.id}
                          />
                          <button
                            type="submit"
                            className="inline-flex items-center gap-2 rounded-xl border border-[#83aeff]/40 bg-[#83aeff]/20 px-4 py-2 text-sm font-bold text-[#dbe7ff] transition-colors hover:bg-[#83aeff]/30"
                          >
                            <AppIcon name="security" className="h-4 w-4" />
                            Odemeyi Onayla ve Biletleri Aktif Et
                          </button>
                        </form>
                      ) : (
                        <p className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#00fdc6]/30 bg-[#00fdc6]/10 px-3 py-2 text-xs font-bold text-[#00fdc6]">
                          <AppIcon name="stars" className="h-4 w-4" />
                          Bu siparis onaylandi.
                        </p>
                      )}
                    </article>
                  ))
                )}
              </section>
            </>
          ) : null}

          {activeTab === "users" ? (
            <>
              {params?.roleUpdated ? (
                <p className="rounded-xl border border-[#00fdc6]/30 bg-[#00fdc6]/10 px-4 py-3 text-sm font-semibold text-[#77ffe3]">
                  Kullanıcı rolü güncellendi.
                </p>
              ) : null}
              {params?.error ? (
                <p className="rounded-xl border border-[#ff8578]/30 bg-[#430d12] px-4 py-3 text-sm font-semibold text-[#ffb2aa]">
                  Kullanıcı işlemi yapılamadı. Yetki veya form verilerini
                  kontrol et.
                </p>
              ) : null}

              <header className="glass-card rounded-2xl border border-[#464752]/15 p-6">
                <p className="text-xs font-bold tracking-widest text-[#83aeff] uppercase">
                  Kullanıcı Yönetimi
                </p>
                <h1 className="mt-2 font-['Space_Grotesk',sans-serif] text-4xl font-bold tracking-tight md:text-5xl">
                  Kayıtlı kullanıcılar
                </h1>
              </header>

              <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {users.map((user: UserRecord) => (
                  <article
                    key={user.id}
                    className="rounded-2xl border border-[#464752]/15 bg-[#11131d] p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-bold tracking-widest text-[#83aeff] uppercase">
                          {user.role}
                        </p>
                        <h2 className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#f0f0fd]">
                          {user.name ?? "Isimsiz Kullanici"}
                        </h2>
                        <p className="mt-2 text-sm text-[#ced3e5]">
                          {user.email ?? "Email yok"}
                        </p>
                        <p className="text-sm text-[#aaaab7]">
                          {user.phone ?? "Telefon yok"}
                        </p>
                      </div>
                      <AppIcon
                        name="user_cog"
                        className="h-8 w-8 text-[#83aeff]"
                      />
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-[#464752]/15 bg-black/25 p-3">
                        <p className="text-xs tracking-widest text-[#aaaab7] uppercase">
                          Sipariş
                        </p>
                        <p className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#f0f0fd]">
                          {user._count.purchases}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#464752]/15 bg-black/25 p-3">
                        <p className="text-xs tracking-widest text-[#aaaab7] uppercase">
                          Bilet
                        </p>
                        <p className="mt-1 font-['Space_Grotesk',sans-serif] text-2xl font-bold text-[#00fdc6]">
                          {user._count.tickets}
                        </p>
                      </div>
                    </div>

                    <form
                      action={updateUserRole}
                      className="mt-4 flex items-end gap-3"
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <label className="flex-1 space-y-2 text-sm">
                        <span className="block text-xs font-bold tracking-widest text-[#737580] uppercase">
                          Rol
                        </span>
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="w-full rounded-xl bg-[#0c0e17] px-4 py-3 text-[#f0f0fd] ring-1 ring-white/10 outline-none focus:ring-2 focus:ring-[#83aeff]/60"
                        >
                          <option value="USER">USER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      </label>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl border border-[#83aeff]/40 bg-[#83aeff]/20 px-4 py-3 text-sm font-bold text-[#dbe7ff] transition-colors hover:bg-[#83aeff]/30"
                      >
                        <AppIcon name="edit" className="h-4 w-4" />
                        Kaydet
                      </button>
                    </form>
                  </article>
                ))}
              </section>
            </>
          ) : null}
        </section>
      </div>
    </main>
  );
}
