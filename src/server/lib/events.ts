/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { db } from "~/server/db";

export type EventCard = {
  id: string;
  slug: string;
  title: string;
  description: string;
  venue: string;
  city: string;
  startAt: Date;
  imageUrl: string;
  priceKurus: number;
  category: string;
  isFeatured: boolean;
};

const DEFAULT_EVENTS = [
  {
    slug: "neon-genesis-techno-night",
    title: "Neon Genesis: Techno Night",
    description: "Featuring DJ ARDA and special guests",
    venue: "Sky Club",
    city: "Izmir",
    startAt: new Date("2026-10-24T20:00:00.000Z"),
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDs86eLdMBExGk7RTomJ5LSLbtwVpHKAv2gP8mOLDBQs4uIDFcDlWg1aZfuRsbXzM6xPKmw7jfoMrl0xRp014JWTulwZx6DYUYSHBsX92TgcmLESuamOlDNhKluwOfEDGUy6dbtrh8TdB5mOhp0GR4NwrYW6RgCLiZ-BJGGaUY_lGNMJdez4RLhTNuTIC73Z72VZgmrvQn44E24XjZ_PWPrKLH85mWwt8j1hbnUewqZIvIHHmuEkjyK6jpMEe3ZhVJY41Zu-foOhCLl",
    priceKurus: 25000,
    category: "Techno",
    isFeatured: true,
  },
  {
    slug: "bakircay-welcome-bash",
    title: "Bakircay Welcome Bash",
    description: "Official freshers opening night",
    venue: "Grand Hall",
    city: "Izmir",
    startAt: new Date("2026-10-26T19:30:00.000Z"),
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBMw2wmZUctNOPHP-UWz8I0yU4k-p7S3rwkFEIrfFZIilnftr6sjyRPOGEAznu9uRP55DKs_Q7Tkki7Zj74n6ttBpVuiWDTTiptuBDdeQcX9B-Cp900UTS3qDaFt4a8_w6-cIzbRtmh-Qio46QA6dS9KOdxeoFcrmF3l7XMY00IHH2lZToT0v-BBCWvRAGPDKj0NjlAzA-enRjsahxKpQR-5O1RCMhNe0d-W0CTN7u8BOv_ZEbxpkFD0YDgN8GZ4ZgmmWURd3Z8dhXV",
    priceKurus: 18000,
    category: "Campus",
    isFeatured: false,
  },
  {
    slug: "retro-vibes-80s-disco",
    title: "Retro Vibes: 80s Disco",
    description: "Dress code: Vintage Electric",
    venue: "Neon Lounge",
    city: "Izmir",
    startAt: new Date("2026-10-27T21:00:00.000Z"),
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA8DrdrUoFQNzSAeM2SW4fyuMqRjSBfIWw9Mo4-mFuYjDVSk_c41nSWI6Iw1xt7Z8dkh343t2215Aqhkxk226wlkF7IJKHQdksYPf1mM1dBaCfSrrlhXn_Zqluwe__3_Y7s3tMnRPYw0R-L6anmiqVLsF8PnbvWGCnRapZMm6JRLgnnXEcQMBayMeNWlgFiIGnyT9RrGKBv8SqYGLQZerDQh3XpJLGrZeuBOq0fsKJepOhhuIkt8T-n6KxwjRXw_bJPqhOcMxEEeX91",
    priceKurus: 15000,
    category: "Disco",
    isFeatured: false,
  },
];

export async function getEvents(): Promise<EventCard[]> {
  const count = await db.event.count();

  if (count === 0) {
    await db.event.createMany({
      data: DEFAULT_EVENTS,
      skipDuplicates: true,
    });
  }

  const events = await db.event.findMany({
    orderBy: [{ isFeatured: "desc" }, { startAt: "asc" }],
  });

  return events as EventCard[];
}
